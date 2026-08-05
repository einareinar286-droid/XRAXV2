import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { PERIOD_TYPES, PERIOD_TYPE_LABELS } from '../../src/domain/duties/periods.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(here, '../..')

function readCloudSchema() {
  const raw = readFileSync(join(projectRoot, 'uniCloud-aliyun/database/xr-duty-templates.schema.json'), 'utf-8')
  return JSON.parse(raw)
}

function readDutyServiceSource() {
  return readFileSync(join(projectRoot, 'uniCloud-aliyun/cloudfunctions/duty-service/index.obj.js'), 'utf-8')
}

// 前端七种周期的小写枚举值（云端 schema/云对象使用小写）
const FRONTEND_LOWER = Object.values(PERIOD_TYPES).map((v) => v.toLowerCase())

test('云端 templates.schema frequency 枚举覆盖前端全部 7 种周期', () => {
  const schema = readCloudSchema()
  const enumItems = schema.properties.frequency.enum
  const cloudValues = enumItems.map((item) => item.value)
  for (const value of FRONTEND_LOWER) {
    assert.ok(cloudValues.includes(value), `schema frequency 缺少周期：${value}`)
  }
  assert.equal(cloudValues.length, FRONTEND_LOWER.length, 'schema 枚举数量应与前端一致（无多余/缺失）')
})

test('云端 duty-service advancePeriod 支持 daily 周期', () => {
  const source = readDutyServiceSource()
  assert.match(source, /frequency === 'daily'/, 'advancePeriod 必须处理 daily 分支')
})

test('前端 PERIOD_TYPE_LABELS 覆盖全部 7 种周期（防止前端先缩水）', () => {
  const labels = Object.values(PERIOD_TYPES).map((v) => PERIOD_TYPE_LABELS[v])
  assert.ok(labels.every((label) => Boolean(label)), '每种周期都应有中文标签')
  assert.equal(labels.length, 7)
})
