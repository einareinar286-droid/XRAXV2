// duty-service 云对象：履职周期实例 + 审核 + 仪表盘（P1 版）
// 状态机：PENDING → SUBMITTED → APPROVED / RETURNED（可重提）；逾期 OVERDUE
// 权限（EE 决策 3）：仅 SUPER_ADMIN 可审核与查看全员；其余角色只填报本人
const uniID = require('uni-id-common')

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

function dateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null
  return value.slice(0, 10)
}

function isOnTimeApproved(instance) {
  if (instance.status !== 'APPROVED') return false
  const dueDate = dateOnly(instance.dueDate)
  const submittedDate = dateOnly(instance.submittedAt)
  return Boolean(dueDate && submittedDate && submittedDate <= dueDate)
}

// 周期推进：daily 当天；weekly/biweekly/monthly/quarterly/semiannual/annual 顺延
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

// 仪表盘聚合（复刻前端 src/domain/duties/dashboard.mjs + metrics.mjs）
function calculateMetrics(instances, { asOf } = {}) {
  const asOfDate = dateOnly(asOf)
  const dueTasks = instances.filter((task) => {
    const dueDate = dateOnly(task.dueDate)
    return Boolean(dueDate && (!asOfDate || dueDate <= asOfDate))
  })
  const onTimeApprovedTasks = dueTasks.filter(isOnTimeApproved)
  const assessmentTasks = dueTasks.filter((task) => !isOnTimeApproved(task))
  const dueCount = dueTasks.length
  return {
    dueCount,
    onTimeApprovedCount: onTimeApprovedTasks.length,
    completionRate: dueCount ? Number(((onTimeApprovedTasks.length / dueCount) * 100).toFixed(2)) : null,
    qualified: dueCount > 0 && onTimeApprovedTasks.length === dueCount,
    assessmentCount: assessmentTasks.length,
    assessmentTaskIds: assessmentTasks.map((task) => task._id),
    applicable: dueCount > 0
  }
}

function getDutyStatus(metrics) {
  if (!metrics.applicable) return 'NOT_APPLICABLE'
  return metrics.qualified ? 'COMPLETED' : 'ASSESSMENT'
}

function getAssessmentReason(task) {
  if (task.status === 'RETURNED') return '审核退回未通过'
  if (task.status === 'PENDING') return '未提交履职记录'
  if (task.status === 'SUBMITTED') return '待审核未通过'
  if (task.status === 'APPROVED') return '逾期提交'
  return '未达到按时审核通过要求'
}

// 权限检查（模块级，不依赖 this 绑定；isAdmin 已实测可用）
function requireAdmin(context) {
  const roles = context?.auth?.roles || []
  if (!roles.includes('SUPER_ADMIN')) throw new Error('FORBIDDEN')
}

// 内部：拉取全部实例（按 periodType 过滤）——模块级，避免云对象 this 绑定问题
async function collectAll(db, periodType) {
  const where = periodType ? { periodType } : {}
  const result = await db.collection('xr-duty-instances').where(where).limit(1000).get()
  return result.data
}

// 内部：人员聚合（ownerUid 去重）——模块级
function buildPeople(instances, asOf) {
  const byUid = new Map()
  for (const item of instances) {
    if (!byUid.has(item.ownerUid)) {
      byUid.set(item.ownerUid, {
        employeeId: `EMP-${item.ownerUid}`,
        uid: item.ownerUid,
        displayName: item.ownerName || item.ownerUid,
        department: item.department || '',
        position: '员工',
        duties: []
      })
    }
    byUid.get(item.ownerUid).duties.push(item)
  }
  return [...byUid.values()]
    .map((person) => {
      const metrics = calculateMetrics(person.duties, { asOf })
      const { duties, ...rest } = person
      return { ...rest, ...metrics, dutyStatus: getDutyStatus(metrics) }
    })
    .sort((left, right) => left.department.localeCompare(right.department) || left.employeeId.localeCompare(right.employeeId))
}

