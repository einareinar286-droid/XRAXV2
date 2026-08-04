import { validateAttachments } from '../../domain/issues/validation.mjs'
import { createDutyDashboard } from '../../domain/duties/dashboard.mjs'
import { canReviewDuty, canViewCompanyDutyDashboard, canViewDutyPeople } from '../../domain/duties/access-policy.mjs'
import { defaultOperationLogAdapter } from '../operation-logs/mock-adapter.mjs'

const USERS = Object.freeze({
  SUPER_ADMIN: { uid: 'super-admin-001', displayName: '超级管理员', role: 'SUPER_ADMIN', department: '安全监察部' },
  SAFETY_OFFICER: { uid: 'safety-001', displayName: '安全监察员', role: 'SAFETY_OFFICER', department: '安全监察部' },
  MARKETING_OFFICER: { uid: 'marketing-001', displayName: '市场营销员', role: 'MARKETING_OFFICER', department: '市场营销部' },
  EMPLOYEE: { uid: 'employee-001', displayName: '普通员工', role: 'EMPLOYEE', department: '安全监察部' }
})

function clone(value) {
  return structuredClone(value)
}

function dutyError(code, message) {
  return Object.assign(new Error(message), { code })
}

function validateSubmission(payload) {
  const note = typeof payload?.note === 'string' ? payload.note.trim() : ''
  if (!note || note.length > 1000) throw dutyError('INVALID_PAYLOAD', '履职说明长度应为 1 至 1000 个字符')
  return { note, attachments: validateAttachments(payload.attachments || []) }
}

function validateReview(payload) {
  if (!['APPROVE', 'RETURN'].includes(payload?.decision)) throw dutyError('INVALID_PAYLOAD', '审核决定无效')
  const note = typeof payload?.note === 'string' ? payload.note.trim() : ''
  if (payload.decision === 'RETURN' && !note) throw dutyError('INVALID_PAYLOAD', '退回必须填写原因')
  return { decision: payload.decision, note }
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

  function buildDashboard(asOf) {
    return createDutyDashboard({ duties: visibleTasks(), employees, asOf })
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
      return clone(tasks.filter((task) => task.ownerUid === currentUser.uid))
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

    async getDutyDashboard({ asOf } = {}) {
      if (!canViewCompanyDutyDashboard(currentUser)) {
        throw dutyError('FORBIDDEN', '当前角色不能查看履职仪表盘')
      }
      return clone(buildDashboard(asOf))
    },

    async listDutyPeople({ department, dutyStatus, keyword } = {}) {
      if (!canViewDutyPeople(currentUser)) throw dutyError('FORBIDDEN', '当前角色不能查看全员履职明细')
      const normalizedKeyword = typeof keyword === 'string' ? keyword.trim() : ''
      return clone(buildDashboard().people
        .filter((person) => !department || person.department === department)
        .filter((person) => !dutyStatus || person.dutyStatus === dutyStatus)
        .filter((person) => !normalizedKeyword || [person.displayName, person.department, person.position].some((value) => value?.includes(normalizedKeyword))))
    }
  }
}
