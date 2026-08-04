import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const pagePath = new URL('../../src/pages/admin/operation-logs.vue', import.meta.url)

test('renders the operation log through the read-only service contract', async () => {
  const source = await readFile(pagePath, 'utf8')

  assert.match(source, /listOperationLogs/)
  assert.match(source, /当前角色不能查看操作日志/)
  assert.match(source, /操作时间/)
  assert.match(source, /AdaptiveNavigation active="PROFILE"/)
})
