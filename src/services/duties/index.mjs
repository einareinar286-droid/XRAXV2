import { createMockDutyAdapter } from './mock-adapter.mjs'
import { seedDutyTasks } from './mock-data.mjs'

const adapter = createMockDutyAdapter({ seedTasks: seedDutyTasks })

export const isMockDutyMode = true
export const getCurrentUser = (...args) => adapter.getCurrentUser(...args)
export const listMyDuties = (...args) => adapter.listMyDuties(...args)
export const submitDuty = (...args) => adapter.submitDuty(...args)
export const reviewDuty = (...args) => adapter.reviewDuty(...args)
export const getDutyDashboard = (...args) => adapter.getDutyDashboard(...args)
export const setMockRole = (...args) => adapter.setMockRole(...args)

export function dutyStatusText(status) {
  return ({ PENDING: '待提交', SUBMITTED: '待审核', APPROVED: '已按时通过', RETURNED: '已退回' })[status] || status
}
