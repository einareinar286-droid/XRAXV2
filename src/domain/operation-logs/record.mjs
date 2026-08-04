const ACTIONS = new Set([
  'DUTY_SUBMIT', 'DUTY_APPROVE', 'DUTY_RETURN',
  'ISSUE_REPORT', 'ISSUE_ASSIGN', 'ISSUE_RECTIFY', 'ISSUE_CLOSE', 'ISSUE_REOPEN',
  'IMPORT_PREVIEW', 'IMPORT_CONFIRM', 'LOGIN_SUCCESS', 'LOGIN_FAILURE'
])

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function sanitizeOperationNote(value) {
  return text(value)
    .replace(/(?:password|token|secret|credential)\s*[:=]\s*\S+/gi, '[已脱敏]')
    .replace(/https?:\/\/\S+/gi, '[链接已隐藏]')
    .replace(/\s+/g, ' ')
    .slice(0, 160)
}

export function createOperationLogRecord({ id, occurredAt, actor, action, targetType, targetId, result, note } = {}) {
  if (!actor?.uid || !ACTIONS.has(action) || !text(targetType) || !text(targetId) || !['SUCCESS', 'FAILURE'].includes(result)) {
    throw Object.assign(new Error('操作日志字段无效'), { code: 'INVALID_OPERATION_LOG' })
  }
  return {
    id: text(id) || `op-${Date.now()}`,
    occurredAt: text(occurredAt) || new Date().toISOString(),
    actorId: actor.uid,
    actorName: text(actor.displayName) || '未知操作人',
    actorDepartment: text(actor.department) || '未知部门',
    action,
    targetType: text(targetType),
    targetId: text(targetId),
    result,
    note: sanitizeOperationNote(note)
  }
}
