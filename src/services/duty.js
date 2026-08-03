export {
  dutyStatusText,
  getCurrentUser,
  getDutyDashboard,
  isMockDutyMode,
  listMyDuties,
  reviewDuty,
  setMockRole,
  submitDuty
} from './duties/index.mjs'

export function dutyAssessmentText(task) {
  return task?.assessmentReason || '未达到按时审核通过要求'
}
