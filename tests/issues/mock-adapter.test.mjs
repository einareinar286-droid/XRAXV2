import test from 'node:test'
import assert from 'node:assert/strict'

import { createMockIssueAdapter } from '../../src/services/issues/mock-adapter.mjs'

function reportPayload(overrides = {}) {
  return {
    title: '餐饮用户减压阀不合规',
    category: '用户用气安全',
    severity: 'HIGH',
    isMajor: true,
    description: '现场发现正在使用不符合要求的可调节减压阀。',
    location: '云龙区和平路 18 号',
    attachments: [],
    departmentScope: ['安全监察部', '市场营销部'],
    ...overrides
  }
}

test('completes report, assignment, rectification and close with one audit event per transition', async () => {
  const adapter = createMockIssueAdapter({
    now: () => '2026-08-02T09:00:00.000Z',
    idFactory: () => 'XR-20260802-001'
  })

  const reported = await adapter.reportIssue(reportPayload())
  assert.equal(reported.status, 'REPORTED')
  assert.equal(reported.version, 1)

  const assigned = await adapter.assignIssue(reported.id, {
    assigneeUid: 'marketing-001',
    assigneeDepartment: '市场营销部',
    deadline: '2026-08-09',
    version: reported.version,
    requestId: 'req-assign-001'
  })
  assert.equal(assigned.status, 'ASSIGNED')
  assert.equal(assigned.version, 2)

  adapter.setMockRole('MARKETING_RECTIFIER')
  const submitted = await adapter.submitRectification(reported.id, {
    note: '已更换为不可调节减压阀并完成复查。',
    attachments: [],
    version: assigned.version,
    requestId: 'req-rectify-001'
  })
  assert.equal(submitted.status, 'RECTIFICATION_SUBMITTED')
  assert.equal(submitted.version, 3)

  adapter.setMockRole('SAFETY_INSPECTOR')
  const closed = await adapter.reviewIssue(reported.id, {
    decision: 'CLOSE',
    note: '现场复核风险已消除。',
    version: submitted.version,
    requestId: 'req-close-001'
  })
  assert.equal(closed.status, 'CLOSED')
  assert.equal(closed.version, 4)

  const events = await adapter.listAuditEvents(reported.id)
  assert.deepEqual(events.map((event) => event.action), [
    'REPORT',
    'ASSIGN',
    'SUBMIT_RECTIFICATION',
    'CLOSE'
  ])
})

test('returns rejected rectification to marketing and accepts a corrected resubmission', async () => {
  const adapter = createMockIssueAdapter({
    now: () => '2026-08-02T10:00:00.000Z',
    idFactory: () => 'XR-20260802-002'
  })
  const reported = await adapter.reportIssue(reportPayload())
  const assigned = await adapter.assignIssue(reported.id, {
    assigneeUid: 'marketing-001',
    assigneeDepartment: '市场营销部',
    deadline: '2026-08-09',
    version: reported.version,
    requestId: 'req-assign-002'
  })
  adapter.setMockRole('MARKETING_RECTIFIER')
  const firstSubmission = await adapter.submitRectification(reported.id, {
    note: '已处理。',
    attachments: [],
    version: assigned.version,
    requestId: 'req-rectify-002'
  })

  adapter.setMockRole('SAFETY_INSPECTOR')
  const rejected = await adapter.reviewIssue(reported.id, {
    decision: 'REJECT',
    note: '佐证不足，请补充更换后照片。',
    version: firstSubmission.version,
    requestId: 'req-reject-002'
  })
  assert.equal(rejected.status, 'REJECTED')

  adapter.setMockRole('MARKETING_RECTIFIER')
  const resubmitted = await adapter.submitRectification(reported.id, {
    note: '已补充更换后的现场佐证。',
    attachments: [],
    version: rejected.version,
    requestId: 'req-resubmit-002'
  })
  assert.equal(resubmitted.status, 'RECTIFICATION_SUBMITTED')

  const events = await adapter.listAuditEvents(reported.id)
  assert.deepEqual(events.map((event) => event.action), [
    'REPORT',
    'ASSIGN',
    'SUBMIT_RECTIFICATION',
    'REJECT',
    'SUBMIT_RECTIFICATION'
  ])
})

