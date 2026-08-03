import test from 'node:test'
import assert from 'node:assert/strict'

import * as dutyService from '../../src/services/duties/index.mjs'

test('exposes the duty workflow and dashboard through the Mock service contract', async () => {
  for (const method of ['getCurrentUser', 'listMyDuties', 'submitDuty', 'reviewDuty', 'getDutyDashboard']) {
    assert.equal(typeof dutyService[method], 'function', method)
  }
  assert.equal((await dutyService.getCurrentUser()).role, 'SAFETY_OFFICER')

  const dashboard = await dutyService.getDutyDashboard({ asOf: '2026-08-31T00:00:00.000Z' })
  assert.equal(dashboard.company.applicable, true)
  assert.ok(dashboard.company.dueCount > 0)
  assert.ok(dashboard.assessmentItems.length > 0)
})
