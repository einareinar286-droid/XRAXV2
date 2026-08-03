const PRIORITY_STATUS = Object.freeze({
  RECTIFICATION_SUBMITTED: 2,
  REPORTED: 1
})

function countByStatus(issues, status) {
  return issues.filter((issue) => issue.status === status).length
}

function comparePriority(left, right) {
  if (left.isMajor !== right.isMajor) return left.isMajor ? -1 : 1
  const leftStatus = PRIORITY_STATUS[left.status] || 0
  const rightStatus = PRIORITY_STATUS[right.status] || 0
  if (leftStatus !== rightStatus) return rightStatus - leftStatus
  if (left.deadline && right.deadline && left.deadline !== right.deadline) return left.deadline.localeCompare(right.deadline)
  if (left.deadline !== right.deadline) return left.deadline ? -1 : 1
  return String(left.id).localeCompare(String(right.id))
}

export function createWorkbenchSummary({ issues = [], dutyDashboard = null, generatedAt, dataMode = 'MOCK' } = {}) {
  return {
    dataMode,
    generatedAt,
    issueMetrics: {
      total: issues.length,
      reported: countByStatus(issues, 'REPORTED'),
      assigned: countByStatus(issues, 'ASSIGNED'),
      review: countByStatus(issues, 'RECTIFICATION_SUBMITTED'),
      closed: countByStatus(issues, 'CLOSED'),
      major: issues.filter((issue) => issue.isMajor).length
    },
    dutyMetrics: dutyDashboard
      ? {
          completionRate: dutyDashboard.company.completionRate,
          reviewCount: dutyDashboard.reviewItems.length,
          assessmentCount: dutyDashboard.company.assessmentCount
        }
      : null,
    priorityItems: [...issues].filter((issue) => issue.status !== 'CLOSED').sort(comparePriority).slice(0, 8)
  }
}