test('denies marketing access before an issue is assigned to the user or department', async () => {
  const adapter = createMockIssueAdapter({ idFactory: () => 'XR-20260802-003' })
  const reported = await adapter.reportIssue(reportPayload())

  adapter.setMockRole('MARKETING_RECTIFIER')

  await assert.rejects(
    () => adapter.getIssue(reported.id),
    (error) => error.code === 'FORBIDDEN'
  )

  await assert.rejects(
    () => adapter.listAuditEvents(reported.id),
    (error) => error.code === 'FORBIDDEN'
  )
})

test('filters and paginates readable issues while keeping major hazards first', async () => {
  const ids = ['XR-20260802-004', 'XR-20260802-005', 'XR-20260802-006']
  const adapter = createMockIssueAdapter({ idFactory: () => ids.shift() })
  await adapter.reportIssue(reportPayload({ title: '一般隐患一', severity: 'HIGH', isMajor: false }))
  await adapter.reportIssue(reportPayload({ title: '重大隐患', severity: 'HIGH', isMajor: true }))
  await adapter.reportIssue(reportPayload({ title: '低风险隐患', severity: 'LOW', isMajor: false }))

  const firstPage = await adapter.listIssues({ severity: 'HIGH', page: 1, pageSize: 1 })
  assert.equal(firstPage.total, 2)
  assert.equal(firstPage.page, 1)
  assert.equal(firstPage.pageSize, 1)
  assert.equal(firstPage.hasMore, true)
  assert.equal(firstPage.items[0].title, '重大隐患')

  const emptyPage = await adapter.listIssues({ status: 'CLOSED', page: 1, pageSize: 20 })
  assert.deepEqual(emptyPage.items, [])
  assert.equal(emptyPage.total, 0)
  assert.equal(emptyPage.hasMore, false)
})

test('returns the first result for an identical request and rejects request-id reuse with different content', async () => {
  const adapter = createMockIssueAdapter({ idFactory: () => 'XR-20260802-007' })
  const reported = await adapter.reportIssue(reportPayload())
  const assignment = {
    assigneeUid: 'marketing-001',
    assigneeDepartment: '市场营销部',
    deadline: '2026-08-09',
    version: reported.version,
    requestId: 'req-idempotent-007'
  }

  const first = await adapter.assignIssue(reported.id, assignment)
  const repeated = await adapter.assignIssue(reported.id, assignment)
  assert.deepEqual(repeated, first)
  assert.equal((await adapter.listAuditEvents(reported.id)).length, 2)

  await assert.rejects(
    () => adapter.assignIssue(reported.id, { ...assignment, deadline: '2026-08-10' }),
    (error) => error.code === 'DUPLICATE_REQUEST'
  )
})

test('reports the current version when a stale page attempts to write', async () => {
  const adapter = createMockIssueAdapter({ idFactory: () => 'XR-20260802-008' })
  const reported = await adapter.reportIssue(reportPayload())
  const assigned = await adapter.assignIssue(reported.id, {
    assigneeUid: 'marketing-001',
    assigneeDepartment: '市场营销部',
    deadline: '2026-08-09',
    version: reported.version,
    requestId: 'req-assign-008'
  })
  assert.equal(assigned.version, 2)

  adapter.setMockRole('MARKETING_RECTIFIER')
  await assert.rejects(
    () => adapter.submitRectification(reported.id, {
      note: '来自旧页面的整改提交。',
      attachments: [],
      version: 1,
      requestId: 'req-stale-008'
    }),
    (error) => error.code === 'VERSION_CONFLICT'
      && error.details.currentVersion === 2
      && error.details.receivedVersion === 1
  )
})

test('rejects invalid report fields and unsafe attachments', async (t) => {
  const cases = [
    ['blank title', { title: '   ' }],
    ['title over 60 characters', { title: '隐'.repeat(61) }],
    ['description over 1000 characters', { description: '描'.repeat(1001) }],
    ['location over 200 characters', { location: '址'.repeat(201) }],
    ['unknown severity', { severity: 'URGENT' }],
    ['non-boolean major flag', { isMajor: 'yes' }],
    ['more than six attachments', { attachments: Array.from({ length: 7 }, (_, index) => ({ id: `a-${index}`, name: `${index}.jpg`, mimeType: 'image/jpeg', size: 100 })) }],
    ['unsupported attachment type', { attachments: [{ id: 'a-exe', name: 'unsafe.exe', mimeType: 'application/octet-stream', size: 100 }] }],
    ['attachment larger than 10 MiB', { attachments: [{ id: 'a-big', name: 'big.jpg', mimeType: 'image/jpeg', size: 10 * 1024 * 1024 + 1 }] }]
  ]

  for (const [name, overrides] of cases) {
    await t.test(name, async () => {
      const adapter = createMockIssueAdapter()
      await assert.rejects(
        () => adapter.reportIssue(reportPayload(overrides)),
        (error) => error.code === 'INVALID_PAYLOAD'
      )
    })
  }
})

