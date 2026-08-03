function dateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null
  return value.slice(0, 10)
}

function isOnTimeApproved(task) {
  if (task.status !== 'APPROVED') return false
  const dueDate = dateOnly(task.dueDate)
  const submittedDate = dateOnly(task.submittedAt)
  return Boolean(dueDate && submittedDate && submittedDate <= dueDate)
}

export function calculateDutyMetrics(tasks, { asOf = new Date().toISOString() } = {}) {
  const asOfDate = dateOnly(asOf)
  const dueTasks = tasks.filter((task) => {
    const dueDate = dateOnly(task.dueDate)
    return Boolean(dueDate && (!asOfDate || dueDate <= asOfDate))
  })
  const onTimeApprovedTasks = dueTasks.filter(isOnTimeApproved)
  const assessmentTasks = dueTasks.filter((task) => !isOnTimeApproved(task))
  const dueCount = dueTasks.length

  return {
    dueCount,
    onTimeApprovedCount: onTimeApprovedTasks.length,
    completionRate: dueCount ? Number(((onTimeApprovedTasks.length / dueCount) * 100).toFixed(2)) : null,
    qualified: dueCount > 0 && onTimeApprovedTasks.length === dueCount,
    assessmentCount: assessmentTasks.length,
    assessmentTaskIds: assessmentTasks.map((task) => task.id),
    applicable: dueCount > 0
  }
}

export function getDutyAssessmentReason(task) {
  if (task.status === 'RETURNED') return '审核退回未通过'
  if (task.status === 'PENDING') return '未提交履职记录'
  if (task.status === 'SUBMITTED') return '待审核未通过'
  if (task.status === 'APPROVED') return '逾期提交'
  return '未达到按时审核通过要求'
}
