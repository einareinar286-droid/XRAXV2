export const seedDutyTasks = Object.freeze([
  {
    id: 'duty-safety-approved', title: '周安全检查记录', category: '安全检查', frequency: 'weekly',
    department: '安全监察部', ownerUid: 'safety-001', ownerName: '安全监察员', dueDate: '2026-08-02',
    status: 'APPROVED', evidence: { note: '已完成本周现场检查。', attachments: [] },
    submittedAt: '2026-08-01T08:00:00.000Z', review: { decision: 'APPROVE', note: '审核通过。', reviewerUid: 'super-admin-001', reviewedAt: '2026-08-01T10:00:00.000Z' }
  },
  {
    id: 'duty-safety-pending', title: '班前安全教育记录', category: '安全宣教', frequency: 'weekly',
    department: '安全监察部', ownerUid: 'employee-001', ownerName: '普通员工', dueDate: '2026-08-05',
    status: 'PENDING', evidence: [], submittedAt: null, review: null
  },
  {
    id: 'duty-marketing-returned', title: '入户安检抽查', category: '线下抽查', frequency: 'monthly',
    department: '市场营销部', ownerUid: 'marketing-001', ownerName: '市场营销员', dueDate: '2026-08-01',
    status: 'RETURNED', evidence: { note: '已完成抽查。', attachments: [] }, submittedAt: '2026-08-01T12:00:00.000Z',
    review: { decision: 'RETURN', note: '请补充抽查明细。', reviewerUid: 'marketing-001', reviewedAt: '2026-08-02T08:00:00.000Z' }
  },
  {
    id: 'duty-marketing-submitted', title: '用户安全活动记录', category: '安全活动', frequency: 'monthly',
    department: '市场营销部', ownerUid: 'marketing-staff-002', ownerName: '市场员工', dueDate: '2026-08-03',
    status: 'SUBMITTED', evidence: { note: '已开展用户安全宣传。', attachments: [] }, submittedAt: '2026-08-02T08:00:00.000Z', review: null
  },
  {
    id: 'duty-production-pending', title: '设备点检记录', category: '安全检查', frequency: 'weekly',
    department: '生产运营部', ownerUid: 'production-001', ownerName: '生产员工', dueDate: '2026-08-04',
    status: 'PENDING', evidence: [], submittedAt: null, review: null
  }
])
