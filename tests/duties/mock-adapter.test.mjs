import test from 'node:test'
import assert from 'node:assert/strict'

import { calculateDutyMetrics } from '../../src/domain/duties/metrics.mjs'
import { createMockDutyAdapter } from '../../src/services/duties/mock-adapter.mjs'

test('counts only on-time approved duties as completed and puts every other due item into assessment', () => {
  const summary = calculateDutyMetrics([
    { id: 'on-time', status: 'APPROVED', dueDate: '2026-08-10', submittedAt: '2026-08-09T08:00:00.000Z' },
    { id: 'late', status: 'APPROVED', dueDate: '2026-08-10', submittedAt: '2026-08-11T08:00:00.000Z' },
    { id: 'returned', status: 'RETURNED', dueDate: '2026-08-10', submittedAt: '2026-08-09T08:00:00.000Z' },
    { id: 'pending', status: 'PENDING', dueDate: '2026-08-10', submittedAt: null }
  ], { asOf: '2026-08-12T00:00:00.000Z' })

  assert.deepEqual(summary, {
    dueCount: 4,
    onTimeApprovedCount: 1,
    completionRate: 25,
    qualified: false,
    assessmentCount: 3,
    assessmentTaskIds: ['late', 'returned', 'pending'],
    applicable: true
  })
})

test('marks an empty duty scope as not applicable instead of reporting a misleading rate', () => {
  assert.deepEqual(calculateDutyMetrics([], { asOf: '2026-08-12T00:00:00.000Z' }), {
    dueCount: 0,
    onTimeApprovedCount: 0,
    completionRate: null,
    qualified: false,
    assessmentCount: 0,
    assessmentTaskIds: [],
    applicable: false
  })
})

test('allows an employee to submit only their own duty and requires super administrator review before it counts as completed', async () => {
  const adapter = createMockDutyAdapter({
    now: () => '2026-08-09T08:00:00.000Z',
    seedTasks: [{
      id: 'duty-001',
      title: '每周安全检查',
      department: '安全监察部',
      ownerUid: 'employee-001',
      ownerName: '普通员工',
      dueDate: '2026-08-10',
      status: 'PENDING',
      evidence: [],
      submittedAt: null,
      review: null
    }]
  })
  adapter.setMockRole('EMPLOYEE')
  const submitted = await adapter.submitDuty('duty-001', { note: '已完成本周检查。', attachments: [] })
  assert.equal(submitted.status, 'SUBMITTED')

  adapter.setMockRole('SUPER_ADMIN')
  let dashboard = await adapter.getDutyDashboard({ asOf: '2026-08-12T00:00:00.000Z' })
  assert.equal(dashboard.company.completionRate, 0)
  assert.equal(dashboard.assessmentItems.length, 1)
  assert.deepEqual(dashboard.reviewItems.map((item) => item.id), ['duty-001'])

  const approved = await adapter.reviewDuty('duty-001', { decision: 'APPROVE', note: '审核通过。' })
  assert.equal(approved.status, 'APPROVED')
  dashboard = await adapter.getDutyDashboard({ asOf: '2026-08-12T00:00:00.000Z' })
  assert.equal(dashboard.company.completionRate, 100)
  assert.equal(dashboard.assessmentItems.length, 0)
  assert.deepEqual(dashboard.reviewItems, [])
})

test('does not let an ordinary employee review another persons duty', async () => {
  const adapter = createMockDutyAdapter({
    seedTasks: [{
      id: 'duty-other-dept', title: '市场检查', department: '市场营销部', ownerUid: 'other-001', ownerName: '市场员工',
      dueDate: '2026-08-10', status: 'SUBMITTED', evidence: [], submittedAt: '2026-08-09T08:00:00.000Z', review: null
    }]
  })
  adapter.setMockRole('EMPLOYEE')

  await assert.rejects(
    () => adapter.reviewDuty('duty-other-dept', { decision: 'APPROVE', note: '越权审核。' }),
    (error) => error.code === 'FORBIDDEN'
  )
})

test('does not let a marketing employee review other employees duties', async () => {
  const adapter = createMockDutyAdapter({
    seedTasks: [{
      id: 'duty-marketing', title: '市场安全检查', department: '市场营销部', ownerUid: 'other-001', ownerName: '市场员工',
      dueDate: '2026-08-10', status: 'SUBMITTED', evidence: [], submittedAt: '2026-08-09T08:00:00.000Z', review: null
    }]
  })
  adapter.setMockRole('MARKETING_OFFICER')
  await assert.rejects(
    () => adapter.reviewDuty('duty-marketing', { decision: 'APPROVE', note: '越权审核。' }),
    (error) => error.code === 'FORBIDDEN'
  )
})

test('does not let safety change a duty submitted by another employee', async () => {
  const adapter = createMockDutyAdapter({
    seedTasks: [{
      id: 'duty-marketing', title: '市场安全检查', department: '市场营销部', ownerUid: 'other-001', ownerName: '市场员工',
      dueDate: '2026-08-10', status: 'SUBMITTED', evidence: [], submittedAt: '2026-08-09T08:00:00.000Z', review: null
    }]
  })

  await assert.rejects(
    () => adapter.reviewDuty('duty-marketing', { decision: 'APPROVE', note: '安监越权审核。' }),
    (error) => error.code === 'FORBIDDEN'
  )
  adapter.setMockRole('SUPER_ADMIN')
  const approved = await adapter.reviewDuty('duty-marketing', { decision: 'APPROVE', note: '管理员审核通过。' })
  assert.equal(approved.status, 'APPROVED')
})

test('returns company people only to safety and super administrators', async () => {
  const adapter = createMockDutyAdapter({
    seedTasks: [{
      id: 'duty-marketing', title: '市场安全检查', department: '市场营销部', ownerUid: 'marketing-001', ownerName: '市场营销员',
      dueDate: '2026-08-10', status: 'PENDING', evidence: [], submittedAt: null, review: null
    }]
  })

  assert.equal((await adapter.listDutyPeople()).length, 1)
  adapter.setMockRole('MARKETING_OFFICER')
  await assert.rejects(() => adapter.listDutyPeople(), (error) => error.code === 'FORBIDDEN')
})

test('appends a duty log only after a successful state change', async () => {
  const records = []
  const adapter = createMockDutyAdapter({
    operationLog: { append: (record) => records.push(record) },
    seedTasks: [{
      id: 'duty-log-001', title: '演示检查', department: '安全监察部', ownerUid: 'employee-001', ownerName: '普通员工',
      dueDate: '2026-08-10', status: 'PENDING', evidence: [], submittedAt: null, review: null
    }]
  })
  adapter.setMockRole('EMPLOYEE')
  await adapter.submitDuty('duty-log-001', { note: '已完成。', attachments: [] })
  await assert.rejects(() => adapter.submitDuty('duty-log-001', { note: '重复提交。', attachments: [] }))

  assert.deepEqual(records.map((record) => [record.action, record.targetId, record.result]), [['DUTY_SUBMIT', 'duty-log-001', 'SUCCESS']])
})