test('validates assignment, rectification and review write contracts', async (t) => {
  await t.test('assignment requires a request id', async () => {
    const adapter = createMockIssueAdapter()
    const reported = await adapter.reportIssue(reportPayload())
    await assert.rejects(
      () => adapter.assignIssue(reported.id, {
        assigneeUid: 'marketing-001',
        assigneeDepartment: '市场营销部',
        deadline: '2026-08-09',
        version: reported.version
      }),
      (error) => error.code === 'INVALID_PAYLOAD'
    )
  })

  await t.test('rectification rejects a blank note', async () => {
    const adapter = createMockIssueAdapter()
    const reported = await adapter.reportIssue(reportPayload())
    const assigned = await adapter.assignIssue(reported.id, {
      assigneeUid: 'marketing-001',
      assigneeDepartment: '市场营销部',
      deadline: '2026-08-09',
      version: reported.version,
      requestId: 'req-assign-validation'
    })
    adapter.setMockRole('MARKETING_RECTIFIER')
    await assert.rejects(
      () => adapter.submitRectification(reported.id, {
        note: '   ',
        attachments: [],
        version: assigned.version,
        requestId: 'req-rectify-validation'
      }),
      (error) => error.code === 'INVALID_PAYLOAD'
    )
  })

  await t.test('reject decision requires a reason', async () => {
    const adapter = createMockIssueAdapter()
    const reported = await adapter.reportIssue(reportPayload())
    const assigned = await adapter.assignIssue(reported.id, {
      assigneeUid: 'marketing-001',
      assigneeDepartment: '市场营销部',
      deadline: '2026-08-09',
      version: reported.version,
      requestId: 'req-assign-review-validation'
    })
    adapter.setMockRole('MARKETING_RECTIFIER')
    const submitted = await adapter.submitRectification(reported.id, {
      note: '已整改。',
      attachments: [],
      version: assigned.version,
      requestId: 'req-submit-review-validation'
    })
    adapter.setMockRole('SAFETY_INSPECTOR')
    await assert.rejects(
      () => adapter.reviewIssue(reported.id, {
        decision: 'REJECT',
        note: '',
        version: submitted.version,
        requestId: 'req-reject-validation'
      }),
      (error) => error.code === 'INVALID_PAYLOAD'
    )
  })
})

test('keeps closed issues immutable and allows only the safety admin to reopen with an audit trail', async () => {
  const adapter = createMockIssueAdapter({ idFactory: () => 'XR-20260802-009' })
  const reported = await adapter.reportIssue(reportPayload())
  const assigned = await adapter.assignIssue(reported.id, {
    assigneeUid: 'marketing-001',
    assigneeDepartment: '市场营销部',
    deadline: '2026-08-09',
    version: reported.version,
    requestId: 'req-assign-009'
  })
  adapter.setMockRole('MARKETING_RECTIFIER')
  const submitted = await adapter.submitRectification(reported.id, {
    note: '已完成整改。',
    attachments: [],
    version: assigned.version,
    requestId: 'req-submit-009'
  })
  adapter.setMockRole('SAFETY_INSPECTOR')
  const closed = await adapter.reviewIssue(reported.id, {
    decision: 'CLOSE',
    note: '确认闭环。',
    version: submitted.version,
    requestId: 'req-close-009'
  })

  adapter.setMockRole('MARKETING_RECTIFIER')
  await assert.rejects(
    () => adapter.submitRectification(reported.id, {
      note: '闭环后试图再次修改。',
      attachments: [],
      version: closed.version,
      requestId: 'req-edit-closed-009'
    }),
    (error) => error.code === 'CLOSED_IMMUTABLE'
  )

  adapter.setMockRole('SAFETY_INSPECTOR')
  await assert.rejects(
    () => adapter.reviewIssue(reported.id, {
      decision: 'REOPEN',
      note: '普通巡检员尝试重开。',
      version: closed.version,
      requestId: 'req-reopen-inspector-009'
    }),
    (error) => error.code === 'FORBIDDEN'
  )

  adapter.setMockRole('SAFETY_ADMIN')
  const reopened = await adapter.reviewIssue(reported.id, {
    decision: 'REOPEN',
    note: '复查发现风险再次出现，按制度重开。',
    version: closed.version,
    requestId: 'req-reopen-admin-009'
  })
  assert.equal(reopened.status, 'REPORTED')
  assert.equal(reopened.version, 5)
  assert.equal(reopened.assignee, null)
  assert.equal(reopened.deadline, null)
  assert.equal((await adapter.listAuditEvents(reported.id)).at(-1).action, 'REOPEN')
})

