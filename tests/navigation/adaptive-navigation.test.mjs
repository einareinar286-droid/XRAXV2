import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const componentPath = new URL('../../src/components/navigation/AdaptiveNavigation.vue', import.meta.url)

test('separates the all-staff duty entry from the privileged duty dashboard', async () => {
  const source = await readFile(componentPath, 'utf8')

  assert.match(source, /id:\s*'DUTY'[\s\S]*path:\s*'\/pages\/duty\/index'/)
  assert.match(source, /id:\s*'DUTY_DASHBOARD'[\s\S]*path:\s*'\/pages\/admin\/duty'/)
  assert.match(source, /SUPER_ADMIN', 'SAFETY_OFFICER/)
  assert.match(source, /base\[0\],[\s\S]*id: 'ASSIGN'[\s\S]*base\[1\],[\s\S]*id: 'DUTY_DASHBOARD'[\s\S]*base\.slice\(2\)/)
  assert.match(source, /active/)
  assert.match(source, /uni\.navigateTo/)
})

test('reserves a disabled desktop navigation slot for the future driver profile', async () => {
  const source = await readFile(componentPath, 'utf8')

  assert.match(source, /label:\s*'送气工画像'/)
  assert.match(source, /disabled:\s*true/)
  assert.match(source, /规划中/)
})
