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
  assert.equal((await issueService.getCurrentUser()).role, 'SAFETY_OFFICER')
  assert.ok((await issueService.listIssues()).total >= 2)
})

test('uses the trusted Mock session identity instead of forged client identity in writes', async () => {
  issueService.setMockRole('EMPLOYEE')
  const current = await issueService.getCurrentUser()
  assert.equal(current.role, 'EMPLOYEE')

  const reported = await issueService.reportIssue(reportPayloadWithForgedIdentity())
  assert.equal(reported.reporter.uid, current.uid)

  issueService.setMockRole('SAFETY_OFFICER')
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
    actorRole: 'SUPER_ADMIN',
    department: '安全监察部'
  }
}
