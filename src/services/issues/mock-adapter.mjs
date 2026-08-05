import { issueError } from '../../domain/issues/errors.mjs'
import { assertCanReadIssue, canReadIssue } from '../../domain/issues/policy.mjs'
import { assertIssueTransition } from '../../domain/issues/state-machine.mjs'
import {
  validateAssignmentPayload,
  validateRectificationPayload,
  validateReportPayload,
  validateReviewPayload
} from '../../domain/issues/validation.mjs'
import { defaultOperationLogAdapter } from '../operation-logs/mock-adapter.mjs'

const USERS = {
  SUPER_ADMIN: {
    uid: 'super-admin-001',
    displayName: '超级管理员',
    role: 'SUPER_ADMIN',
    department: '安全监察部',
    departmentScope: ['*'],
    isMock: true
  },
  SAFETY_OFFICER: {
    uid: 'safety-001',
    displayName: '安全监察员',
    role: 'SAFETY_OFFICER',
    department: '安全监察部',
    departmentScope: ['*'],
    isMock: true
  },
  MARKETING_OFFICER: {
    uid: 'marketing-001',
    displayName: '市场营销员',
    role: 'MARKETING_OFFICER',
    department: '市场营销部',
    departmentScope: ['市场营销部'],
    isMock: true
  },
  EMPLOYEE: {
    uid: 'employee-001',
    displayName: '普通员工',
    role: 'EMPLOYEE',
    department: '生产运营部',
    departmentScope: ['生产运营部'],
    isMock: true
  }
}

function clone(value) {
  return deepClone(value)
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]))
  }
  return value
}

function fingerprint(payload, allowedKeys) {
  const selected = Object.fromEntries(allowedKeys.filter((key) => key in payload).map((key) => [key, payload[key]]))
  return JSON.stringify(canonicalize(selected))
}


// 兼容深拷贝：微信小程序基础库无 structuredClone，数据均为纯 JSON，用 JSON 深拷贝兜底
function deepClone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value))
}

