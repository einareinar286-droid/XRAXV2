const COMPANY_DUTY_ROLES = new Set(['SUPER_ADMIN', 'SAFETY_OFFICER'])

function hasCompanyDutyRole(user) {
  return COMPANY_DUTY_ROLES.has(user?.role)
}

export function canViewCompanyDutyDashboard(user) {
  return hasCompanyDutyRole(user)
}

export function canViewDutyPeople(user) {
  return hasCompanyDutyRole(user)
}

export function canReviewDuty(user) {
  return user?.role === 'SUPER_ADMIN'
}

export function canViewOperationLogs(user) {
  return hasCompanyDutyRole(user)
}

export function canAccessOwnDuty(user, duty) {
  return Boolean(user?.uid && duty?.ownerUid && user.uid === duty.ownerUid)
}
