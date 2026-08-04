import test from 'node:test'
import assert from 'node:assert/strict'

import { createMockDutyAdapter } from '../../src/services/duties/mock-adapter.mjs'
import { seedDutyTasks } from '../../src/services/duties/mock-data.mjs'

function baseTask(overrides = {}) {
  return {
    id: 'duty-roll-001', title: '每月安全检查', category: '安全检查', periodType: 'MONTHLY',
    department: '安全监察部', ownerUid: 'safety-001', ownerName: '安全监察员',
    dueDate: '2026-07-31', cycleStart: '2026-07-01', cycleEnd: '2026-07-31', cycleKey: 'monthly-2026-07-31',
    status: 'PENDING', evidence: [], submittedAt: null, review: null, cycleRolledOver: false,
    ...overrides
  }
}

test('anonymous seed covers all seven usable period types as separate tasks', () => {
  const types = [...new Set(seedDutyTasks.filter((task) => task.periodType).map((task) => task.periodType))].sort()
  assert.deepEqual(types, ['ANNUAL', 'BIWEEKLY', 'DAILY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'WEEKLY'])
  assert.ok(seedDutyTasks.filter((task) => task.periodType).every((task) => typeof task.title === 'string'))
})

test('rolls an expired periodic task into the next cycle and keeps the owner bound to the account', async () => {
  const adapter = createMockDutyAdapter({ now: () => '2026-08-05T08:00:00.000Z', seedTasks: [baseTask()] })
  adapter.setMockRole('SAFETY_OFFICER')

  const mine = await adapter.listMyDuties()
  assert.equal(mine.length, 1)
  const next = mine[0]
  assert.equal(next.status, 'PENDING')
  assert.equal(next.dueDate, '2026-08-31')
  assert.equal(next.cycleStart, '2026-08-01')
  assert.equal(next.cycleEnd, '2026-08-31')
  assert.equal(next.cycleKey, 'monthly-2026-08-31')
  assert.equal(next.ownerUid, 'safety-001')
  assert.notEqual(next.id, 'duty-roll-001')
})

test('does not roll over before the due date and never duplicates on repeated reads', async () => {
  const notDue = createMockDutyAdapter({
    now: () => '2026-08-05T08:00:00.000Z',
    seedTasks: [baseTask({ dueDate: '2026-08-10', cycleEnd: '2026-08-10', cycleKey: 'monthly-2026-08-10' })]
  })
  notDue.setMockRole('SAFETY_OFFICER')
  assert.equal((await notDue.listMyDuties()).length, 1)

  const due = createMockDutyAdapter({ now: () => '2026-08-05T08:00:00.000Z', seedTasks: [baseTask()] })
  due.setMockRole('SAFETY_OFFICER')
  await due.listMyDuties()
  await due.listMyDuties()
  assert.equal((await due.listMyDuties()).length, 1)
})

test('keeps the rolled-over task in assessment but excludes the future cycle task', async () => {
  const adapter = createMockDutyAdapter({ now: () => '2026-08-05T08:00:00.000Z', seedTasks: [baseTask()] })
  adapter.setMockRole('SUPER_ADMIN')
  await adapter.getDutyDashboard({ asOf: '2026-08-12T00:00:00.000Z' })
  const dashboard = await adapter.getDutyDashboard({ asOf: '2026-08-12T00:00:00.000Z' })

  assert.equal(dashboard.company.dueCount, 1)
  assert.equal(dashboard.assessmentItems.length, 1)
  assert.equal(dashboard.assessmentItems[0].id, 'duty-roll-001')
  assert.ok(dashboard.assessmentItems.every((item) => !item.id.includes('-cyc-')))
})

test('preserves submitted history and starts a fresh pending cycle', async () => {
  const done = baseTask({
    status: 'APPROVED',
    evidence: { note: '已完成。', attachments: [] },
    submittedAt: '2026-07-28T08:00:00.000Z',
    review: { decision: 'APPROVE', note: '通过', reviewerUid: 'super-admin-001', reviewedAt: '2026-07-29T08:00:00.000Z' }
  })
  const adapter = createMockDutyAdapter({ now: () => '2026-08-05T08:00:00.000Z', seedTasks: [done] })
  adapter.setMockRole('SAFETY_OFFICER')

  const mine = await adapter.listMyDuties()
  assert.equal(mine.length, 1)
  assert.equal(mine[0].status, 'PENDING')
  assert.deepEqual(mine[0].evidence, [])

  const dashboard = await adapter.getDutyDashboard({ asOf: '2026-08-12T00:00:00.000Z' })
  assert.equal(dashboard.company.onTimeApprovedCount, 1)
})

test('leaves legacy tasks without a period type untouched', async () => {
  const legacy = {
    id: 'duty-legacy', title: '旧任务', department: '安全监察部', ownerUid: 'safety-001', ownerName: '安全监察员',
    dueDate: '2026-07-01', status: 'PENDING', evidence: [], submittedAt: null, review: null
  }
  const adapter = createMockDutyAdapter({ now: () => '2026-08-05T08:00:00.000Z', seedTasks: [legacy] })
  adapter.setMockRole('SAFETY_OFFICER')
  const mine = await adapter.listMyDuties()
  assert.equal(mine.length, 1)
  assert.equal(mine[0].id, 'duty-legacy')
})
