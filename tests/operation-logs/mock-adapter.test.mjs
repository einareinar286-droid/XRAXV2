import assert from 'node:assert/strict'
import test from 'node:test'

import { createOperationLogRecord } from '../../src/domain/operation-logs/record.mjs'
import { createMockOperationLogAdapter } from '../../src/services/operation-logs/mock-adapter.mjs'

const safety = { uid: 'safety-001', displayName: '安全监察员', department: '安全监察部', role: 'SAFETY_OFFICER' }
const employee = { uid: 'employee-001', displayName: '普通员工', department: '生产运营部', role: 'EMPLOYEE' }

test('creates a minimal redacted operation log record', () => {
  const record = createOperationLogRecord({
    occurredAt: '2026-08-04T08:00:00.000Z',
    actor: safety,
    action: 'DUTY_SUBMIT',
    targetType: 'Duty',
    targetId: 'duty-001',
    result: 'SUCCESS',
    note: 'password=not-kept https://example.invalid/very-sensitive-token ' + 'x'.repeat(240)
  })

  assert.equal(record.actorId, 'safety-001')
  assert.equal(record.action, 'DUTY_SUBMIT')
  assert.doesNotMatch(record.note, /password|https?:\/\//i)
  assert.ok(record.note.length <= 160)
})

test('lists newest logs only to safety or super administrators', async () => {
  const adapter = createMockOperationLogAdapter({ now: () => '2026-08-04T08:00:00.000Z' })
  adapter.append({ occurredAt: '2026-08-03T08:00:00.000Z', actor: safety, action: 'DUTY_SUBMIT', targetType: 'Duty', targetId: 'duty-001', result: 'SUCCESS', note: '已提交' })
  adapter.append({ occurredAt: '2026-08-04T08:00:00.000Z', actor: safety, action: 'DUTY_APPROVE', targetType: 'Duty', targetId: 'duty-001', result: 'SUCCESS', note: '待审核 -> 已通过' })

  const result = await adapter.list({}, safety)
  assert.deepEqual(result.items.map((item) => item.action), ['DUTY_APPROVE', 'DUTY_SUBMIT'])
  await assert.rejects(() => adapter.list({}, employee), (error) => error.code === 'FORBIDDEN')
})