export function createMockIssueAdapter({
  now = () => new Date().toISOString(),
  idFactory = () => `XR-${Date.now()}`,
  seedIssues = [],
  seedAuditEvents = [],
  operationLog = defaultOperationLogAdapter
} = {}) {
  const issues = clone(seedIssues)
  const auditEvents = clone(seedAuditEvents)
  const completedRequests = new Map()
  let currentUser = clone(USERS.SAFETY_OFFICER)
  let auditSequence = auditEvents.length

  function findIssue(id) {
    const issue = issues.find((item) => item.id === id)
    if (!issue) throw issueError('NOT_FOUND', '隐患不存在')
    return issue
  }

  function assertVersion(issue, version) {
    if (issue.version !== version) {
      throw issueError('VERSION_CONFLICT', '数据已更新，请刷新后重试', {
        currentVersion: issue.version,
        receivedVersion: version
      })
    }
  }

  function appendAudit(issue, action, fromStatus, toStatus, requestId, payloadSummary = {}) {
    auditSequence += 1
    auditEvents.push({
      id: `audit-${auditSequence}`,
      entityType: 'Issue',
      entityId: issue.id,
      action,
      fromStatus,
      toStatus,
      actorUid: currentUser.uid,
      actorRole: currentUser.role,
      occurredAt: now(),
      requestId,
      payloadSummary
    })
    const operationAction = ({
      REPORT: 'ISSUE_REPORT',
      ASSIGN: 'ISSUE_ASSIGN',
      SUBMIT_RECTIFICATION: 'ISSUE_RECTIFY',
      CLOSE: 'ISSUE_CLOSE',
      REOPEN: 'ISSUE_REOPEN'
    })[action]
    if (operationAction) {
      operationLog.append({
        occurredAt: now(),
        actor: currentUser,
        action: operationAction,
        targetType: 'Issue',
        targetId: issue.id,
        result: 'SUCCESS',
        note: `${fromStatus || '无状态'} -> ${toStatus}`
      })
    }
  }

  function transition(issue, toStatus, action, requestId, payloadSummary = {}) {
    const fromStatus = issue.status
    issue.status = toStatus
    issue.version += 1
    issue.updatedAt = now()
    appendAudit(issue, action, fromStatus, toStatus, requestId, payloadSummary)
    return clone(issue)
  }

  function idempotent(operation, issueId, payload, allowedKeys, work) {
    const key = `${currentUser.uid}:${operation}:${issueId}:${payload.requestId}`
    const payloadFingerprint = fingerprint(payload, allowedKeys)
    const completed = completedRequests.get(key)
    if (completed) {
      if (completed.fingerprint !== payloadFingerprint) {
        throw issueError('DUPLICATE_REQUEST', '同一 requestId 不能用于不同请求')
      }
      return clone(completed.result)
    }
    const result = work()
    completedRequests.set(key, { fingerprint: payloadFingerprint, result: clone(result) })
    return result
  }

  return {
    setMockRole(role) {
      if (!USERS[role]) throw issueError('INVALID_PAYLOAD', '未知的 Mock 角色')
      currentUser = clone(USERS[role])
      return clone(currentUser)
    },

    async getCurrentUser() {
      return clone(currentUser)
    },

    async getIssue(id) {
      const issue = findIssue(id)
      assertCanReadIssue(currentUser, issue)
      return clone(issue)
    },

    async listIssues({ status, severity, isMajor, page = 1, pageSize = 20 } = {}) {
      const safePage = Math.max(1, Number(page) || 1)
      const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 20))
      const readable = issues
        .filter((issue) => canReadIssue(currentUser, issue))
        .filter((issue) => !status || issue.status === status)
        .filter((issue) => !severity || issue.severity === severity)
        .filter((issue) => typeof isMajor !== 'boolean' || issue.isMajor === isMajor)
        .sort((left, right) => {
          if (left.isMajor !== right.isMajor) return left.isMajor ? -1 : 1
          if (left.deadline && right.deadline && left.deadline !== right.deadline) return left.deadline.localeCompare(right.deadline)
          if (left.deadline !== right.deadline) return left.deadline ? -1 : 1
          return right.createdAt.localeCompare(left.createdAt)
        })
      const offset = (safePage - 1) * safePageSize
      return {
        items: clone(readable.slice(offset, offset + safePageSize)),
        total: readable.length,
        page: safePage,
        pageSize: safePageSize,
        hasMore: offset + safePageSize < readable.length
      }
    },

    async reportIssue(payload) {
      const valid = validateReportPayload(payload)
      const timestamp = now()
      const issue = {
        id: idFactory(),
        title: valid.title,
        category: valid.category,
        severity: valid.severity,
        isMajor: valid.isMajor,
        description: valid.description,
        location: valid.location,
        locationSource: valid.locationSource,
        coordinates: valid.coordinates,
        attachments: valid.attachments,
        status: 'REPORTED',
        reporter: {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          department: currentUser.department
        },
        assignee: null,
        departmentScope: [currentUser.department],
        deadline: null,
        rectification: null,
        createdAt: timestamp,
        updatedAt: timestamp,
        version: 1
      }
      issues.unshift(issue)
      appendAudit(issue, 'REPORT', null, 'REPORTED', `report:${issue.id}`, {
        attachmentCount: issue.attachments.length,
        severity: issue.severity,
        isMajor: issue.isMajor
      })
      return clone(issue)
    },

    async assignIssue(id, payload) {
      if (!['SAFETY_OFFICER', 'SUPER_ADMIN'].includes(currentUser.role)) throw issueError('FORBIDDEN', '当前角色不能交办隐患')
      const valid = validateAssignmentPayload(payload)
      return idempotent('ASSIGN', id, valid, ['assigneeUid', 'assigneeDepartment', 'deadline', 'version'], () => {
        const issue = findIssue(id)
        assertCanReadIssue(currentUser, issue)
        assertVersion(issue, valid.version)
        assertIssueTransition(issue.status, 'ASSIGNED', currentUser.role)
        issue.assignee = {
          uid: valid.assigneeUid,
          displayName: USERS.MARKETING_OFFICER.displayName,
          department: valid.assigneeDepartment
        }
        issue.deadline = valid.deadline
        return transition(issue, 'ASSIGNED', 'ASSIGN', valid.requestId, {
          assigneeUid: valid.assigneeUid,
          assigneeDepartment: valid.assigneeDepartment,
          deadline: valid.deadline
        })
      })
    },

    async submitRectification(id, payload) {
      if (currentUser.role !== 'MARKETING_OFFICER') throw issueError('FORBIDDEN', '当前角色不能提交整改')
      const valid = validateRectificationPayload(payload)
      return idempotent('SUBMIT_RECTIFICATION', id, valid, ['note', 'attachments', 'version'], () => {
        const issue = findIssue(id)
        if (issue.assignee?.uid !== currentUser.uid && issue.assignee?.department !== currentUser.department) throw issueError('FORBIDDEN', '该隐患未交办给当前用户或部门')
        assertVersion(issue, valid.version)
        assertIssueTransition(issue.status, 'RECTIFICATION_SUBMITTED', currentUser.role)
        issue.rectification = {
          note: valid.note,
          attachments: clone(valid.attachments),
          submittedBy: {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            department: currentUser.department
          },
          submittedAt: now()
        }
        return transition(issue, 'RECTIFICATION_SUBMITTED', 'SUBMIT_RECTIFICATION', valid.requestId, {
          attachmentCount: issue.rectification.attachments.length
        })
      })
    },

    async reviewIssue(id, payload) {
      if (!['SAFETY_OFFICER', 'SUPER_ADMIN'].includes(currentUser.role)) throw issueError('FORBIDDEN', '当前角色不能复核隐患')
      const valid = validateReviewPayload(payload)
      return idempotent('REVIEW', id, valid, ['decision', 'note', 'version'], () => {
        const issue = findIssue(id)
        assertCanReadIssue(currentUser, issue)
        assertVersion(issue, valid.version)
        if (valid.decision === 'REOPEN') {
          assertIssueTransition(issue.status, 'REPORTED', currentUser.role)
          issue.assignee = null
          issue.deadline = null
          return transition(issue, 'REPORTED', 'REOPEN', valid.requestId, {
            decision: valid.decision,
            reasonLength: valid.note.length
          })
        }
        if (valid.decision === 'CLOSE') {
          assertIssueTransition(issue.status, 'CLOSED', currentUser.role)
          return transition(issue, 'CLOSED', 'CLOSE', valid.requestId, { decision: valid.decision })
        }
        if (valid.decision === 'REJECT') {
          assertIssueTransition(issue.status, 'REJECTED', currentUser.role)
          return transition(issue, 'REJECTED', 'REJECT', valid.requestId, { decision: valid.decision })
        }
        throw issueError('INVALID_TRANSITION', '不支持的复核决定')
      })
    },

    async listAuditEvents(id) {
      const issue = findIssue(id)
      assertCanReadIssue(currentUser, issue)
      return clone(auditEvents.filter((event) => event.entityId === id))
    }
  }
}
