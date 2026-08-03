import test from 'node:test'
import assert from 'node:assert/strict'

import { isMockRoleSwitcherEnabled } from '../../src/services/mock-mode.mjs'
import { getWorkbenchSnapshot } from '../../src/services/workbench/index.mjs'

test('keeps the Mock role switcher disabled unless a local build flag enables it', () => {
  assert.equal(isMockRoleSwitcherEnabled({}), false)
  assert.equal(isMockRoleSwitcherEnabled({ VITE_XR_ENABLE_MOCK_ROLE_SWITCHER: 'false' }), false)
  assert.equal(isMockRoleSwitcherEnabled({ VITE_XR_ENABLE_MOCK_ROLE_SWITCHER: 'true' }), true)
})

test('returns a single Mock workbench snapshot for the current role', async () => {
  const snapshot = await getWorkbenchSnapshot({ generatedAt: '2026-08-03T08:00:00.000Z' })
  assert.equal(snapshot.dataMode, 'MOCK')
  assert.equal(snapshot.generatedAt, '2026-08-03T08:00:00.000Z')
  assert.equal(snapshot.user.role, 'SAFETY_OFFICER')
  assert.ok(snapshot.issueMetrics.total >= 0)
  assert.ok('dutyMetrics' in snapshot)
})
