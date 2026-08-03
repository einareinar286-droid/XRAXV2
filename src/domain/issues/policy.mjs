import { issueError } from './errors.mjs'

export function canReadIssue(user, issue) {
  if (!user) return false
  if (user.role === 'SUPER_ADMIN' || user.role === 'SAFETY_OFFICER') return true
  if (user.role === 'MARKETING_OFFICER') return issue.assignee?.uid === user.uid || issue.assignee?.department === user.department
  return user.role === 'EMPLOYEE' && issue.reporter?.uid === user.uid
}

export function assertCanReadIssue(user, issue) {
  if (!canReadIssue(user, issue)) throw issueError('FORBIDDEN', '无权读取该隐患')
}
