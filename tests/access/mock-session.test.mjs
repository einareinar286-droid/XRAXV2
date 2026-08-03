import test from 'node:test'
import assert from 'node:assert/strict'

import { createMockSession } from '../../src/services/session/mock-session.mjs'

test('uses ignored local bootstrap mapping for the only super admin', async () => {
  const session = createMockSession({
    users: [{ uid: 'safe-ee', displayName: '安全监察部超级管理员', department: '安全监察部', role: 'SAFETY_OFFICER' }],
    localAdmin: { uid: 'safe-ee', role: 'SUPER_ADMIN' }
  })

  const current = await session.getCurrentUser()
  assert.equal(current.role, 'SUPER_ADMIN')
  assert.equal(current.department, '安全监察部')
})

test('never exposes a plaintext password in the current session', async () => {
  const current = await createMockSession().getCurrentUser()

  assert.equal('password' in current, false)
})
