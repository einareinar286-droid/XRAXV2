import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(here, '../..')

function readDutyServiceSource() {
  return readFileSync(join(projectRoot, 'uniCloud-aliyun/cloudfunctions/duty-service/index.obj.js'), 'utf-8')
}

function readCloudSchema(name) {
  const raw = readFileSync(join(projectRoot, `uniCloud-aliyun/database/${name}.schema.json`), 'utf-8')
  return JSON.parse(raw)
}

const src = readDutyServiceSource()

test('P1: 云对象角色体系改为四角色，仅 SUPER_ADMIN 可管理（决策 3）', () => {
  assert.ok(!src.includes('SAFETY_ADMIN'), '必须移除旧角色 SAFETY_ADMIN')
  assert.match(src, /SUPER_ADMIN/, 'isAdmin 应检查 SUPER_ADMIN')
  assert.match(src, /roles\.includes\('SUPER_ADMIN'\)/, 'isAdmin = roles.includes(SUPER_ADMIN)')
})

test('P1: 云对象提供 myDuties（本人履职，前端 task 形状）', () => {
  assert.match(src, /async myDuties\(/)
  assert.match(src, /ownerUid: this\.auth\.uid/, '只查本人')
  assert.match(src, /title/, '返回字段含 title（对齐前端）')
  assert.match(src, /periodType/, '返回字段含 periodType')
})

test('P1: submitDuty 提交后进入 SUBMITTED 而非 DONE，RETURNED 可重提', () => {
  assert.match(src, /async submitDuty\(/)
  assert.match(src, /SUBMITTED/, '提交状态为 SUBMITTED')
  assert.match(src, /RETURNED/, '允许退回后重提')
  assert.match(src, /evidence/, '写 evidence 结构')
  assert.match(src, /INVALID_TRANSITION/, '非 PENDING/RETURNED 状态拒绝提交（含已闭环）')
})

test('P1: reviewDuty 审核 APPROVE/RETURN，仅 SUPER_ADMIN', () => {
  assert.match(src, /async reviewDuty\(/)
  assert.match(src, /APPROVE/, '支持通过')
  assert.match(src, /RETURN/, '支持退回')
  assert.match(src, /SUBMITTED/, '仅已提交可审核')
  assert.match(src, /review/, '写 review 结构')
})

test('P1: dutyDashboard 公司/部门聚合（复刻前端 createDutyDashboard）', () => {
  assert.match(src, /async dutyDashboard\(/)
  assert.match(src, /company/, '公司聚合')
  assert.match(src, /departments/, '部门聚合')
  assert.match(src, /reviewItems/, '待审核列表')
  assert.match(src, /assessmentItems/, '考核清单')
})

test('P1: dutyPeople 人员明细（部门/状态/关键字筛选）', () => {
  assert.match(src, /async dutyPeople\(/)
  assert.match(src, /department/, '部门筛选')
  assert.match(src, /dutyStatus/, '状态筛选')
  assert.match(src, /keyword/, '关键字筛选')
  assert.match(src, /displayName/, '人员字段')
})

test('P1: adminInstances 权限收紧为 SUPER_ADMIN', () => {
  assert.match(src, /async adminInstances\(/)
  assert.match(src, /requireAdmin\(this\)/, '保留管理员校验（模块级函数）')
})

test('P1: _timing 生成实例补 title/periodType/cycleKey（对齐前端 task）', () => {
  assert.match(src, /async _timing\(/)
  assert.match(src, /title:/, '生成实例含 title')
  assert.match(src, /periodType/, '生成实例含 periodType 字段')
  assert.match(src, /cycleKey/, '生成实例含 cycleKey 字段')
})

test('P1: instances schema 字段兼容前端 task（title/periodType/cycleKey/evidence/review）', () => {
  const schema = readCloudSchema('xr-duty-instances')
  const props = Object.keys(schema.properties || {})
  for (const field of ['title', 'periodType', 'cycleKey', 'evidence', 'review', 'submittedAt', 'ownerUid', 'status', 'dueDate']) {
    assert.ok(props.includes(field), `instances schema 缺少字段 ${field}`)
  }
  // status 枚举含前端 5 态
  const statusEnum = schema.properties.status?.enum || []
  const statusValues = statusEnum.map((item) => (typeof item === 'object' ? item.value : item))
  for (const s of ['PENDING', 'SUBMITTED', 'APPROVED', 'RETURNED', 'OVERDUE']) {
    assert.ok(statusValues.includes(s), `status 枚举缺少 ${s}`)
  }
})
