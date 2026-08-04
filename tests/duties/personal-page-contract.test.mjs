import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const pagePath = new URL('../../src/pages/duty/index.vue', import.meta.url)

test('keeps the personal duty page separate from the company dashboard', async () => {
  const source = await readFile(pagePath, 'utf8')

  assert.match(source, /AdaptiveNavigation active="DUTY"/)
  assert.match(source, /listMyDuties/)
  assert.match(source, /我的安全履职/)
  assert.doesNotMatch(source, /getDutyDashboard/)
})
