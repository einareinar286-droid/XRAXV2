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
  },
  { id: 'duty-period-weekly-super', title: '每周安全检查', category: '安全检查', periodType: 'WEEKLY', department: '安全监察部', ownerUid: 'super-admin-001', ownerName: '超级管理员', dueDate: '2026-08-07', cycleStart: '2026-08-01', cycleEnd: '2026-08-07', cycleKey: 'weekly-2026-08-07', status: 'PENDING', evidence: [], submittedAt: null, review: null, cycleRolledOver: false },
  { id: 'duty-period-monthly-super', title: '每月参加月度安全会议', category: '安全会议', periodType: 'MONTHLY', department: '安全监察部', ownerUid: 'super-admin-001', ownerName: '超级管理员', dueDate: '2026-08-20', cycleStart: '2026-08-01', cycleEnd: '2026-08-20', cycleKey: 'monthly-2026-08-20', status: 'PENDING', evidence: [], submittedAt: null, review: null, cycleRolledOver: false },
  { id: 'duty-period-annual-super', title: '每年岗位安全履职考核', category: '履职考核', periodType: 'ANNUAL', department: '安全监察部', ownerUid: 'super-admin-001', ownerName: '超级管理员', dueDate: '2026-08-31', cycleStart: '2025-09-01', cycleEnd: '2026-08-31', cycleKey: 'annual-2026-08-31', status: 'PENDING', evidence: [], submittedAt: null, review: null, cycleRolledOver: false },
  { id: 'duty-period-weekly-safety', title: '每周安全检查', category: '安全检查', periodType: 'WEEKLY', department: '安全监察部', ownerUid: 'safety-001', ownerName: '安全监察员', dueDate: '2026-08-09', cycleStart: '2026-08-03', cycleEnd: '2026-08-09', cycleKey: 'weekly-2026-08-09', status: 'PENDING', evidence: [], submittedAt: null, review: null, cycleRolledOver: false },
  { id: 'duty-period-monthly-safety', title: '每月安全宣讲', category: '安全宣教', periodType: 'MONTHLY', department: '安全监察部', ownerUid: 'safety-001', ownerName: '安全监察员', dueDate: '2026-08-25', cycleStart: '2026-08-01', cycleEnd: '2026-08-25', cycleKey: 'monthly-2026-08-25', status: 'PENDING', evidence: [], submittedAt: null, review: null, cycleRolledOver: false },
  { id: 'duty-period-semiannual-safety', title: '每半年组织应急演练', category: '应急演练', periodType: 'SEMIANNUAL', department: '安全监察部', ownerUid: 'safety-001', ownerName: '安全监察员', dueDate: '2026-12-31', cycleStart: '2026-07-01', cycleEnd: '2026-12-31', cycleKey: 'semiannual-2026-12-31', status: 'PENDING', evidence: [], submittedAt: null, review: null, cycleRolledOver: false },
  { id: 'duty-period-daily-marketing', title: '每日班组晨会', category: '安全宣教', periodType: 'DAILY', department: '市场营销部', ownerUid: 'marketing-001', ownerName: '市场营销员', dueDate: '2026-08-05', cycleStart: '2026-08-05', cycleEnd: '2026-08-05', cycleKey: 'daily-2026-08-05', status: 'PENDING', evidence: [], submittedAt: null, review: null, cycleRolledOver: false },
  { id: 'duty-period-monthly-marketing', title: '每月线下抽查不低于20户', category: '线下抽查', periodType: 'MONTHLY', department: '市场营销部', ownerUid: 'marketing-001', ownerName: '市场营销员', dueDate: '2026-08-28', cycleStart: '2026-08-01', cycleEnd: '2026-08-28', cycleKey: 'monthly-2026-08-28', status: 'PENDING', evidence: [], submittedAt: null, review: null, cycleRolledOver: false },
  { id: 'duty-period-quarterly-marketing', title: '每季度业务安全宣讲', category: '安全宣教', periodType: 'QUARTERLY', department: '市场营销部', ownerUid: 'marketing-001', ownerName: '市场营销员', dueDate: '2026-09-30', cycleStart: '2026-07-01', cycleEnd: '2026-09-30', cycleKey: 'quarterly-2026-09-30', status: 'PENDING', evidence: [], submittedAt: null, review: null, cycleRolledOver: false },
  { id: 'duty-period-annual-marketing', title: '每年组织本业务应急处置方案演练', category: '应急演练', periodType: 'ANNUAL', department: '市场营销部', ownerUid: 'marketing-001', ownerName: '市场营销员', dueDate: '2026-08-31', cycleStart: '2025-09-01', cycleEnd: '2026-08-31', cycleKey: 'annual-2026-08-31', status: 'PENDING', evidence: [], submittedAt: null, review: null, cycleRolledOver: false },
  { id: 'duty-period-daily-employee', title: '每日班组晨会', category: '安全宣教', periodType: 'DAILY', department: '生产运营部', ownerUid: 'employee-001', ownerName: '普通员工', dueDate: '2026-08-06', cycleStart: '2026-08-06', cycleEnd: '2026-08-06', cycleKey: 'daily-2026-08-06', status: 'PENDING', evidence: [], submittedAt: null, review: null, cycleRolledOver: false },
  { id: 'duty-period-biweekly-employee', title: '每两周安全检查', category: '安全检查', periodType: 'BIWEEKLY', department: '生产运营部', ownerUid: 'employee-001', ownerName: '普通员工', dueDate: '2026-08-16', cycleStart: '2026-08-03', cycleEnd: '2026-08-16', cycleKey: 'biweekly-2026-08-16', status: 'PENDING', evidence: [], submittedAt: null, review: null, cycleRolledOver: false },
  { id: 'duty-period-monthly-employee', title: '每月部门会议', category: '安全会议', periodType: 'MONTHLY', department: '生产运营部', ownerUid: 'employee-001', ownerName: '普通员工', dueDate: '2026-08-18', cycleStart: '2026-08-01', cycleEnd: '2026-08-18', cycleKey: 'monthly-2026-08-18', status: 'PENDING', evidence: [], submittedAt: null, review: null, cycleRolledOver: false },
  { id: 'duty-period-monthly-employee-b', title: '每月培训', category: '安全培训', periodType: 'MONTHLY', department: '生产运营部', ownerUid: 'employee-001', ownerName: '普通员工', dueDate: '2026-08-26', cycleStart: '2026-08-01', cycleEnd: '2026-08-26', cycleKey: 'monthly-2026-08-26', status: 'PENDING', evidence: [], submittedAt: null, review: null, cycleRolledOver: false }
])
