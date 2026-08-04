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

test('exposes date range, actor and pagination controls on the log page', async () => {
  const source = await readFile(pagePath, 'utf8')

  // 日期范围筛选：从/到两个 date picker，并随请求传递 dateRange
  assert.match(source, /mode="date"/)
  assert.match(source, /dateRange/)
  assert.match(source, /dateFrom/)
  assert.match(source, /dateTo/)

  // 操作人筛选：以 actorId 请求服务
  assert.match(source, /actorId/)
  assert.match(source, /操作人/)

  // 分页：hasMore 时显示加载更多，追加到列表而非重置
  assert.match(source, /hasMore/)
  assert.match(source, /loadMore/)
  assert.match(source, /加载更多/)
})
