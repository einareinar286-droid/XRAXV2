import test from 'node:test'
import assert from 'node:assert/strict'

import * as issueService from '../../src/services/issues/index.mjs'

test('exposes the stable issue service contract in Mock mode', async () => {
  const methods = [
    'getCurrentUser',
    'listIssues',
    'getIssue',
    'reportIssue',
    'assignIssue',
    'submitRectification',
    'reviewIssue',
    'listAuditEvents'
  ]
  for (const method of methods) assert.equal(typeof issueService[method], 'function', method)

  assert.equal(issueService.isMockIssueMode, true)
  assert.equal((await issueService.getCurrentUser()).role, 'SAFETY_INSPECTOR')
  assert.ok((await issueService.listIssues()).total >= 2)
})

test('changes only the Mock session identity without accepting caller identity in writes', async () => {
  issueService.setMockRole('EXECUTIVE_READONLY')
  const current = await issueService.getCurrentUser()
  assert.equal(current.role, 'EXECUTIVE_READONLY')

  await assert.rejects(
    () => issueService.reportIssue(reportPayloadWithForgedIdentity()),
    (error) => error.code === 'FORBIDDEN'
  )

  issueService.setMockRole('SAFETY_INSPECTOR')
})

function reportPayloadWithForgedIdentity() {
  return {
    title: '伪造身份测试',
    category: '安全管理',
    severity: 'MEDIUM',
    isMajor: false,
    description: '客户端声称自己是管理员，但服务应使用当前只读会话。',
    location: '徐州市',
    attachments: [],
    departmentScope: ['安全监察部', '市场营销部'],
    actorUid: 'forged-admin',
    actorRole: 'SAFETY_ADMIN',
    department: '安全监察部'
  }
}
