import assert from 'node:assert/strict'
import test from 'node:test'

import { isMockRoleSwitcherEnabled } from '../../src/services/mock-mode.mjs'

test('enables Mock identity switching for local development but not production by default', () => {
  assert.equal(isMockRoleSwitcherEnabled({ DEV: true }), true)
  assert.equal(isMockRoleSwitcherEnabled({ DEV: false }), false)
})
