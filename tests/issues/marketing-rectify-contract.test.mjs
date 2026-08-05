import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createMockIssueAdapter } from '../../src/services/issues/mock-adapter.mjs'
import { seedIssues } from '../../src/services/issues/mock-data.mjs'

// 营销部视角：应能看到交办给本部门的隐患（待整改 ASSIGNED / 被退回 REJECTED）
function marketingAdapter() {
  const adapter = createMockIssueAdapter({ seedIssues, seedAuditEvents: [] })
  adapter.setMockRole('MARKETING_OFFICER')
  return adapter
}

test('营销部 listIssues 能看到交办给本部门的隐患', async () => {
  const adapter = marketingAdapter()
  const result = await adapter.listIssues({ page: 1, pageSize: 100 })
  assert.ok(result.items.length > 0, '营销部应至少看到 1 条交办隐患')
  for (const issue of result.items) {
    assert.equal(issue.assignee.department, '市场营销部', '只能看到本部门交办的隐患')
  }
})

test('营销部 listIssues 按状态过滤：ASSIGNED 待整改 + REJECTED 被退回', async () => {
  const adapter = marketingAdapter()
  const pending = await adapter.listIssues({ status: 'ASSIGNED', page: 1, pageSize: 100 })
  const rejected = await adapter.listIssues({ status: 'REJECTED', page: 1, pageSize: 100 })
  const submitted = await adapter.listIssues({ status: 'RECTIFICATION_SUBMITTED', page: 1, pageSize: 100 })
  const all = await adapter.listIssues({ page: 1, pageSize: 100 })
  // 待整改+被退回 应覆盖全部可见项（营销部只负责整改，不负责别的状态）
  assert.equal(pending.items.length + rejected.items.length + submitted.items.length, all.items.length)
})

test('营销部看不到未交办的隐患', async () => {
  const adapter = marketingAdapter()
  const all = await adapter.listIssues({ page: 1, pageSize: 100 })
  for (const issue of all.items) {
    assert.ok(issue.assignee, '可见隐患必须已交办')
  }
})

test('营销部提交整改后可再次列表看到（状态 RECTIFICATION_SUBMITTED）', async () => {
  const adapter = marketingAdapter()
  const pending = await adapter.listIssues({ status: 'ASSIGNED', page: 1, pageSize: 100 })
  const target = pending.items[0]
  assert.ok(target, '有待整改项')
  await adapter.submitRectification(target.id, {
    note: '已完成整改并复查',
    attachments: [],
    version: target.version,
    requestId: `test-rectify-${Date.now()}`
  })
  const after = await adapter.listIssues({ status: 'RECTIFICATION_SUBMITTED', page: 1, pageSize: 100 })
  assert.ok(after.items.some((item) => item.id === target.id), '提交后状态应为 RECTIFICATION_SUBMITTED')
})

test('超管也能查看待整改列表（全部门）', async () => {
  const adapter = createMockIssueAdapter({ seedIssues, seedAuditEvents: [] })
  adapter.setMockRole('SUPER_ADMIN')
  const result = await adapter.listIssues({ page: 1, pageSize: 100 })
  assert.ok(result.items.length > 0, '超管应能看到隐患')
  // 超管可读全部，包含已交办与未交办
  const assigned = result.items.filter((issue) => issue.assignee)
  assert.ok(assigned.length > 0, '超管应能看到已交办的隐患')
})
