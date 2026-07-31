import { reactive } from 'vue'

const now = new Date()
const date = (offset = 0) => new Date(now.getTime() + offset * 86400000).toISOString().slice(0, 10)
const demoTasks = reactive([
  { id: 'duty-demo-001', actionName: '每周安全检查', category: '安全检查', frequency: 'weekly', periodStart: date(-3), periodEnd: date(3), dueDate: date(3), status: 'PENDING', ownerName: '演示员工', department: '安全监察部', description: '', files: [] },
  { id: 'duty-demo-002', actionName: '每月参加安全活动', category: '安全活动', frequency: 'monthly', periodStart: date(-12), periodEnd: date(18), dueDate: date(18), status: 'PENDING', ownerName: '演示员工', department: '安全监察部', description: '', files: [] },
  { id: 'duty-demo-003', actionName: '每月线下抽查不低于20户', category: '线下抽查', frequency: 'monthly', periodStart: date(-12), periodEnd: date(18), dueDate: date(-1), status: 'OVERDUE', ownerName: '演示员工', department: '安全监察部', description: '', files: [] },
  { id: 'duty-demo-004', actionName: '每季度安全宣讲', category: '安全宣教', frequency: 'quarterly', periodStart: date(-30), periodEnd: date(60), dueDate: date(60), status: 'DONE', ownerName: '演示员工', department: '安全监察部', description: '已完成班组安全宣讲并留存记录。', files: [] }
])

function cloudObject() {
  return typeof uniCloud !== 'undefined' ? uniCloud.importObject('duty-service') : null
}

function normalizeTask(item) {
  return { ...item, id: item.id || item._id }
}

export async function listMyDuties(filters = {}) {
  const service = cloudObject()
  if (service) return (await service.myInstances(filters)).map(normalizeTask)
  return demoTasks.filter((item) => (!filters.status || item.status === filters.status) && (!filters.category || item.category === filters.category))
}

export async function listAllDuties(filters = {}) {
  const service = cloudObject()
  if (service) {
    const result = await service.adminInstances(filters)
    return { ...result, data: result.data.map(normalizeTask) }
  }
  const data = demoTasks.filter((item) => (!filters.status || item.status === filters.status) && (!filters.category || item.category === filters.category) && (!filters.department || item.department === filters.department))
  return { data, total: data.length, page: 1, pageSize: data.length }
}

export async function submitDuty(instanceId, payload) {
  const service = cloudObject()
  if (service) return service.submitInstance({ instanceId, ...payload })
  const record = demoTasks.find((item) => item.id === instanceId)
  if (!record) throw new Error('履职任务不存在')
  record.status = 'DONE'
  record.description = payload.description
  record.files = payload.files
  record.completedAt = new Date().toLocaleString('zh-CN', { hour12: false })
  return record
}

export function dutyStatusText(status) {
  return ({ PENDING: '待填写', OVERDUE: '已逾期', DONE: '已完成' })[status] || status
}
