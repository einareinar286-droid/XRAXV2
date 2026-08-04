import assert from 'node:assert/strict'
import test from 'node:test'

import {
  canReviewDuty,
  canViewCompanyDutyDashboard,
  canViewDutyPeople,
  canViewOperationLogs
} from '../../src/domain/duties/access-policy.mjs'

test('grants company duty and log access only to safety and super administrators', () => {
  const safety = { role: 'SAFETY_OFFICER' }
  const superAdmin = { role: 'SUPER_ADMIN' }
  const marketing = { role: 'MARKETING_OFFICER' }
  const employee = { role: 'EMPLOYEE' }

  for (const user of [safety, superAdmin]) {
    assert.equal(canViewCompanyDutyDashboard(user), true)
    assert.equal(canViewDutyPeople(user), true)
    assert.equal(canViewOperationLogs(user), true)
  }
  assert.equal(canReviewDuty(superAdmin), true)
  assert.equal(canReviewDuty(safety), false)
  for (const user of [marketing, employee]) {
    assert.equal(canViewCompanyDutyDashboard(user), false)
    assert.equal(canViewDutyPeople(user), false)
    assert.equal(canReviewDuty(user), false)
    assert.equal(canViewOperationLogs(user), false)
  }
})
