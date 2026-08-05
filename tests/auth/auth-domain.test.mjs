import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hashPassword, verifyPassword } from '../../src/domain/auth/password.mjs'
import { assertSupportedRole, isSuperAdmin, isSelf } from '../../src/domain/auth/roles.mjs'

test('hashPassword 使用 HMAC-SHA256 且不含明文', () => {
  const hash = hashPassword('test-password-001')
  assert.equal(typeof hash, 'string')
  assert.ok(hash.length >= 40, '散列应足够长')
  assert.ok(!hash.includes('test-password-001'), '散列不得包含明文')
})

test('hashPassword 确定性与随机盐：同一密码两次结果不同但都可验证', () => {
  const h1 = hashPassword('same-pass')
  const h2 = hashPassword('same-pass')
  assert.notEqual(h1, h2, '应带随机盐')
  assert.equal(verifyPassword('same-pass', h1), true)
  assert.equal(verifyPassword('same-pass', h2), true)
})

test('verifyPassword 拒绝错误密码', () => {
  const hash = hashPassword('right-pass')
  assert.equal(verifyPassword('wrong-pass', hash), false)
})

test('assertSupportedRole 只接受四角色', () => {
  assert.equal(assertSupportedRole('SUPER_ADMIN'), 'SUPER_ADMIN')
  assert.equal(assertSupportedRole('SAFETY_OFFICER'), 'SAFETY_OFFICER')
  assert.equal(assertSupportedRole('MARKETING_OFFICER'), 'MARKETING_OFFICER')
  assert.equal(assertSupportedRole('EMPLOYEE'), 'EMPLOYEE')
  assert.throws(() => assertSupportedRole('SAFETY_ADMIN'), (err) => err.code === 'INVALID_ROLE')
  assert.throws(() => assertSupportedRole(''), (err) => err.code === 'INVALID_ROLE')
})

test('isSuperAdmin 只认 SUPER_ADMIN（决策 3：仅超管可改数据）', () => {
  assert.equal(isSuperAdmin(['SUPER_ADMIN']), true)
  assert.equal(isSuperAdmin(['SAFETY_OFFICER']), false)
  assert.equal(isSuperAdmin([]), false)
})

test('isSelf 判定本人数据（ownerUid === uid）', () => {
  assert.equal(isSelf({ uid: 'u1', ownerUid: 'u1' }), true)
  assert.equal(isSelf({ uid: 'u1', ownerUid: 'u2' }), false)
})
