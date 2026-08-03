import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const pagePath = new URL('../../src/pages/index/index.vue', import.meta.url)

test('renders a clearly labelled Mock leader workbench from the snapshot service', async () => {
  const source = await readFile(pagePath, 'utf8')

  assert.match(source, /getWorkbenchSnapshot/)
  assert.match(source, /演示数据/)
  for (const label of ['隐患总数', '待交办', '待整改', '待复核', '已闭环', '重大隐患', '履职率', '待审核', '考核项', '重点待办']) {
    assert.ok(source.includes(label), `expected leader workbench label: ${label}`)
  }
})
