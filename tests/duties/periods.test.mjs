import test from 'node:test'
import assert from 'node:assert/strict'

import {
  PERIOD_TYPES,
  PERIOD_TYPE_LABELS,
  nextDueDate,
  isDueForRollover,
  nextCycleRange
} from '../../src/domain/duties/periods.mjs'

test('advances every usable period type by one full cycle', () => {
  assert.equal(nextDueDate(PERIOD_TYPES.DAILY, '2026-08-04'), '2026-08-05')
  assert.equal(nextDueDate(PERIOD_TYPES.WEEKLY, '2026-08-04'), '2026-08-11')
  assert.equal(nextDueDate(PERIOD_TYPES.BIWEEKLY, '2026-07-24'), '2026-08-07')
  assert.equal(nextDueDate(PERIOD_TYPES.MONTHLY, '2026-08-31'), '2026-09-30')
  assert.equal(nextDueDate(PERIOD_TYPES.QUARTERLY, '2026-08-31'), '2026-11-30')
  assert.equal(nextDueDate(PERIOD_TYPES.SEMIANNUAL, '2026-08-31'), '2027-02-28')
  assert.equal(nextDueDate(PERIOD_TYPES.ANNUAL, '2026-08-31'), '2027-08-31')
})

test('keeps month-end and year-end boundaries safe', () => {
  assert.equal(nextDueDate(PERIOD_TYPES.MONTHLY, '2026-01-31'), '2026-02-28')
  assert.equal(nextDueDate(PERIOD_TYPES.MONTHLY, '2024-01-31'), '2024-02-29')
  assert.equal(nextDueDate(PERIOD_TYPES.MONTHLY, '2026-03-31'), '2026-04-30')
  assert.equal(nextDueDate(PERIOD_TYPES.QUARTERLY, '2026-03-31'), '2026-06-30')
  assert.equal(nextDueDate(PERIOD_TYPES.ANNUAL, '2026-12-31'), '2027-12-31')
})

test('rejects unknown period types', () => {
  assert.throws(
    () => nextDueDate('EVERY_DECADE', '2026-08-04'),
    (error) => error.code === 'INVALID_PERIOD'
  )
})

test('computes the next contiguous cycle range after a due date', () => {
  assert.deepEqual(nextCycleRange(PERIOD_TYPES.MONTHLY, '2026-08-31'), {
    start: '2026-09-01',
    end: '2026-09-30',
    key: 'monthly-2026-09-30'
  })
})

test('flags only tasks whose due date is strictly before the reference date', () => {
  assert.equal(isDueForRollover({ dueDate: '2026-08-04', periodType: 'MONTHLY' }, '2026-08-05'), true)
  assert.equal(isDueForRollover({ dueDate: '2026-08-05', periodType: 'MONTHLY' }, '2026-08-05'), false)
  assert.equal(isDueForRollover({ dueDate: '2026-08-04' }, '2026-08-05'), false)
  assert.equal(isDueForRollover({ dueDate: '2026-08-04', periodType: 'MONTHLY', cycleRolledOver: true }, '2026-08-05'), false)
})
