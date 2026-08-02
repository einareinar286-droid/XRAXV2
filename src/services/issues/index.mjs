import { ISSUE_ROLE_TEXT, ISSUE_SEVERITY_TEXT, ISSUE_STATUS_TEXT } from '../../domain/issues/constants.mjs'
import { createMockIssueAdapter } from './mock-adapter.mjs'
import { seedAuditEvents, seedIssues } from './mock-data.mjs'

let issueSequence = 0

function createIssueId() {
  issueSequence += 1
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  return `XR-${date}-${String(100 + issueSequence).padStart(3, '0')}`
}

const adapter = createMockIssueAdapter({ idFactory: createIssueId, seedIssues, seedAuditEvents })

if (typeof uni !== 'undefined') {
  const savedRole = uni.getStorageSync('xr-mock-issue-role')
  if (savedRole) {
    try { adapter.setMockRole(savedRole) } catch { uni.removeStorageSync('xr-mock-issue-role') }
  }
}

export const isMockIssueMode = true

export const getCurrentUser = (...args) => adapter.getCurrentUser(...args)
export const listIssues = (...args) => adapter.listIssues(...args)
export const getIssue = (...args) => adapter.getIssue(...args)
export const reportIssue = (...args) => adapter.reportIssue(...args)
export const assignIssue = (...args) => adapter.assignIssue(...args)
export const submitRectification = (...args) => adapter.submitRectification(...args)
export const reviewIssue = (...args) => adapter.reviewIssue(...args)
export const listAuditEvents = (...args) => adapter.listAuditEvents(...args)

export function setMockRole(role) {
  const user = adapter.setMockRole(role)
  if (typeof uni !== 'undefined') uni.setStorageSync('xr-mock-issue-role', role)
  return user
}

export function createRequestId(prefix = 'issue') {
  const random = Math.random().toString(36).slice(2, 10)
  return `${prefix}-${Date.now()}-${random}`
}

export function issueStatusText(status) {
  return ISSUE_STATUS_TEXT[status] || status
}

export function issueRoleText(role) {
  return ISSUE_ROLE_TEXT[role] || role
}

export function issueSeverityText(severity) {
  return ISSUE_SEVERITY_TEXT[severity] || severity
}
