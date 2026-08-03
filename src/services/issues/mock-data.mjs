const safetyReporter = {
  uid: 'safety-001',
  displayName: '安全巡检员',
  department: '安全监察部'
}

const marketingAssignee = {
  uid: 'marketing-001',
  displayName: '市场整改员',
  department: '市场营销部'
}

export const seedIssues = [
  {
    id: 'XR-20260731-001',
    title: '餐饮用户使用可调节减压阀',
    category: '用户用气安全',
    severity: 'CRITICAL',
    isMajor: true,
    description: '现场发现商业用户使用可调节减压阀，已要求停止供气并书面告知整改。',
    location: '云龙区和平路餐饮街 18 号',
    attachments: [],
    status: 'ASSIGNED',
    reporter: safetyReporter,
    assignee: marketingAssignee,
    departmentScope: ['安全监察部', '市场营销部'],
    deadline: '2026-08-07',
    rectification: null,
    createdAt: '2026-07-31T01:20:00.000Z',
    updatedAt: '2026-07-31T02:00:00.000Z',
    version: 2
  },
  {
    id: 'XR-20260730-014',
    title: '配送车未按规定固定气瓶',
    category: '配送作业',
    severity: 'HIGH',
    isMajor: false,
    description: '现场抽查发现配送车气瓶固定措施不规范。',
    location: '铜山区大学路配送线路',
    attachments: [],
    status: 'RECTIFICATION_SUBMITTED',
    reporter: safetyReporter,
    assignee: marketingAssignee,
    departmentScope: ['安全监察部', '市场营销部'],
    deadline: '2026-08-02',
    rectification: {
      note: '已补配固定带并完成全车检查。',
      attachments: [],
      submittedBy: marketingAssignee,
      submittedAt: '2026-07-30T08:10:00.000Z'
    },
    createdAt: '2026-07-30T03:30:00.000Z',
    updatedAt: '2026-07-30T08:10:00.000Z',
    version: 3
  }
]

export const seedAuditEvents = [
  audit('seed-audit-001', 'XR-20260731-001', 'REPORT', null, 'REPORTED', safetyReporter, '2026-07-31T01:20:00.000Z'),
  audit('seed-audit-002', 'XR-20260731-001', 'ASSIGN', 'REPORTED', 'ASSIGNED', safetyReporter, '2026-07-31T02:00:00.000Z'),
  audit('seed-audit-003', 'XR-20260730-014', 'REPORT', null, 'REPORTED', safetyReporter, '2026-07-30T03:30:00.000Z'),
  audit('seed-audit-004', 'XR-20260730-014', 'ASSIGN', 'REPORTED', 'ASSIGNED', safetyReporter, '2026-07-30T04:00:00.000Z'),
  audit('seed-audit-005', 'XR-20260730-014', 'SUBMIT_RECTIFICATION', 'ASSIGNED', 'RECTIFICATION_SUBMITTED', marketingAssignee, '2026-07-30T08:10:00.000Z')
]

function audit(id, entityId, action, fromStatus, toStatus, actor, occurredAt) {
  return {
    id,
    entityType: 'Issue',
    entityId,
    action,
    fromStatus,
    toStatus,
    actorUid: actor.uid,
    actorRole: actor.department === '市场营销部' ? 'MARKETING_OFFICER' : 'SAFETY_OFFICER',
    occurredAt,
    requestId: `seed:${id}`,
    payloadSummary: {}
  }
}
