import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateRectificationPayload } from '../../src/domain/issues/validation.mjs'

const base = { version: 1, requestId: 'test-rq-1' }

function attachment(overrides = {}) {
  return {
    id: 'att-1',
    name: 'photo.jpg',
    mimeType: 'image/jpeg',
    size: 1024,
    previewUrl: 'blob:http://localhost/abc',
    ...overrides
  }
}

test('整改：纯图片（无文字）允许提交', () => {
  const result = validateRectificationPayload({ ...base, note: '', attachments: [attachment()] })
  assert.equal(result.note, '')
  assert.equal(result.attachments.length, 1)
})

test('整改：纯文字（无图片）允许提交', () => {
  const result = validateRectificationPayload({ ...base, note: '已整改完成', attachments: [] })
  assert.equal(result.note, '已整改完成')
})

test('整改：文字和图片都没有则拒绝', () => {
  assert.throws(() => validateRectificationPayload({ ...base, note: '', attachments: [] }), (err) => err.code === 'INVALID_PAYLOAD')
})

test('整改：文字超过 1000 字拒绝', () => {
  assert.throws(() => validateRectificationPayload({ ...base, note: 'a'.repeat(1001), attachments: [] }), (err) => err.code === 'INVALID_PAYLOAD')
})
