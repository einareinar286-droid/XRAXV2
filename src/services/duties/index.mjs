import { createMockDutyAdapter } from './mock-adapter.mjs'
import { seedDutyTasks } from './mock-data.mjs'
import { createCloudDutyAdapter } from './cloud-adapter.mjs'
import { isCloudDutyMode } from './mode.mjs'

// 模式切换（决策 4）：Mock 默认；VITE_XR_DUTY_MODE=cloud 时使用云端 duty-service
const useCloud = isCloudDutyMode()

const adapter = useCloud
  ? createCloudDutyAdapter()
  : createMockDutyAdapter({ seedTasks: seedDutyTasks })

if (!useCloud && typeof uni !== 'undefined') {
  const savedRole = uni.getStorageSync('xr-mock-issue-role')
  if (savedRole) {
    try { adapter.setMockRole(savedRole) } catch { uni.removeStorageSync('xr-mock-issue-role') }
  }
}

export const isMockDutyMode = !useCloud
export const getCurrentUser = (...args) => adapter.getCurrentUser(...args)
export const listMyDuties = (...args) => adapter.listMyDuties(...args)
export const submitDuty = (...args) => adapter.submitDuty(...args)
export const reviewDuty = (...args) => adapter.reviewDuty(...args)
export const getDutyDashboard = (...args) => adapter.getDutyDashboard(...args)
export const listDutyPeople = (...args) => adapter.listDutyPeople(...args)
export const setMockRole = (...args) => adapter.setMockRole(...args)

export function dutyStatusText(status) {
  return ({ PENDING: '待提交', SUBMITTED: '待审核', APPROVED: '已按时通过', RETURNED: '已退回', OVERDUE: '已逾期' })[status] || status
}
