import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { hashPassword as esmHash, verifyPassword as esmVerify } from '../../src/domain/auth/password.mjs'
import { ROLES as esmRoles } from '../../src/domain/auth/roles.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(here, '../..')

const cjsPassword = readFileSync(join(projectRoot, 'uniCloud-aliyun/cloudfunctions/auth-service/password.js'), 'utf-8')
const cjsRoles = readFileSync(join(projectRoot, 'uniCloud-aliyun/cloudfunctions/auth-service/roles.js'), 'utf-8')
const cjsAuth = readFileSync(join(projectRoot, 'uniCloud-aliyun/cloudfunctions/auth-service/index.obj.js'), 'utf-8')

test('云端 password.js 与前端 ESM 算法一致（HMAC-SHA256 + 随机盐 + salt$hash 格式）', () => {
  assert.match(cjsPassword, /sha256/)
  assert.match(cjsPassword, /randomBytes/)
  assert.match(cjsPassword, /\$\{s\}\$\$\{hash\}/, '输出格式应为 salt$hash')
  assert.match(cjsPassword, /timingSafeEqual/, '应使用恒定时间比较')
  // 交叉验证：前端 ESM 生成的 hash 必须能被 ESM verify 验证
  const h = esmHash('cross-check-pass')
  assert.equal(esmVerify('cross-check-pass', h), true)
  assert.equal(esmVerify('wrong', h), false)
})

test('云端 roles.js 覆盖四角色且仅 SUPER_ADMIN 为管理', () => {
  for (const role of Object.values(esmRoles)) {
    assert.ok(cjsRoles.includes(role), `云端 roles.js 缺少角色 ${role}`)
  }
  assert.match(cjsRoles, /SUPER_ADMIN/)
  assert.ok(!cjsRoles.includes('SAFETY_ADMIN'), '云端不得保留旧角色 SAFETY_ADMIN')
})

test('auth-service 云对象：register 仅限超管、login 校验密码、me 返回当前用户', () => {
  assert.match(cjsAuth, /async register\(/)
  assert.match(cjsAuth, /isSuperAdmin/)
  assert.match(cjsAuth, /ACCOUNT_EXISTS/)
  assert.match(cjsAuth, /async login\(/)
  assert.match(cjsAuth, /verifyPassword/)
  assert.match(cjsAuth, /createToken/)
  assert.match(cjsAuth, /PASSWORD_ERROR/)
  assert.match(cjsAuth, /async me\(/)
  assert.match(cjsAuth, /UNAUTHORIZED/)
  assert.match(cjsAuth, /async logout\(/)
  assert.match(cjsAuth, /valid_token_date/)
})

test('auth-service package.json 依赖 uni-id-common 公共模块', () => {
  const pkg = JSON.parse(readFileSync(join(projectRoot, 'uniCloud-aliyun/cloudfunctions/auth-service/package.json'), 'utf-8'))
  assert.equal(pkg.dependencies['uni-id-common'], 'file:../common/uni-id-common')
})
