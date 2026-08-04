import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const pagePath = new URL('../../src/pages/admin/duty.vue', import.meta.url)

test('renders a traceable people duty section in the administrator dashboard', async () => {
  const source = await readFile(pagePath, 'utf8')

  assert.match(source, /全员履职明细/)
  assert.match(source, /v-for="person in people"/)
  assert.match(source, /应履职/)
  assert.match(source, /按时通过/)
  assert.match(source, /AdaptiveNavigation active="DUTY_DASHBOARD"/)
})

test('renders department, duty status and keyword filters backed by listDutyPeople', async () => {
  const source = await readFile(pagePath, 'utf8')

  // 筛选控件：部门、履职状态、关键词
  assert.match(source, /listDutyPeople/)
  assert.match(source, /peopleQuery/)
  assert.match(source, /dutyStatus/)
  assert.match(source, /keyword/)
  assert.match(source, /重置/)

  // 履职状态三档值域
  assert.match(source, /COMPLETED/)
  assert.match(source, /ASSESSMENT/)
  assert.match(source, /NOT_APPLICABLE/)
})

test('renders a period view selector on the administrator dashboard', async () => {
  const source = await readFile(pagePath, 'utf8')

  assert.match(source, /periodView/)
  assert.match(source, /periodType/)
  assert.match(source, /MONTHLY/)
  assert.match(source, /全部周期|全部/)
})
