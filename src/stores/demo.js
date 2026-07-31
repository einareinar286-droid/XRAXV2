import { reactive } from 'vue'

const seedIssues = [
  {
    id: 'XR-20260731-001',
    title: '餐饮用户使用可调节减压阀',
    category: '用户用气安全',
    major: true,
    location: '云龙区和平路餐饮街 18 号',
    reporter: '安全监察部 · 巡检员 A',
    assignee: '市场营销部 · 演示负责人',
    deadline: '2026-08-07',
    status: '待整改',
    description: '现场发现商业用户使用可调节减压阀，已要求停止供气并书面告知整改。',
    attachments: [],
    rectification: null,
    createdAt: '2026-07-31 09:20'
  },
  {
    id: 'XR-20260730-014',
    title: '配送车未按规定固定气瓶',
    category: '配送作业',
    major: false,
    location: '铜山区大学路配送线路',
    reporter: '王旭',
    assignee: '市场营销部 · 演示负责人',
    deadline: '2026-08-02',
    status: '待复核',
    description: '现场抽查发现配送车气瓶固定措施不规范。',
    attachments: [],
    rectification: { note: '已补配固定带并完成全车检查。', attachments: [], submittedAt: '2026-07-30 16:10' },
    createdAt: '2026-07-30 11:30'
  }
]

export const demoStore = reactive({
  role: uni.getStorageSync('xr-demo-role') || 'safety',
  issues: seedIssues,
  setRole(role) {
    this.role = role
    uni.setStorageSync('xr-demo-role', role)
  },
  addIssue(payload) {
    const id = `XR-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${String(this.issues.length + 1).padStart(3, '0')}`
    this.issues.unshift({ id, status: '待整改', rectification: null, createdAt: '刚刚', ...payload })
    return id
  },
  submitRectification(id, rectification) {
    const issue = this.issues.find((item) => item.id === id)
    if (!issue) return
    issue.rectification = { ...rectification, submittedAt: '刚刚' }
    issue.status = '待复核'
  },
  closeIssue(id) {
    const issue = this.issues.find((item) => item.id === id)
    if (issue) issue.status = '已闭环'
  }
})

export const roleNames = {
  safety: '安全监察部',
  marketing: '市场营销部',
  executive: '高管查看'
}
