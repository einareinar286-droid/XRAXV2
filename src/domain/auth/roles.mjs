// 角色体系（决策 1 & 3）：四角色；仅 SUPER_ADMIN 可增删改数据，其余只填报本人。
export const ROLES = Object.freeze({
  SUPER_ADMIN: 'SUPER_ADMIN',
  SAFETY_OFFICER: 'SAFETY_OFFICER',
  MARKETING_OFFICER: 'MARKETING_OFFICER',
  EMPLOYEE: 'EMPLOYEE'
})

const SUPPORTED = new Set(Object.values(ROLES))

export function assertSupportedRole(role) {
  if (!SUPPORTED.has(role)) {
    const error = new Error(`不支持的账号角色：${role}`)
    error.code = 'INVALID_ROLE'
    throw error
  }
  return role
}

export function isSuperAdmin(roles = []) {
  return roles.includes(ROLES.SUPER_ADMIN)
}

export function isSelf({ uid, ownerUid }) {
  return Boolean(uid && uid === ownerUid)
}
