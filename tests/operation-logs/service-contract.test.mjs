import assert from 'node:assert/strict'
import test from 'node:test'

import { isMockOperationLogMode, listOperationLogs } from '../../src/services/operation-logs/index.mjs'

test('exposes the read-only operation log service contract', async () => {
  assert.equal(isMockOperationLogMode, true)
  const result = await listOperationLogs({ page: 1, pageSize: 10 })
  assert.equal(Array.isArray(result.items), true)
  assert.equal(typeof result.total, 'number')
})
