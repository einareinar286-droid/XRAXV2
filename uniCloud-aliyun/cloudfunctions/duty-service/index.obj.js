const uniID = require('uni-id-common')

const ADMIN_ROLE = 'SAFETY_ADMIN'
const DAY = 24 * 60 * 60 * 1000

function parseDay(value) {
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function formatDay(value) {
  return value.toISOString().slice(0, 10)
}

function addDays(value, count) {
  return new Date(value.getTime() + count * DAY)
}

function addMonthsClamped(value, count) {
  const targetMonth = value.getUTCMonth() + count
  const targetYear = value.getUTCFullYear() + Math.floor(targetMonth / 12)
  const normalizedMonth = ((targetMonth % 12) + 12) % 12
  const lastDay = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate()
  return new Date(Date.UTC(targetYear, normalizedMonth, Math.min(value.getUTCDate(), lastDay)))
}

function chinaToday() {
  return new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function advancePeriod(startDay, frequency) {
  const start = parseDay(startDay)
  let end
  if (frequency === 'daily') end = start
  else if (frequency === 'weekly') end = addDays(start, 6)
  else if (frequency === 'biweekly') end = addDays(start, 13)
  else if (frequency === 'monthly') end = addDays(addMonthsClamped(start, 1), -1)
  else if (frequency === 'quarterly') end = addDays(addMonthsClamped(start, 3), -1)
  else if (frequency === 'semiannual') end = addDays(addMonthsClamped(start, 6), -1)
  else if (frequency === 'annual') end = addDays(addMonthsClamped(start, 12), -1)
  else throw new Error('INVALID_FREQUENCY')
  return { periodStart: formatDay(start), periodEnd: formatDay(end), dueDate: formatDay(end) }
}

module.exports = {
  async _before() {
    this.db = uniCloud.database()
    const clientInfo = this.getClientInfo()
    const uniId = uniID.createInstance({ clientInfo })
    const token = await uniId.checkToken(clientInfo.uniIdToken)
    if (token.errCode || !token.uid) throw new Error('UNAUTHORIZED')
    this.auth = { uid: token.uid, roles: token.role || [] }
  },

  isAdmin() {
    return this.auth.roles.includes(ADMIN_ROLE)
  },

  assertAdmin() {
    if (!this.isAdmin()) throw new Error('FORBIDDEN')
  },

  async myInstances({ status, category } = {}) {
    const where = { ownerUid: this.auth.uid }
    if (status) where.status = status
    if (category) where.category = category
    const result = await this.db.collection('xr-duty-instances').where(where).orderBy('dueDate', 'asc').get()
    return result.data
  },

  async adminInstances({ status, category, department, ownerUid, page = 1, pageSize = 100 } = {}) {
    this.assertAdmin()
    const safePage = Math.max(1, Number(page) || 1)
    const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 100))
    const where = {}
    if (status) where.status = status
    if (category) where.category = category
    if (department) where.department = department
    if (ownerUid) where.ownerUid = ownerUid
    const collection = this.db.collection('xr-duty-instances').where(where)
    const [result, counted] = await Promise.all([
      collection.orderBy('dueDate', 'asc').skip((safePage - 1) * safePageSize).limit(safePageSize).get(),
      collection.count()
    ])
    return { data: result.data, total: counted.total, page: safePage, pageSize: safePageSize }
  },

  async submitInstance({ instanceId, description, files = [] }) {
    if (!instanceId || !description || !description.trim()) throw new Error('INVALID_PAYLOAD')
    const instance = await this.db.collection('xr-duty-instances').doc(instanceId).get()
    const item = instance.data[0]
    if (!item || item.ownerUid !== this.auth.uid) throw new Error('FORBIDDEN')
    if (item.status === 'DONE') throw new Error('PERIOD_ALREADY_LOCKED')
    const now = Date.now()
    await this.db.collection('xr-duty-instances').doc(instanceId).update({
      status: 'DONE', description: description.trim(), files, completedAt: now, updatedAt: now
    })
    await this.db.collection('xr-duty-audit').add({
      instanceId, action: 'SUBMIT', actorUid: this.auth.uid, createdAt: now, payload: { fileCount: files.length }
    })
    return { ok: true }
  },

  async _timing() {
    const db = uniCloud.database()
    const today = chinaToday()
    const command = db.command
    await db.collection('xr-duty-instances').where({
      status: 'PENDING', dueDate: command.lt(today)
    }).update({ status: 'OVERDUE', updatedAt: Date.now() })

    const assignments = await db.collection('xr-duty-assignments').where({ enabled: true }).get()
    let created = 0
    for (const assignment of assignments.data) {
      const latest = await db.collection('xr-duty-instances').where({ assignmentId: assignment._id })
        .orderBy('periodEnd', 'desc').limit(1).get()
      let nextStart = latest.data[0]
        ? addDays(parseDay(latest.data[0].periodEnd), 1)
        : parseDay(assignment.effectiveFrom)
      for (let count = 0; formatDay(nextStart) <= today && count < 48; count += 1) {
        const next = advancePeriod(formatDay(nextStart), assignment.frequency)
        await db.collection('xr-duty-instances').add({
          assignmentId: assignment._id,
          ownerUid: assignment.ownerUid,
          ownerName: assignment.ownerName,
          department: assignment.department,
          actionName: assignment.actionName,
          category: assignment.category,
          frequency: assignment.frequency,
          ...next,
          status: 'PENDING',
          createdAt: Date.now(),
          updatedAt: Date.now()
        })
        created += 1
        nextStart = addDays(parseDay(next.periodEnd), 1)
      }
    }
    return { created }
  }
}
