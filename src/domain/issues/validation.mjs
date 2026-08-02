import { ISSUE_CATEGORIES, ISSUE_SEVERITIES } from './constants.mjs'
import { issueError } from './errors.mjs'

const ALLOWED_ATTACHMENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024
const LOCAL_PREVIEW_URL = /^(blob:|wxfile:\/\/|mock-private:\/\/|file:\/\/|https?:\/\/tmp\/|\/|[a-z]:[\\/])/i

function invalid(field, message) {
  throw issueError('INVALID_PAYLOAD', message, { field })
}

function requiredText(value, field, maxLength) {
  if (typeof value !== 'string' || !value.trim()) invalid(field, `${field} 不能为空`)
  const normalized = value.trim()
  if (normalized.length > maxLength) invalid(field, `${field} 长度不能超过 ${maxLength}`)
  return normalized
}

export function validateAttachments(value = []) {
  if (!Array.isArray(value)) invalid('attachments', '附件必须为数组')
  if (value.length > 6) invalid('attachments', '附件数量不能超过 6 个')
  return value.map((attachment, index) => {
    if (!attachment || typeof attachment !== 'object') invalid(`attachments.${index}`, '附件格式无效')
    if (!ALLOWED_ATTACHMENT_TYPES.has(attachment.mimeType)) invalid(`attachments.${index}.mimeType`, '附件类型不支持')
    if (!Number.isFinite(attachment.size) || attachment.size < 0 || attachment.size > MAX_ATTACHMENT_SIZE) {
      invalid(`attachments.${index}.size`, '附件大小不能超过 10 MiB')
    }
    const id = requiredText(attachment.id, `attachments.${index}.id`, 200)
    const name = requiredText(attachment.name, `attachments.${index}.name`, 200)
    let previewUrl = ''
    if (attachment.previewUrl != null && attachment.previewUrl !== '') {
      previewUrl = requiredText(attachment.previewUrl, `attachments.${index}.previewUrl`, 1000)
      if (!LOCAL_PREVIEW_URL.test(previewUrl)) {
        throw issueError('ATTACHMENT_FORBIDDEN', 'Mock 附件只允许本地临时预览地址', { field: `attachments.${index}.previewUrl` })
      }
    }
    return {
      id,
      name,
      mimeType: attachment.mimeType,
      size: attachment.size,
      ...(previewUrl ? { previewUrl } : {})
    }
  })
}

export function validateReportPayload(payload) {
  if (!payload || typeof payload !== 'object') invalid('payload', '上报内容无效')
  const title = requiredText(payload.title, 'title', 60)
  const description = requiredText(payload.description, 'description', 1000)
  const location = requiredText(payload.location, 'location', 200)
  if (!ISSUE_CATEGORIES.includes(payload.category)) invalid('category', '隐患类别无效')
  if (!ISSUE_SEVERITIES.includes(payload.severity)) invalid('severity', '严重程度无效')
  if (typeof payload.isMajor !== 'boolean') invalid('isMajor', '重大隐患标记必须为布尔值')
  return {
    title,
    category: payload.category,
    severity: payload.severity,
    isMajor: payload.isMajor,
    description,
    location,
    attachments: validateAttachments(payload.attachments)
  }
}

function validateWriteMetadata(payload) {
  if (!payload || typeof payload !== 'object') invalid('payload', '写入内容无效')
  if (!Number.isInteger(payload.version) || payload.version < 1) invalid('version', 'version 必须为正整数')
  const requestId = requiredText(payload.requestId, 'requestId', 100)
  return { version: payload.version, requestId }
}

export function validateAssignmentPayload(payload) {
  const metadata = validateWriteMetadata(payload)
  const assigneeUid = requiredText(payload.assigneeUid, 'assigneeUid', 100)
  if (payload.assigneeDepartment !== '市场营销部') invalid('assigneeDepartment', '只能交办给市场营销部')
  if (typeof payload.deadline !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(payload.deadline)) {
    invalid('deadline', 'deadline 必须为 YYYY-MM-DD')
  }
  return { ...metadata, assigneeUid, assigneeDepartment: payload.assigneeDepartment, deadline: payload.deadline }
}

export function validateRectificationPayload(payload) {
  const metadata = validateWriteMetadata(payload)
  return {
    ...metadata,
    note: requiredText(payload.note, 'note', 1000),
    attachments: validateAttachments(payload.attachments)
  }
}

export function validateReviewPayload(payload) {
  const metadata = validateWriteMetadata(payload)
  if (!['CLOSE', 'REJECT', 'REOPEN'].includes(payload.decision)) invalid('decision', '复核决定无效')
  let note = ''
  if (payload.decision === 'REJECT' || payload.decision === 'REOPEN') {
    note = requiredText(payload.note, 'note', 1000)
  } else if (payload.note != null && payload.note !== '') {
    note = requiredText(payload.note, 'note', 1000)
  }
  return { ...metadata, decision: payload.decision, note }
}
