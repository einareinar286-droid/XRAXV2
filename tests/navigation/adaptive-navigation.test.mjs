import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const componentPath = new URL('../../src/components/navigation/AdaptiveNavigation.vue', import.meta.url)

test('defines the four tab destinations in leader-first order', async () => {
  const source = await readFile(componentPath, 'utf8')

  assert.match(source, /label:\s*'工作台'[\s\S]*path:\s*'\/pages\/index\/index'/)
  assert.match(source, /label:\s*'履职'[\s\S]*path:\s*'\/pages\/duty\/index'/)
  assert.match(source, /label:\s*'随手拍'[\s\S]*path:\s*'\/pages\/issue\/create'/)
  assert.match(source, /label:\s*'我的'[\s\S]*path:\s*'\/pages\/profile\/index'/)
  assert.match(source, /active/)
  assert.match(source, /uni\.switchTab/)
})