test('clones seeded issue data so callers cannot mutate adapter state', async () => {
  const seed = {
    id: 'XR-SEED-001',
    title: '种子隐患',
    category: '安全管理',
    severity: 'MEDIUM',
    isMajor: false,
    description: '用于验证种子数据隔离。',
    location: '徐州市',
    attachments: [],
    status: 'REPORTED',
    reporter: { uid: 'safety-001', displayName: '安全巡检员', department: '安全监察部' },
    assignee: null,
    departmentScope: ['安全监察部', '市场营销部'],
    deadline: null,
    rectification: null,
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-01T08:00:00.000Z',
    version: 1
  }
  const adapter = createMockIssueAdapter({ seedIssues: [seed] })

  const firstRead = await adapter.getIssue(seed.id)
  firstRead.title = '被调用方篡改'
  firstRead.departmentScope.length = 0

  const secondRead = await adapter.getIssue(seed.id)
  assert.equal(secondRead.title, '种子隐患')
  assert.deepEqual(secondRead.departmentScope, ['安全监察部', '市场营销部'])
})

test('rejects every executive write operation', async () => {
  const ids = ['XR-EXEC-001', 'XR-EXEC-002']
  const adapter = createMockIssueAdapter({ idFactory: () => ids.shift() })
  const reported = await adapter.reportIssue(reportPayload())
  const assigned = await adapter.assignIssue(reported.id, {
    assigneeUid: 'marketing-001',
    assigneeDepartment: '市场营销部',
    deadline: '2026-08-09',
    version: reported.version,
    requestId: 'req-exec-assign-setup'
  })
  adapter.setMockRole('MARKETING_RECTIFIER')
  const submitted = await adapter.submitRectification(reported.id, {
    note: '整改完成。', attachments: [], version: assigned.version, requestId: 'req-exec-submit-setup'
  })
  adapter.setMockRole('SAFETY_INSPECTOR')
  const unassigned = await adapter.reportIssue(reportPayload({ title: '未交办事项' }))
  adapter.setMockRole('EXECUTIVE_READONLY')

  const writes = [
    () => adapter.reportIssue(reportPayload()),
    () => adapter.assignIssue(unassigned.id, {
      assigneeUid: 'marketing-001', assigneeDepartment: '市场营销部', deadline: '2026-08-09', version: unassigned.version, requestId: 'req-exec-assign'
    }),
    () => adapter.submitRectification(reported.id, {
      note: '高管伪造整改。', attachments: [], version: submitted.version, requestId: 'req-exec-submit'
    }),
    () => adapter.reviewIssue(reported.id, {
      decision: 'CLOSE', note: '高管伪造复核。', version: submitted.version, requestId: 'req-exec-review'
    })
  ]
  for (const write of writes) {
    await assert.rejects(write, (error) => error.code === 'FORBIDDEN')
  }
})

test('ignores forged client identity and withholds attachment metadata outside the assignee scope', async () => {
  const adapter = createMockIssueAdapter({ idFactory: () => 'XR-FORGED-001' })
  const reported = await adapter.reportIssue(reportPayload({
    attachments: [{ id: 'photo-001', name: 'evidence.jpg', mimeType: 'image/jpeg', size: 1024, previewUrl: 'mock-private://photo-001' }]
  }))
  adapter.setMockRole('MARKETING_RECTIFIER')

  await assert.rejects(
    () => adapter.assignIssue(reported.id, {
      assigneeUid: 'marketing-001',
      assigneeDepartment: '市场营销部',
      deadline: '2026-08-09',
      version: reported.version,
      requestId: 'req-forged-assign',
      actorUid: 'safety-admin-001',
      actorRole: 'SAFETY_ADMIN',
      department: '安全监察部'
    }),
    (error) => error.code === 'FORBIDDEN'
  )
  await assert.rejects(() => adapter.getIssue(reported.id), (error) => error.code === 'FORBIDDEN')
  assert.equal((await adapter.listIssues()).total, 0)
})

