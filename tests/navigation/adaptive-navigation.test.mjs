import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const componentPath = new URL('../../src/components/navigation/AdaptiveNavigation.vue', import.meta.url)

test('defines the leader navigation with assignment second and duty dashboard third', async () => {
  const source = await readFile(componentPath, 'utf8')

  assert.match(source, /label:\s*'工作台'[\s\S]*path:\s*'\/pages\/index\/index'/)
  assert.match(source, /label:\s*'隐患交办'[\s\S]*path:\s*'\/pages\/admin\/issue-assign'/)
  assert.match(source, /label:\s*'履职仪表盘'[\s\S]*path:\s*'\/pages\/admin\/duty'/)
  assert.match(source, /label:\s*'随手拍'[\s\S]*path:\s*'\/pages\/issue\/create'/)
  assert.match(source, /label:\s*'我的'[\s\S]*path:\s*'\/pages\/profile\/index'/)
  assert.match(source, /active/)
  assert.match(source, /uni\.navigateTo/)
})

test('reserves a disabled desktop navigation slot for the future driver profile', async () => {
  const source = await readFile(componentPath, 'utf8')

  assert.match(source, /label:\s*'送气工画像'/)
  assert.match(source, /disabled:\s*true/)
  assert.match(source, /规划中/)
})
