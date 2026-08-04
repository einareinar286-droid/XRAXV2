import assert from 'node:assert/strict'
import test from 'node:test'

import { buildImportPreflight, normalizePhone } from '../../src/domain/personnel/import-preflight.mjs'

test('normalizes mainland mobile numbers without preserving formatting noise', () => {
  assert.equal(normalizePhone(' 138 0000-0001 '), '13800000001')
  assert.equal(normalizePhone('+86 13800000001'), '13800000001')
  assert.equal(normalizePhone('010-88888888'), null)
})

test('inherits grouped department values and sends unsafe roster rows to review', () => {
  const result = buildImportPreflight([
    { displayName: '演示甲', department: '安全监察部', position: '检查员', phone: '13800000001' },
    { displayName: '演示乙', department: '', position: '送气工', phone: '13800000002' },
    { displayName: '演示丙', department: '', position: '送气工', phone: '13800000002' },
    { displayName: '', department: '市场营销部', position: '员工', phone: '13900000003' },
    { displayName: '演示丁', department: '市场营销部', position: '', phone: 'not-a-mobile' }
  ])

  assert.deepEqual(result.summary, {
    sourceCount: 5,
    acceptedCount: 2,
    pendingVerificationCount: 2,
    invalidCount: 2
  })
  assert.deepEqual(result.accepted.map(({ employeeId, displayName, department, position, phone, accountStatus }) => ({ employeeId, displayName, department, position, phone, accountStatus })), [
    { employeeId: 'EMP-000001', displayName: '演示甲', department: '安全监察部', position: '检查员', phone: '13800000001', accountStatus: 'ACTIVE' },
    { employeeId: 'EMP-000002', displayName: '演示乙', department: '安全监察部', position: '送气工', phone: '13800000002', accountStatus: 'PENDING_VERIFICATION' }
  ])
  assert.deepEqual(result.reviewItems.map((item) => ({ sourceRow: item.sourceRow, reasonCodes: item.reasonCodes, suggestedDepartment: item.suggestedDepartment })), [
    { sourceRow: 3, reasonCodes: ['DUPLICATE_PHONE'], suggestedDepartment: '安全监察部' },
    { sourceRow: 4, reasonCodes: ['MISSING_NAME'], suggestedDepartment: '市场营销部' },
    { sourceRow: 5, reasonCodes: ['MISSING_POSITION', 'INVALID_PHONE'], suggestedDepartment: '市场营销部' }
  ])
})
