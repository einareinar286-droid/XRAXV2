// P2 契约测试：cloud-adapter 的字段映射与接口形状（不依赖真实 uniCloud）
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mapInstanceToTask, mapDashboard, createCloudDutyAdapter } from '../../src/services/duties/cloud-adapter.mjs'

// 模拟一条云端 instance（duty-service 返回形状）
const cloudInstance = {
  _id: 'inst-001',
  ownerUid: 'marketing-001',
  ownerName: '市场营销员',
  department: '市场营销部',
  actionName: '入户安检抽查',
  title: '入户安检抽查',
  category: '线下抽查',
  frequency: 'monthly',
  periodType: 'MONTHLY',
  periodStart: '2026-08-01',
  periodEnd: '2026-08-31',
  cycleKey: 'monthly-2026-08-01',
  dueDate: '2026-08-31',
  status: 'PENDING',
  evidence: null,
  submittedAt: null,
  review: null,
  createdAt: 1,
  updatedAt: 1
}

test('mapInstanceToTask：_id→id、periodStart/End→cycleStart/End、保留 title/evidence/review', () => {
  const task = mapInstanceToTask(cloudInstance)
  assert.equal(task.id, 'inst-001')
  assert.equal(task.title, '入户安检抽查')
  assert.equal(task.periodType, 'MONTHLY')
  assert.equal(task.cycleStart, '2026-08-01')
  assert.equal(task.cycleEnd, '2026-08-31')
  assert.equal(task.dueDate, '2026-08-31')
  assert.equal(task.status, 'PENDING')
  assert.equal(task.ownerUid, 'marketing-001')
  assert.equal(task.ownerName, '市场营销员')
  assert.equal(task.department, '市场营销部')
  assert.equal(task.category, '线下抽查')
  assert.equal(task.frequency, 'monthly')
})

test('mapInstanceToTask：evidence/review 结构透传', () => {
  const withData = {
    ...cloudInstance,
    status: 'SUBMITTED',
    evidence: { note: '已完成整改', attachments: [{ id: 'a1' }] },
    submittedAt: '2026-08-05T08:00:00.000Z',
    review: { decision: 'APPROVE', note: '通过', reviewerUid: 'super-admin-001', reviewedAt: '2026-08-05T10:00:00.000Z' }
  }
  const task = mapInstanceToTask(withData)
  assert.equal(task.evidence.note, '已完成整改')
  assert.equal(task.evidence.attachments.length, 1)
  assert.equal(task.submittedAt, '2026-08-05T08:00:00.000Z')
  assert.equal(task.review.decision, 'APPROVE')
})

test('mapDashboard：云端聚合字段透传 + assessmentItems 补 id', () => {
  const cloud = {
    company: { dueCount: 10, onTimeApprovedCount: 8, completionRate: 80, qualified: false, assessmentCount: 2, assessmentTaskIds: ['a', 'b'], applicable: true },
    departments: [{ department: '安全监察部', employeeCount: 3, dueCount: 4, onTimeApprovedCount: 4, completionRate: 100, qualified: true, assessmentCount: 0, assessmentTaskIds: [], applicable: true }],
    people: [{ employeeId: 'EMP-1', uid: 'u1', displayName: '张三', department: '安全监察部', position: '员工', dueCount: 2, onTimeApprovedCount: 2, completionRate: 100, qualified: true, assessmentCount: 0, assessmentTaskIds: [], applicable: true, dutyStatus: 'COMPLETED' }],
    reviewItems: [cloudInstance],
    assessmentItems: [{ ...cloudInstance, assessmentReason: '未提交履职记录' }]
  }
  const mapped = mapDashboard(cloud)
  assert.equal(mapped.company.completionRate, 80)
  assert.equal(mapped.departments[0].department, '安全监察部')
  assert.equal(mapped.people[0].dutyStatus, 'COMPLETED')
  assert.equal(mapped.reviewItems[0].id, 'inst-001')
  assert.equal(mapped.assessmentItems[0].id, 'inst-001')
  assert.equal(mapped.assessmentItems[0].assessmentReason, '未提交履职记录')
})

test('createCloudDutyAdapter 暴露与 mock-adapter 相同的方法名', () => {
  const adapter = createCloudDutyAdapter({ importObject: () => null })
  for (const method of ['getCurrentUser', 'listMyDuties', 'submitDuty', 'reviewDuty', 'getDutyDashboard', 'listDutyPeople']) {
    assert.equal(typeof adapter[method], 'function', `缺少方法 ${method}`)
  }
  assert.equal(typeof adapter.setMockRole, 'function')
})
