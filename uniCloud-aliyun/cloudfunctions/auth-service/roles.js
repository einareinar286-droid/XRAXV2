// 角色体系（云端 CJS 版）：与 src/domain/auth/roles.mjs 一致
// 决策 1：四角色；决策 3：仅 SUPER_ADMIN 可增删改数据。
const ROLES = Object.freeze({
  SUPER_ADMIN: 'SUPER_ADMIN',
  SAFETY_OFFICER: 'SAFETY_OFFICER',
  MARKETING_OFFICER: 'MARKETING_OFFICER',
  EMPLOYEE: 'EMPLOYEE'
})

const SUPPORTED = new Set(Object.values(ROLES))

function assertSupportedRole(role) {
  if (!SUPPORTED.has(role)) {
    const error = new Error(`不支持的账号角色：${role}`)
    error.code = 'INVALID_ROLE'
    throw error
  }
  return role
}

function isSuperAdmin(roles = []) {
  return roles.includes(ROLES.SUPER_ADMIN)
}

module.exports = { ROLES, assertSupportedRole, isSuperAdmin }