module.exports = {
  async __debug() {
    const methods = Object.keys(this).filter((k) => typeof this[k] === 'function')
    return {
      methods,
      hasAssertAdmin: typeof this.assertAdmin,
      hasIsAdmin: typeof this.isAdmin,
      auth: this.auth ? { uid: this.auth.uid, roles: this.auth.roles } : null,
      hasDb: Boolean(this.db)
    }
  },

  async _before() {
    this.db = uniCloud.database()
    const clientInfo = this.getClientInfo()
    // uni-id 配置内联（避免依赖云端 uni-config-center 的 uni-id/config.json 上传缺失）
    const uniId = uniID.createInstance({
      clientInfo,
      config: {
        tokenSecret: 'db18e3b07793430077bfbea1d20aedfacb13e4dafad42687b166116e014fc1df',
        tokenExpiresIn: 7200,
        tokenExpiresThreshold: 1200,
        passwordErrorLimit: 6,
        passwordErrorRetryTime: 3600
      }
    })
    const token = await uniId.checkToken(clientInfo.uniIdToken)
    if (token.errCode || !token.uid) throw new Error('UNAUTHORIZED')
    this.auth = { uid: token.uid, roles: token.role || [] }
  },

  // 决策 3：仅 SUPER_ADMIN 可管理（审核/全员/增删改）
  isAdmin() {
    return this.auth.roles.includes('SUPER_ADMIN')
  },



  // 本人履职实例列表（对齐前端 task 形状）
  async myDuties({ status, category, periodType } = {}) {
    const where = { ownerUid: this.auth.uid }
    if (status) where.status = status
    if (category) where.category = category
    if (periodType) where.periodType = periodType
    const result = await this.db.collection('xr-duty-instances').where(where).orderBy('dueDate', 'asc').get()
    return result.data
  },

  // 管理员实例列表（仅 SUPER_ADMIN）
  async adminInstances({ status, category, department, ownerUid, page = 1, pageSize = 100 } = {}) {
    requireAdmin(this)
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

  // 提交履职：PENDING/RETURNED → SUBMITTED（对齐前端 submitDuty）
  async submitDuty({ instanceId, note, attachments = [] } = {}) {
    if (!instanceId || !note || !String(note).trim()) throw new Error('INVALID_PAYLOAD')
    const instance = await this.db.collection('xr-duty-instances').doc(instanceId).get()
    const item = instance.data[0]
    if (!item || item.ownerUid !== this.auth.uid) throw new Error('FORBIDDEN')
    if (!['PENDING', 'RETURNED'].includes(item.status)) throw new Error('INVALID_TRANSITION')
    const now = new Date().toISOString()
    await this.db.collection('xr-duty-instances').doc(instanceId).update({
      status: 'SUBMITTED',
      evidence: { note: String(note).trim(), attachments },
      submittedAt: now,
      review: null,
      updatedAt: Date.now()
    })
    await this.db.collection('xr-duty-audit').add({
      instanceId, action: 'SUBMIT', actorUid: this.auth.uid, createdAt: Date.now(), payload: { fileCount: attachments.length }
    })
    return { ok: true, status: 'SUBMITTED' }
  },

  // 审核履职：SUBMITTED → APPROVED / RETURNED（仅 SUPER_ADMIN）
  async reviewDuty({ instanceId, decision, note = '' } = {}) {
    requireAdmin(this)
    if (!['APPROVE', 'RETURN'].includes(decision)) throw new Error('INVALID_PAYLOAD')
    if (decision === 'RETURN' && !String(note).trim()) throw new Error('INVALID_PAYLOAD')
    const instance = await this.db.collection('xr-duty-instances').doc(instanceId).get()
    const item = instance.data[0]
    if (!item) throw new Error('NOT_FOUND')
    if (item.status !== 'SUBMITTED') throw new Error('INVALID_TRANSITION')
    const nextStatus = decision === 'APPROVE' ? 'APPROVED' : 'RETURNED'
    const now = new Date().toISOString()
    await this.db.collection('xr-duty-instances').doc(instanceId).update({
      status: nextStatus,
      review: { decision, note: String(note).trim(), reviewerUid: this.auth.uid, reviewedAt: now },
      updatedAt: Date.now()
    })
    await this.db.collection('xr-duty-audit').add({
      instanceId, action: decision === 'APPROVE' ? 'APPROVE' : 'RETURN', actorUid: this.auth.uid, createdAt: Date.now(), payload: { decision }
    })
    return { ok: true, status: nextStatus }
  },

  // 履职仪表盘（公司/部门/人员聚合；仅 SUPER_ADMIN）
  async dutyDashboard({ asOf, periodType } = {}) {
    requireAdmin(this)
    const instances = await collectAll(this.db, periodType)
    const company = calculateMetrics(instances, { asOf })
    const people = buildPeople(instances, asOf)
    const departments = [...new Set(instances.map((item) => item.department).filter(Boolean))].sort().map((department) => {
      const metrics = calculateMetrics(instances.filter((item) => item.department === department), { asOf })
      return { department, employeeCount: people.filter((p) => p.department === department).length, ...metrics }
    })
    return {
      company,
      departments,
      people,
      reviewItems: instances.filter((item) => item.status === 'SUBMITTED'),
      assessmentItems: instances
        .filter((item) => company.assessmentTaskIds.includes(item._id))
        .map((item) => ({ ...item, assessmentReason: getAssessmentReason(item) }))
    }
  },

  // 全员履职明细（部门/状态/关键字；仅 SUPER_ADMIN）
  async dutyPeople({ department, dutyStatus, keyword, periodType } = {}) {
    requireAdmin(this)
    const instances = await collectAll(this.db, periodType)
    const normalizedKeyword = typeof keyword === 'string' ? keyword.trim() : ''
    return buildPeople(instances, undefined)
      .filter((person) => !department || person.department === department)
      .filter((person) => !dutyStatus || person.dutyStatus === dutyStatus)
      .filter((person) => !normalizedKeyword || [person.displayName, person.department, person.position].some((value) => value?.includes(normalizedKeyword)))
  },

  // 定时任务：逾期置 OVERDUE + 按分配生成周期实例
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
        const periodType = { weekly: 'WEEKLY', biweekly: 'BIWEEKLY', monthly: 'MONTHLY', quarterly: 'QUARTERLY', semiannual: 'SEMIANNUAL', annual: 'ANNUAL', daily: 'DAILY' }[assignment.frequency] || 'MONTHLY'
        await db.collection('xr-duty-instances').add({
          assignmentId: assignment._id,
          ownerUid: assignment.ownerUid,
          ownerName: assignment.ownerName,
          department: assignment.department,
          actionName: assignment.actionName,
          title: assignment.actionName,
          category: assignment.category,
          frequency: assignment.frequency,
          periodType,
          cycleKey: `${assignment.frequency}-${next.periodStart}`,
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
