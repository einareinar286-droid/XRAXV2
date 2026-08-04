import { getCurrentUser } from '../duties/index.mjs'
import { defaultOperationLogAdapter } from './mock-adapter.mjs'

export const isMockOperationLogMode = true

export async function listOperationLogs(filters) {
  return defaultOperationLogAdapter.list(filters, await getCurrentUser())
}
