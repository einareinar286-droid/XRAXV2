import { createWorkbenchSummary } from '../../domain/workbench/summary.mjs'
import { getCurrentUser, listIssues } from '../issues/index.mjs'
import { getDutyDashboard } from '../duties/index.mjs'

export async function getWorkbenchSnapshot({ generatedAt = new Date().toISOString() } = {}) {
  const user = await getCurrentUser()
  const issueResult = await listIssues({ page: 1, pageSize: 100 })
  let dutyDashboard = null

  try {
    dutyDashboard = await getDutyDashboard({ asOf: generatedAt })
  } catch (error) {
    if (error.code !== 'FORBIDDEN') throw error
  }

  return {
    user,
    ...createWorkbenchSummary({
      issues: issueResult.items,
      dutyDashboard,
      generatedAt,
      dataMode: 'MOCK'
    })
  }
}
