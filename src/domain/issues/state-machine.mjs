import { issueError } from './errors.mjs'

const TRANSITIONS = Object.freeze({
  REPORTED: ['ASSIGNED'],
  ASSIGNED: ['RECTIFICATION_SUBMITTED'],
  REJECTED: ['RECTIFICATION_SUBMITTED'],
  RECTIFICATION_SUBMITTED: ['CLOSED', 'REJECTED'],
  CLOSED: ['REPORTED']
})

export function assertIssueTransition(fromStatus, toStatus, actorRole) {
  if (fromStatus === 'CLOSED' && toStatus !== 'REPORTED') {
    throw issueError('CLOSED_IMMUTABLE', '已闭环隐患不可编辑')
  }
  if (fromStatus === 'CLOSED' && toStatus === 'REPORTED' && actorRole !== 'SUPER_ADMIN') {
    throw issueError('FORBIDDEN', '仅超级管理员可留痕重开')
  }
  if (!TRANSITIONS[fromStatus]?.includes(toStatus)) {
    throw issueError('INVALID_TRANSITION', `不允许从 ${fromStatus} 转换到 ${toStatus}`)
  }
}
