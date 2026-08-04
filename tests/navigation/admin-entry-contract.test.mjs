import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const profilePath = new URL('../../src/pages/profile/index.vue', import.meta.url)
const pagesPath = new URL('../../src/pages.json', import.meta.url)

test('shows duty dashboard and operation logs only to safety and super administrators', async () => {
  const source = await readFile(profilePath, 'utf8')

  assert.match(source, /\['SUPER_ADMIN','SAFETY_OFFICER'\]/)
  assert.match(source, /操作日志/)
  assert.match(source, /openOperationLogs/)
})

test('registers the read-only operation log page outside the tab bar', async () => {
  const source = await readFile(pagesPath, 'utf8')

  assert.match(source, /pages\/admin\/operation-logs/)
  assert.doesNotMatch(source, /"pagePath":\s*"pages\/admin\/operation-logs"/)
})
