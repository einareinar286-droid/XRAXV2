import test from 'node:test'
import assert from 'node:assert/strict'

import { createWorkbenchSummary } from '../../src/domain/workbench/summary.mjs'

test('summarizes closure metrics, duty metrics and priority work items from one snapshot', () => {
  const summary = createWorkbenchSummary({
    issues: [
      { id: 'closed', status: 'CLOSED', isMajor: false, deadline: '2026-08-01' },
      { id: 'major', status: 'REPORTED', isMajor: true, deadline: null },
      { id: 'review', status: 'RECTIFICATION_SUBMITTED', isMajor: false, deadline: '2026-08-02' },
      { id: 'assigned', status: 'ASSIGNED', isMajor: false, deadline: '2026-08-04' }
    ],
    dutyDashboard: {
      company: { completionRate: 80, assessmentCount: 1 },
      reviewItems: [{ id: 'duty-review' }]
    },
    generatedAt: '2026-08-03T08:00:00.000Z',
    dataMode: 'MOCK'
  })

  assert.deepEqual(summary.issueMetrics, {
    total: 4,
    reported: 1,
    assigned: 1,
    review: 1,
    closed: 1,
    major: 1
  })
  assert.deepEqual(summary.dutyMetrics, {
    completionRate: 80,
    reviewCount: 1,
    assessmentCount: 1
  })
  assert.equal(summary.priorityItems[0].id, 'major')
  assert.equal(summary.dataMode, 'MOCK')
  assert.equal(summary.generatedAt, '2026-08-03T08:00:00.000Z')
})

test('keeps duty metrics unavailable when the current role cannot read them', () => {
  const summary = createWorkbenchSummary({ issues: [], dutyDashboard: null, generatedAt: '2026-08-03T08:00:00.000Z' })
  assert.equal(summary.dutyMetrics, null)
  assert.deepEqual(summary.priorityItems, [])
})
