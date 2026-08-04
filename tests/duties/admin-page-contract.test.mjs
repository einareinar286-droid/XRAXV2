import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const pagePath = new URL('../../src/pages/admin/duty.vue', import.meta.url)

test('renders a traceable people duty section in the administrator dashboard', async () => {
  const source = await readFile(pagePath, 'utf8')

  assert.match(source, /全员履职明细/)
  assert.match(source, /dashboard\.people/)
  assert.match(source, /应履职/)
  assert.match(source, /按时通过/)
  assert.match(source, /AdaptiveNavigation active="DUTY"/)
})
