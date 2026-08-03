const LIFECYCLE_BLUEPRINT = Object.freeze([
  ['report', '上报'],
  ['assign', '交办'],
  ['rectify', '整改'],
  ['review', '复核'],
  ['close', '闭环']
])

const STAGE_SUMMARIES = Object.freeze({
  REPORTED: Object.freeze({
    current: 0,
    nextLabel: '安全监察交办',
    hint: '等待安全监察人员明确责任部门和整改期限'
  }),
  ASSIGNED: Object.freeze({
    current: 1,
    nextLabel: '市场营销部整改',
    hint: '请在整改期限内提交现场佐证'
  }),
  RECTIFICATION_SUBMITTED: Object.freeze({
    current: 3,
    nextLabel: '安全监察复核',
    hint: '整改佐证已提交，等待安全监察复核'
  }),
  REJECTED: Object.freeze({
    current: 2,
    returned: true,
    nextLabel: '市场营销部再次整改',
    hint: '请根据退回原因补充整改佐证后再次提交'
  }),
  CLOSED: Object.freeze({
    current: 4,
    nextLabel: '已归档',
    hint: '隐患已闭环归档，可查看完整审计记录'
  })
})

function getStage(status) {
  return STAGE_SUMMARIES[status] || STAGE_SUMMARIES.REPORTED
}

export function buildIssueLifecycle(status) {
  const stage = getStage(status)
  return LIFECYCLE_BLUEPRINT.map(([key, label], index) => ({
    key,
    label,
    state: index < stage.current ? 'completed' : index === stage.current ? 'current' : 'upcoming',
    returned: Boolean(stage.returned && key === 'rectify')
  }))
}

export function getIssueStageSummary(status) {
  const stage = getStage(status)
  return {
    currentLabel: LIFECYCLE_BLUEPRINT[stage.current][1],
    nextLabel: stage.nextLabel,
    hint: stage.hint,
    isTerminal: status === 'CLOSED',
    isActionRequired: status !== 'CLOSED'
  }
}
