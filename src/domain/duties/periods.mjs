export const PERIOD_TYPES = Object.freeze({
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  BIWEEKLY: 'BIWEEKLY',
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  SEMIANNUAL: 'SEMIANNUAL',
  ANNUAL: 'ANNUAL'
})

export const PERIOD_TYPE_LABELS = Object.freeze({
  [PERIOD_TYPES.DAILY]: '每日',
  [PERIOD_TYPES.WEEKLY]: '每周',
  [PERIOD_TYPES.BIWEEKLY]: '每两周',
  [PERIOD_TYPES.MONTHLY]: '每月',
  [PERIOD_TYPES.QUARTERLY]: '每季度',
  [PERIOD_TYPES.SEMIANNUAL]: '每半年',
  [PERIOD_TYPES.ANNUAL]: '每年'
})

function periodError(code, message) {
  return Object.assign(new Error(message), { code })
}

function parseDate(date) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date))
  if (!match) throw periodError('INVALID_DATE', `无效的日期：${date}`)
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
}

function formatDate(year, month, day) {
  const pad = (value) => String(value).padStart(2, '0')
  return `${year}-${pad(month)}-${pad(day)}`
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

const MONTH_STEPS = Object.freeze({
  [PERIOD_TYPES.MONTHLY]: 1,
  [PERIOD_TYPES.QUARTERLY]: 3,
  [PERIOD_TYPES.SEMIANNUAL]: 6
})

export function nextDueDate(periodType, dueDate) {
  if (!PERIOD_TYPES[periodType]) throw periodError('INVALID_PERIOD', `未知的履职周期：${periodType}`)
  const { year, month, day } = parseDate(dueDate)

  if (periodType === PERIOD_TYPES.DAILY) {
    const date = new Date(Date.UTC(year, month - 1, day + 1))
    return formatDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
  }
  if (periodType === PERIOD_TYPES.WEEKLY) {
    const date = new Date(Date.UTC(year, month - 1, day + 7))
    return formatDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
  }
  if (periodType === PERIOD_TYPES.BIWEEKLY) {
    const date = new Date(Date.UTC(year, month - 1, day + 14))
    return formatDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
  }
  if (periodType === PERIOD_TYPES.ANNUAL) {
    const nextYear = year + 1
    const safeDay = Math.min(day, daysInMonth(nextYear, month))
    return formatDate(nextYear, month, safeDay)
  }
  if (MONTH_STEPS[periodType]) {
    const rawMonthIndex = month - 1 + MONTH_STEPS[periodType]
    const nextYear = year + Math.floor(rawMonthIndex / 12)
    const nextMonth = (rawMonthIndex % 12) + 1
    const safeDay = Math.min(day, daysInMonth(nextYear, nextMonth))
    return formatDate(nextYear, nextMonth, safeDay)
  }
  throw periodError('INVALID_PERIOD', `未知的履职周期：${periodType}`)
}

export function isDueForRollover(task, asOf) {
  if (!task?.periodType || task.cycleRolledOver) return false
  const asOfMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(asOf || ''))
  const dueMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(task.dueDate || ''))
  if (!asOfMatch || !dueMatch) return false
  return dueMatch[0] < asOfMatch[0]
}

export function nextCycleRange(periodType, dueDate) {
  const end = nextDueDate(periodType, dueDate)
  const { year, month, day } = parseDate(dueDate)
  const startDate = new Date(Date.UTC(year, month - 1, day + 1))
  const start = formatDate(startDate.getUTCFullYear(), startDate.getUTCMonth() + 1, startDate.getUTCDate())
  return { start, end, key: `${periodType.toLowerCase()}-${end}` }
}
