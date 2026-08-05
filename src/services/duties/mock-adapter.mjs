import { validateAttachments } from '../../domain/issues/validation.mjs'
import { createDutyDashboard } from '../../domain/duties/dashboard.mjs'
import { canReviewDuty, canViewCompanyDutyDashboard, canViewDutyPeople } from '../../domain/duties/access-policy.mjs'
import { isDueForRollover, nextCycleRange } from '../../domain/duties/periods.mjs'
import { defaultOperationLogAdapter } from '../operation-logs/mock-adapter.mjs'

const USERS = Object.freeze({
  SUPER_ADMIN: { uid: 'super-admin-001', displayName: '超级管理员', role: 'SUPER_ADMIN', department: '安全监察部' },
  SAFETY_OFFICER: { uid: 'safety-001', displayName: '安全监察员', role: 'SAFETY_OFFICER', department: '安全监察部' },
  MARKETING_OFFICER: { uid: 'marketing-001', displayName: '市场营销员', role: 'MARKETING_OFFICER', department: '市场营销部' },
  EMPLOYEE: { uid: 'employee-001', displayName: '普通员工', role: 'EMPLOYEE', department: '安全监察部' }
})

function clone(value) {
  return deepClone(value)
}

function dutyError(code, message) {
  return Object.assign(new Error(message), { code })
}

function validateSubmission(payload) {
  const note = typeof payload?.note === 'string' ? payload.note.trim() : ''
  if (note.length > 1000) throw dutyError('INVALID_PAYLOAD', '履职说明不能超过 1000 个字符')
  const attachments = validateAttachments(payload.attachments || [])
  if (!note && attachments.length === 0) throw dutyError('INVALID_PAYLOAD', '请填写履职说明或上传现场佐证')
  return { note, attachments }
}

function validateReview(payload) {
  if (!['APPROVE', 'RETURN'].includes(payload?.decision)) throw dutyError('INVALID_PAYLOAD', '审核决定无效')
  const note = typeof payload?.note === 'string' ? payload.note.trim() : ''
  if (payload.decision === 'RETURN' && !note) throw dutyError('INVALID_PAYLOAD', '退回必须填写原因')
  return { decision: payload.decision, note }
}


// 兼容深拷贝：微信小程序基础库无 structuredClone，数据均为纯 JSON，用 JSON 深拷贝兜底
function deepClone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value))
}

export function createMockDutyAdapter({ now = () => new Date().toISOString(), seedTasks = [], seedEmployees, operationLog = defaultOperationLogAdapter } = {}) {
  const tasks = clone(seedTasks)
  const employees = clone(seedEmployees || [...new Map(tasks.map((task, index) => [task.ownerUid, {
    employeeId: `EMP-${String(index + 1).padStart(6, '0')}`,
    uid: task.ownerUid,
    displayName: task.ownerName || '匿名员工',
    department: task.department,
    position: '员工'
  }])).values()])
  let currentUser = clone(USERS.SAFETY_OFFICER)

  function findTask(id) {
    const task = tasks.find((item) => item.id === id)
    if (!task) throw dutyError('NOT_FOUND', '履职任务不存在')
    return task
  }

  function canManageTask(task) {
    return canReviewDuty(currentUser, task)
  }

  function visibleTasks() {
    if (canViewCompanyDutyDashboard(currentUser)) return tasks
    return tasks.filter((task) => task.ownerUid === currentUser.uid)
  }

  function buildDashboard(asOf, periodType) {
    return createDutyDashboard({ duties: visibleTasks(), employees, asOf, periodType })
  }

  function rolloverDueCycles(asOf) {
    for (const task of [...tasks]) {
      if (!isDueForRollover(task, asOf)) continue
      const range = nextCycleRange(task.periodType, task.dueDate)
      const next = {
        ...clone(task),
        id: `${task.id}-cyc-${range.key}`,
        dueDate: range.end,
        cycleStart: range.start,
        cycleEnd: range.end,
        cycleKey: range.key,
        status: 'PENDING',
        evidence: [],
        submittedAt: null,
        review: null,
        cycleRolledOver: false
      }
      task.cycleRolledOver = true
      tasks.push(next)
    }
  }

  function appendOperation(action, task, note) {
    operationLog.append({
      occurredAt: now(),
      actor: currentUser,
      action,
      targetType: 'Duty',
      targetId: task.id,
      result: 'SUCCESS',
      note
    })
  }

  return {
    setMockRole(role) {
      if (!USERS[role]) throw dutyError('INVALID_PAYLOAD', '未知的 Mock 角色')
      currentUser = clone(USERS[role])
      return clone(currentUser)
    },

    async getCurrentUser() {
      return clone(currentUser)
    },

    async listMyDuties() {
      rolloverDueCycles(now())
      return clone(tasks.filter((task) => task.ownerUid === currentUser.uid && !task.cycleRolledOver))
    },

    async submitDuty(id, payload) {
      const task = findTask(id)
      if (task.ownerUid !== currentUser.uid) throw dutyError('FORBIDDEN', '只能提交本人履职任务')
      if (!['PENDING', 'RETURNED'].includes(task.status)) throw dutyError('INVALID_TRANSITION', '当前状态不能提交履职')
      const valid = validateSubmission(payload)
      task.status = 'SUBMITTED'
      task.evidence = { note: valid.note, attachments: clone(valid.attachments) }
      task.submittedAt = now()
      task.review = null
      appendOperation('DUTY_SUBMIT', task, '待提交 -> 待审核')
      return clone(task)
    },

    async reviewDuty(id, payload) {
      const task = findTask(id)
      if (!canManageTask(task)) throw dutyError('FORBIDDEN', '当前角色不能审核该部门履职')
      if (task.status !== 'SUBMITTED') throw dutyError('INVALID_TRANSITION', '仅已提交履职可以审核')
      const valid = validateReview(payload)
      task.status = valid.decision === 'APPROVE' ? 'APPROVED' : 'RETURNED'
      task.review = { decision: valid.decision, note: valid.note, reviewerUid: currentUser.uid, reviewedAt: now() }
      appendOperation(valid.decision === 'APPROVE' ? 'DUTY_APPROVE' : 'DUTY_RETURN', task, valid.decision === 'APPROVE' ? '待审核 -> 已通过' : '待审核 -> 已退回')
      return clone(task)
    },

    async getDutyDashboard({ asOf, periodType } = {}) {
      if (!canViewCompanyDutyDashboard(currentUser)) {
        throw dutyError('FORBIDDEN', '当前角色不能查看履职仪表盘')
      }
      rolloverDueCycles(now())
      return clone(buildDashboard(asOf, periodType))
    },

    async listDutyPeople({ department, dutyStatus, keyword, periodType } = {}) {
      if (!canViewDutyPeople(currentUser)) throw dutyError('FORBIDDEN', '当前角色不能查看全员履职明细')
      rolloverDueCycles(now())
      const normalizedKeyword = typeof keyword === 'string' ? keyword.trim() : ''
      return clone(buildDashboard(undefined, periodType).people
        .filter((person) => !department || person.department === department)
        .filter((person) => !dutyStatus || person.dutyStatus === dutyStatus)
        .filter((person) => !normalizedKeyword || [person.displayName, person.department, person.position].some((value) => value?.includes(normalizedKeyword))))
    }
  }
}
