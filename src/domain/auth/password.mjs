// 密码散列：HMAC-SHA256 + 随机盐，输出 `salt$hash`（hex）。绝不明文。
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

const HASH_ALGO = 'sha256'
const SALT_BYTES = 16
const DIGEST = 'hex'

export function hashPassword(password, salt = randomBytes(SALT_BYTES).toString('hex')) {
  const hash = createHmac(HASH_ALGO, salt).update(password).digest(DIGEST)
  return `${salt}$${hash}`
}

export function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || !stored.includes('$')) return false
  const [salt, expected] = stored.split('$')
  if (!salt || !expected) return false
  const actual = createHmac(HASH_ALGO, salt).update(password).digest(DIGEST)
  const a = Buffer.from(actual, DIGEST)
  const b = Buffer.from(expected, DIGEST)
  return a.length === b.length && timingSafeEqual(a, b)
}