test('keeps sensitive notes and attachment locations out of audit summaries', async () => {
  const adapter = createMockIssueAdapter({ idFactory: () => 'XR-AUDIT-001' })
  const reported = await adapter.reportIssue(reportPayload({
    attachments: [{ id: 'photo-secret', name: 'secret.jpg', mimeType: 'image/jpeg', size: 1024, previewUrl: 'mock-private://secret-location' }]
  }))
  const assigned = await adapter.assignIssue(reported.id, {
    assigneeUid: 'marketing-001', assigneeDepartment: '市场营销部', deadline: '2026-08-09', version: reported.version, requestId: 'req-audit-assign'
  })
  adapter.setMockRole('MARKETING_RECTIFIER')
  await adapter.submitRectification(reported.id, {
    note: '敏感整改说明不应进入审计摘要。',
    attachments: [{ id: 'rect-secret', name: 'rectified.png', mimeType: 'image/png', size: 2048, previewUrl: 'mock-private://rectified-secret' }],
    version: assigned.version,
    requestId: 'req-audit-submit'
  })

  const serialized = JSON.stringify(await adapter.listAuditEvents(reported.id))
  assert.equal(serialized.includes('mock-private://'), false)
  assert.equal(serialized.includes('敏感整改说明'), false)
})

test('re-authorizes safety writes against the issue department scope', async () => {
  const base = {
    category: '安全管理', severity: 'HIGH', isMajor: false,
    description: '跨部门范围测试隐患。', location: '其他区域', attachments: [],
    reporter: { uid: 'other-001', displayName: '其他部门人员', department: '其他部门' },
    assignee: null, departmentScope: ['其他部门'], deadline: null, rectification: null,
    createdAt: '2026-08-01T08:00:00.000Z', updatedAt: '2026-08-01T08:00:00.000Z', version: 1
  }
  const adapter = createMockIssueAdapter({ seedIssues: [
    { ...base, id: 'XR-SCOPE-REPORTED', title: '跨范围待交办隐患', status: 'REPORTED' },
    { ...base, id: 'XR-SCOPE-REVIEW', title: '跨范围待复核隐患', status: 'RECTIFICATION_SUBMITTED', version: 3 }
  ] })

  await assert.rejects(
    () => adapter.assignIssue('XR-SCOPE-REPORTED', {
      assigneeUid: 'marketing-001', assigneeDepartment: '市场营销部', deadline: '2026-08-09', version: 1, requestId: 'req-cross-scope-assign'
    }),
    (error) => error.code === 'FORBIDDEN'
  )
  await assert.rejects(
    () => adapter.reviewIssue('XR-SCOPE-REVIEW', {
      decision: 'CLOSE', note: '', version: 3, requestId: 'req-cross-scope-review'
    }),
    (error) => error.code === 'FORBIDDEN'
  )
})

test('derives issue scope from the trusted Mock session and never treats entity wildcard as global', async () => {
  const adapter = createMockIssueAdapter({ idFactory: () => 'XR-TRUSTED-SCOPE' })
  const reported = await adapter.reportIssue(reportPayload({ departmentScope: ['*', '其他部门'] }))
  assert.deepEqual(reported.departmentScope, ['安全监察部', '市场营销部'])

  const wildcardSeed = { ...reported, id: 'XR-ENTITY-WILDCARD', departmentScope: ['*'] }
  const seeded = createMockIssueAdapter({ seedIssues: [wildcardSeed] })
  seeded.setMockRole('EXECUTIVE_READONLY')
  assert.equal((await seeded.listIssues()).total, 0)
  await assert.rejects(() => seeded.getIssue(wildcardSeed.id), (error) => error.code === 'FORBIDDEN')
})

test('rejects public attachment addresses and stores only canonical metadata', async () => {
  const adapter = createMockIssueAdapter({ idFactory: () => 'XR-ATTACHMENT-METADATA' })
  await assert.rejects(
    () => adapter.reportIssue(reportPayload({
      attachments: [{ id: 'public-001', name: 'public.jpg', mimeType: 'image/jpeg', size: 100, previewUrl: 'https://public.example/evidence.jpg' }]
    })),
    (error) => error.code === 'ATTACHMENT_FORBIDDEN'
  )

  const reported = await adapter.reportIssue(reportPayload({
    attachments: [{ id: 'local-001', name: 'local.jpg', mimeType: 'image/jpeg', size: 100, previewUrl: 'mock-private://local-001', secretNote: 'must-not-persist' }]
  }))
  assert.deepEqual(reported.attachments[0], {
    id: 'local-001', name: 'local.jpg', mimeType: 'image/jpeg', size: 100, previewUrl: 'mock-private://local-001'
  })
})
