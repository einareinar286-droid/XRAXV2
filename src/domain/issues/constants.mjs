import { ROLE } from '../access/roles.mjs'

export const ISSUE_STATUSES = Object.freeze({
  REPORTED: 'REPORTED',
  ASSIGNED: 'ASSIGNED',
  RECTIFICATION_SUBMITTED: 'RECTIFICATION_SUBMITTED',
  REJECTED: 'REJECTED',
  CLOSED: 'CLOSED'
})

export const ISSUE_ROLES = ROLE

export const ISSUE_SEVERITIES = Object.freeze(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
export const ISSUE_CATEGORIES = Object.freeze(['用户用气安全', '配送作业', '厂站设备', '管网设施', '安全管理'])

export const ISSUE_STATUS_TEXT = Object.freeze({
  REPORTED: '待交办',
  ASSIGNED: '待整改',
  RECTIFICATION_SUBMITTED: '待复核',
  REJECTED: '整改退回',
  CLOSED: '已闭环'
})

export const ISSUE_ROLE_TEXT = Object.freeze({
  SUPER_ADMIN: '超级管理员',
  SAFETY_OFFICER: '安全监察部',
  MARKETING_OFFICER: '市场营销部',
  EMPLOYEE: '员工'
})

export const ISSUE_SEVERITY_TEXT = Object.freeze({
  LOW: '低',
  MEDIUM: '一般',
  HIGH: '较高',
  CRITICAL: '重大'
})
