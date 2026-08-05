// 密码散列（云端 CJS 版）：与 src/domain/auth/password.mjs 算法一致（HMAC-SHA256 + 随机盐）
const { createHmac, randomBytes, timingSafeEqual } = require('node:crypto')

const HASH_ALGO = 'sha256'
const SALT_BYTES = 16
const DIGEST = 'hex'

function hashPassword(password, salt) {
  const s = salt || randomBytes(SALT_BYTES).toString('hex')
  const hash = createHmac(HASH_ALGO, s).update(password).digest(DIGEST)
  return `${s}$${hash}`
}

function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || !stored.includes('$')) return false
  const [salt, expected] = stored.split('$')
  if (!salt || !expected) return false
  const actual = createHmac(HASH_ALGO, salt).update(password).digest(DIGEST)
  const a = Buffer.from(actual, DIGEST)
  const b = Buffer.from(expected, DIGEST)
  return a.length === b.length && timingSafeEqual(a, b)
}

module.exports = { hashPassword, verifyPassword }
