const MOBILE_PATTERN = /^1[3-9]\d{9}$/

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function normalizePhone(value) {
  const compact = text(value).replace(/[\s-]/g, '').replace(/^\+?86/, '')
  return MOBILE_PATTERN.test(compact) ? compact : null
}

export function fillDownDepartment(rows) {
  let department = ''
  return rows.map((row) => {
    const supplied = text(row?.department)
    if (supplied) department = supplied
    return { ...row, department }
  })
}

export function createEmployeeId(_row, ordinal) {
  return `EMP-${String(ordinal).padStart(6, '0')}`
}

export function buildImportPreflight(rows) {
  const normalizedRows = fillDownDepartment(Array.isArray(rows) ? rows : [])
  const phoneCounts = new Map()
  const candidates = normalizedRows.map((row, index) => {
    const phone = normalizePhone(row.phone)
    if (phone) phoneCounts.set(phone, (phoneCounts.get(phone) || 0) + 1)
    return {
      sourceRow: index + 1,
      displayName: text(row.displayName),
      department: text(row.department),
      position: text(row.position),
      phone
    }
  })
  const seenPhones = new Set()
  const accepted = []
  const reviewItems = []
  let pendingVerificationCount = 0
  let invalidCount = 0

  for (const row of candidates) {
    const reasonCodes = []
    if (!row.displayName) reasonCodes.push('MISSING_NAME')
    if (!row.department) reasonCodes.push('MISSING_DEPARTMENT')
    if (!row.position) reasonCodes.push('MISSING_POSITION')
    if (!row.phone) reasonCodes.push('INVALID_PHONE')
    const isDuplicatePhone = Boolean(row.phone && phoneCounts.get(row.phone) > 1)
    if (isDuplicatePhone) reasonCodes.push('DUPLICATE_PHONE')

    const hasIdentityError = reasonCodes.some((code) => ['MISSING_NAME', 'MISSING_DEPARTMENT', 'MISSING_POSITION', 'INVALID_PHONE'].includes(code))
    if (hasIdentityError) invalidCount += 1
    const isPrimaryDuplicate = isDuplicatePhone && !seenPhones.has(row.phone)
    if (row.phone) seenPhones.add(row.phone)

    if (!hasIdentityError && (!isDuplicatePhone || isPrimaryDuplicate)) {
      const accountStatus = isDuplicatePhone ? 'PENDING_VERIFICATION' : 'ACTIVE'
      if (accountStatus === 'PENDING_VERIFICATION') pendingVerificationCount += 1
      accepted.push({
        employeeId: createEmployeeId(row, accepted.length + 1),
        displayName: row.displayName,
        department: row.department,
        position: row.position,
        phone: row.phone,
        accountStatus
      })
      continue
    }

    if (isDuplicatePhone && !hasIdentityError) pendingVerificationCount += 1
    reviewItems.push({
      sourceRow: row.sourceRow,
      reasonCodes,
      suggestedDepartment: row.department || null
    })
  }

  return {
    accepted,
    reviewItems,
    summary: {
      sourceCount: candidates.length,
      acceptedCount: accepted.length,
      pendingVerificationCount,
      invalidCount
    }
  }
}
