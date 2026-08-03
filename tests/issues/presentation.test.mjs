import test from 'node:test'
import assert from 'node:assert/strict'
import { buildIssueLifecycle, getIssueStageSummary } from '../../src/domain/issues/presentation.mjs'

test('maps a submitted rectification to the safety review node', () => {
  assert.deepEqual(buildIssueLifecycle('RECTIFICATION_SUBMITTED').map(({ key, state, returned }) => ({ key, state, returned })), [
    { key: 'report', state: 'completed', returned: false },
    { key: 'assign', state: 'completed', returned: false },
    { key: 'rectify', state: 'completed', returned: false },
    { key: 'review', state: 'current', returned: false },
    { key: 'close', state: 'upcoming', returned: false }
  ])
  assert.equal(getIssueStageSummary('RECTIFICATION_SUBMITTED').nextLabel, '安全监察复核')
})

test('maps a rejected issue back to rectification with a return marker', () => {
  const rectify = buildIssueLifecycle('REJECTED').find((step) => step.key === 'rectify')
  assert.equal(rectify.state, 'current')
  assert.equal(rectify.returned, true)
  assert.equal(getIssueStageSummary('REJECTED').hint, '请根据退回原因补充整改佐证后再次提交')
})

test('describes a closed issue as archived', () => {
  const summary = getIssueStageSummary('CLOSED')
  assert.equal(summary.currentLabel, '闭环')
  assert.equal(summary.nextLabel, '已归档')
  assert.equal(summary.isTerminal, true)
})

test('marks an assigned issue as waiting for marketing rectification', () => {
  const summary = getIssueStageSummary('ASSIGNED')
  assert.equal(summary.currentLabel, '交办')
  assert.equal(summary.nextLabel, '市场营销部整改')
  assert.equal(summary.isActionRequired, true)
})
