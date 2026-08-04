import { canViewOperationLogs } from '../../domain/duties/access-policy.mjs'
import { createOperationLogRecord } from '../../domain/operation-logs/record.mjs'

function operationLogError(code, message) {
  return Object.assign(new Error(message), { code })
}

export function createMockOperationLogAdapter({ now = () => new Date().toISOString(), seedRecords = [] } = {}) {
  let sequence = 0
  const records = seedRecords.map((record) => ({ ...record }))

  return {
    append(input) {
      sequence += 1
      const record = createOperationLogRecord({
        ...input,
        id: `op-${String(sequence).padStart(6, '0')}`,
        occurredAt: input.occurredAt || now()
      })
      records.push(record)
      return structuredClone(record)
    },

    async list({ page = 1, pageSize = 20, action, actorId, dateRange } = {}, viewer) {
      if (!canViewOperationLogs(viewer)) throw operationLogError('FORBIDDEN', '当前角色不能查看操作日志')
      const safePage = Math.max(1, Number(page) || 1)
      const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 20))
      const filtered = records
        .filter((record) => !action || record.action === action)
        .filter((record) => !actorId || record.actorId === actorId)
        .filter((record) => !dateRange?.from || record.occurredAt >= dateRange.from)
        .filter((record) => !dateRange?.to || record.occurredAt <= dateRange.to)
        .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt) || right.id.localeCompare(left.id))
      const offset = (safePage - 1) * safePageSize
      return {
        items: structuredClone(filtered.slice(offset, offset + safePageSize)),
        total: filtered.length,
        page: safePage,
        pageSize: safePageSize,
        hasMore: offset + safePageSize < filtered.length
      }
    }
  }
}

export const defaultOperationLogAdapter = createMockOperationLogAdapter()
