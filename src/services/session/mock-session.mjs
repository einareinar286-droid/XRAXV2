import { ROLE, ROLE_VALUES } from '../../domain/access/roles.mjs'

const DEFAULT_USERS = Object.freeze([
  Object.freeze({
    uid: 'demo-safety-001',
    displayName: '安全监察员',
    department: '安全监察部',
    role: ROLE.SAFETY_OFFICER
  })
])

function clone(value) {
  return structuredClone(value)
}

function toPublicUser(user) {
  if (!user || typeof user !== 'object') throw new TypeError('Mock user is required')
  if (!ROLE_VALUES.includes(user.role)) throw new TypeError('Mock user has an invalid role')

  return {
    uid: String(user.uid),
    displayName: String(user.displayName),
    department: String(user.department),
    role: user.role,
    isMock: true
  }
}

function resolveUsers(users, localAdmin) {
  const adminUid = localAdmin?.role === ROLE.SUPER_ADMIN ? localAdmin.uid : null
  return users.map((user) => {
    const resolved = toPublicUser(user)
    return resolved.uid === adminUid ? { ...resolved, role: ROLE.SUPER_ADMIN } : resolved
  })
}

export function createMockSession({ users = DEFAULT_USERS, localAdmin = null } = {}) {
  const resolvedUsers = resolveUsers(users, localAdmin)
  if (resolvedUsers.length === 0) throw new TypeError('Mock session requires at least one user')

  let current = clone(resolvedUsers[0])

  return {
    async getCurrentUser() {
      return clone(current)
    },

    setCurrentUser(uid) {
      const next = resolvedUsers.find((user) => user.uid === uid)
      if (!next) throw new RangeError('Unknown mock user')
      current = clone(next)
      return clone(current)
    }
  }
}
