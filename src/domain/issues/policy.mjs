import { issueError } from './errors.mjs'

function intersects(left = [], right = []) {
  return left.includes('*') || left.some((item) => right.includes(item))
}

export function canReadIssue(user, issue) {
  if (!user) return false
  if (user.role === 'SAFETY_ADMIN') return true
  if (user.role === 'SAFETY_INSPECTOR') {
    return user.departmentScope.includes('*') || issue.departmentScope.includes(user.department)
  }
  if (user.role === 'MARKETING_RECTIFIER') {
    return issue.assignee?.uid === user.uid || issue.assignee?.department === user.department
  }
  if (user.role === 'EXECUTIVE_READONLY') {
    return intersects(user.departmentScope, issue.departmentScope)
  }
  return false
}

export function assertCanReadIssue(user, issue) {
  if (!canReadIssue(user, issue)) throw issueError('FORBIDDEN', '无权读取该隐患')
}
