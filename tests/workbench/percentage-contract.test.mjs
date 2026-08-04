import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const pagePath = new URL('../../src/pages/index/index.vue', import.meta.url)

test('renders already-normalized duty percentages without multiplying them again', async () => {
  const source = await readFile(pagePath, 'utf8')
  assert.match(source, /Math\.min\(100, value\)/)
  assert.doesNotMatch(source, /Math\.round\(value \* 100\)/)
})
