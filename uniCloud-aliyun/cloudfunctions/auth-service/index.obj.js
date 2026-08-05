// auth-service 云对象：登录/注册/登出/当前用户
// 依赖：uni-id-common（token 签发/校验）、uni-id-users 集合
// 权限（决策 3）：仅 SUPER_ADMIN 可注册新账号；其余角色只填报本人。
const uniID = require('uni-id-common')
const { hashPassword, verifyPassword } = require('./password.js')
const { assertSupportedRole, isSuperAdmin } = require('./roles.js')

module.exports = {
  async _before() {
    this.db = uniCloud.database()
    this.clientInfo = this.getClientInfo()
    this.uniId = uniID.createInstance({ clientInfo: this.clientInfo })
  },

  // 注册假账号（仅 SUPER_ADMIN 可调用；决策 2：假账号测试阶段）
  async register({ username, password, displayName = '', department = '', role = 'EMPLOYEE' } = {}) {
    const token = this.clientInfo.uniIdToken
    if (token) {
      const checked = await this.uniId.checkToken(token)
      if (checked.errCode || !checked.uid || !isSuperAdmin(checked.role || [])) {
        throw new Error('FORBIDDEN')
      }
    } else {
      throw new Error('FORBIDDEN')
    }
    if (typeof username !== 'string' || username.trim().length < 3) throw new Error('INVALID_PAYLOAD')
    if (typeof password !== 'string' || password.length < 6) throw new Error('INVALID_PAYLOAD')
    assertSupportedRole(role)

    const exists = await this.db.collection('uni-id-users').where({ username: username.trim() }).get()
    if (exists.data.length > 0) throw new Error('ACCOUNT_EXISTS')

    const now = Date.now()
    const record = {
      username: username.trim(),
      passwordHash: hashPassword(password),
      displayName: displayName.trim() || username.trim(),
      department: department.trim(),
      role: [role],
      status: 0,
      token: [],
      createdAt: now,
      updatedAt: now
    }
    const res = await this.db.collection('uni-id-users').add(record)
    return { ok: true, uid: res.id, role: [role] }
  },

  // 登录：校验密码 -> 签发 token（写入 uni-id-users.token 由 uni-id-common 维护）
  async login({ username, password } = {}) {
    if (typeof username !== 'string' || !username.trim()) throw new Error('INVALID_PAYLOAD')
    if (typeof password !== 'string' || !password) throw new Error('INVALID_PAYLOAD')

    const result = await this.db.collection('uni-id-users').where({ username: username.trim() }).get()
    const user = result.data[0]
    if (!user) throw new Error('ACCOUNT_NOT_EXISTS')
    if (user.status === 1) throw new Error('ACCOUNT_BANNED')
    if (user.status === 4) throw new Error('ACCOUNT_CLOSED')
    if (!verifyPassword(password, user.passwordHash)) throw new Error('PASSWORD_ERROR')

    const { token, tokenExpired } = await this.uniId.createToken({ uid: user._id, role: user.role || [] })
    return { errCode: 0, token, tokenExpired, uid: user._id, role: user.role || [] }
  },

  // 登出：通过 valid_token_date 使全部旧 token 失效（uni-id 标准做法）
  async logout() {
    const token = this.clientInfo.uniIdToken
    if (!token) return { ok: true }
    const checked = await this.uniId.checkToken(token)
    if (checked.errCode || !checked.uid) return { ok: true }
    await this.db.collection('uni-id-users').doc(checked.uid).update({ valid_token_date: Date.now() })
    return { ok: true }
  },

  // 当前用户信息（供前端 getCurrentUser 云端版）
  async me() {
    const token = this.clientInfo.uniIdToken
    if (!token) throw new Error('UNAUTHORIZED')
    const checked = await this.uniId.checkToken(token)
    if (checked.errCode || !checked.uid) throw new Error('UNAUTHORIZED')
    const result = await this.db.collection('uni-id-users').doc(checked.uid).get()
    const user = result.data[0]
    if (!user) throw new Error('ACCOUNT_NOT_EXISTS')
    return {
      uid: user._id,
      username: user.username,
      displayName: user.displayName || user.username,
      department: user.department || '',
      role: checked.role || user.role || [],
      tokenExpired: checked.exp * 1000 || 0
    }
  }
}
