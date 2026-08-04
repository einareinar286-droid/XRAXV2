import assert from 'node:assert/strict'
import test from 'node:test'

import { createDutyDashboard } from '../../src/domain/duties/dashboard.mjs'

const asOf = '2026-08-12T00:00:00.000Z'

test('builds company, department and people duty metrics from the same source tasks', () => {
  const dashboard = createDutyDashboard({
    employees: [
      { employeeId: 'EMP-000001', uid: 'u-1', displayName: '演示甲', department: '安全监察部', position: '检查员' },
      { employeeId: 'EMP-000002', uid: 'u-2', displayName: '演示乙', department: '市场营销部', position: '送气工' },
      { employeeId: 'EMP-000003', uid: 'u-3', displayName: '演示丙', department: '市场营销部', position: '送气工' }
    ],
    duties: [
      { id: 'duty-1', ownerUid: 'u-1', ownerName: '演示甲', department: '安全监察部', dueDate: '2026-08-10', status: 'APPROVED', submittedAt: '2026-08-09T08:00:00.000Z' },
      { id: 'duty-2', ownerUid: 'u-2', ownerName: '演示乙', department: '市场营销部', dueDate: '2026-08-10', status: 'SUBMITTED', submittedAt: '2026-08-10T08:00:00.000Z' }
    ],
    asOf
  })

  assert.equal(dashboard.company.dueCount, 2)
  assert.equal(dashboard.company.onTimeApprovedCount, 1)
  assert.equal(dashboard.company.completionRate, 50)
  assert.equal(dashboard.company.assessmentCount, 1)
  assert.deepEqual(dashboard.departments.map((item) => [item.department, item.employeeCount, item.completionRate]), [
    ['安全监察部', 1, 100],
    ['市场营销部', 2, 0]
  ])
  assert.deepEqual(dashboard.people.map((item) => [item.employeeId, item.dutyStatus, item.completionRate, item.assessmentCount]), [
    ['EMP-000001', 'COMPLETED', 100, 0],
    ['EMP-000002', 'ASSESSMENT', 0, 1],
    ['EMP-000003', 'NOT_APPLICABLE', null, 0]
  ])
  assert.deepEqual(dashboard.reviewItems.map((item) => item.id), ['duty-2'])
  assert.deepEqual(dashboard.assessmentItems.map((item) => [item.id, item.assessmentReason]), [['duty-2', '待审核未通过']])
})

test('filters company, department and people metrics by a single period type', () => {
  const dashboard = createDutyDashboard({
    periodType: 'MONTHLY',
    employees: [
      { employeeId: 'EMP-000001', uid: 'u-1', displayName: '演示甲', department: '安全监察部', position: '检查员' },
      { employeeId: 'EMP-000002', uid: 'u-2', displayName: '演示乙', department: '市场营销部', position: '送气工' }
    ],
    duties: [
      { id: 'd-1', title: '每周检查', department: '安全监察部', ownerUid: 'u-1', dueDate: '2026-07-31', periodType: 'WEEKLY', status: 'APPROVED', submittedAt: '2026-07-28T08:00:00.000Z' },
      { id: 'd-2', title: '每月检查', department: '安全监察部', ownerUid: 'u-1', dueDate: '2026-07-31', periodType: 'MONTHLY', status: 'PENDING', submittedAt: null },
      { id: 'd-3', title: '每月活动', department: '市场营销部', ownerUid: 'u-2', dueDate: '2026-07-20', periodType: 'MONTHLY', status: 'APPROVED', submittedAt: '2026-07-19T08:00:00.000Z' }
    ],
    asOf: '2026-08-01T00:00:00.000Z'
  })

  // 只统计 MONTHLY 任务：d-2、d-3
  assert.equal(dashboard.company.dueCount, 2)
  assert.equal(dashboard.company.onTimeApprovedCount, 1)
  assert.equal(dashboard.company.assessmentCount, 1)
  assert.deepEqual(dashboard.company.assessmentTaskIds, ['d-2'])
  assert.equal(dashboard.reviewItems.length, 0)
  assert.equal(dashboard.departments.length, 2)
})
