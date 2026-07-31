import { reactive } from 'vue'

const now = new Date()
const day = (offset) => new Date(now.getTime() + offset * 86400000).toISOString().slice(0, 10)

const users = {
  admin: { name: '安监管理员', department: '安全监察部', roleName: '管理员' },
  safety: { name: '安监专员', department: '安全监察部', roleName: '安监管理员' },
  marketing: { name: '市场整改员', department: '市场营销部', roleName: '市场整改人员' },
  employee: { name: '普通员工', department: '生产运营部', roleName: '普通员工' },
  executive: { name: '管理层查看', department: '综合管理部', roleName: '高管只读' }
}

const seedIssues = [
  { id: 'XR-20260731-001', title: '餐饮用户使用可调节减压阀', category: '用户用气安全', major: true, public: true, location: '云龙区和平路餐饮街 18 号', reporter: '安监专员', reporterDept: '安全监察部', assignee: '市场整改员', assigneeDept: '市场营销部', deadline: day(7), status: '待整改', description: '现场发现商业用户使用可调节减压阀，已要求停止供气并书面告知整改。', attachments: [], rectification: null, reviewNote: '', createdAt: `${day(0)} 09:20`, audit: [{ action: '隐患上报', actor: '安监专员', time: `${day(0)} 09:20`, note: '形成隐患记录' }, { action: '交办市场营销部', actor: '安监管理员', time: `${day(0)} 09:35`, note: '限期整改' }] },
  { id: 'XR-20260730-014', title: '配送车未按规定固定气瓶', category: '配送作业', major: false, public: true, location: '铜山区大学路配送线路', reporter: '普通员工', reporterDept: '生产运营部', assignee: '市场整改员', assigneeDept: '市场营销部', deadline: day(2), status: '待复核', description: '现场抽查发现配送车气瓶固定措施不规范。', attachments: [], rectification: { note: '已补配固定带并完成全车检查。', attachments: [], submittedAt: `${day(-1)} 16:10` }, reviewNote: '', createdAt: `${day(-1)} 11:30`, audit: [{ action: '隐患上报', actor: '普通员工', time: `${day(-1)} 11:30`, note: '形成隐患记录' }, { action: '整改提交', actor: '市场整改员', time: `${day(-1)} 16:10`, note: '等待安监复核' }] },
  { id: 'XR-20260729-008', title: '居民用户软管老化', category: '用户用气安全', major: false, public: true, location: '鼓楼区王场新村 12 栋', reporter: '安监专员', reporterDept: '安全监察部', assignee: '市场整改员', assigneeDept: '市场营销部', deadline: day(-1), status: '已逾期', description: '连接软管超过使用期限，需更换后复核。', attachments: [], rectification: null, reviewNote: '', createdAt: `${day(-2)} 14:10`, audit: [{ action: '隐患上报', actor: '安监专员', time: `${day(-2)} 14:10`, note: '限期整改' }] }
]

export const roleNames = Object.fromEntries(Object.entries(users).map(([key, value]) => [key, value.roleName]))

export const demoStore = reactive({
  role: uni.getStorageSync('xr-demo-role') || 'admin',
  loggedIn: uni.getStorageSync('xr-demo-logged-in') !== false,
  issues: seedIssues,
  messages: [
    { id: 'm-1', type: 'urgent', title: '重大隐患待整改', copy: '餐饮用户使用可调节减压阀，请市场营销部在规定期限内完成整改。', issueId: 'XR-20260731-001', read: false, time: '刚刚' },
    { id: 'm-2', type: 'review', title: '整改待安监复核', copy: '配送车气瓶固定措施整改材料已提交。', issueId: 'XR-20260730-014', read: false, time: '今天 16:10' },
    { id: 'm-3', type: 'overdue', title: '整改已逾期', copy: '居民用户软管老化已超过整改期限。', issueId: 'XR-20260729-008', read: true, time: '昨天' }
  ],
  get user() { return users[this.role] || users.employee },
  setRole(role) { this.role = role; this.loggedIn = true; uni.setStorageSync('xr-demo-role', role); uni.setStorageSync('xr-demo-logged-in', true) },
  logout() { this.loggedIn = false; uni.setStorageSync('xr-demo-logged-in', false) },
  can(action, issue) {
    if (action === 'issue-create') return ['admin', 'safety', 'employee'].includes(this.role)
    if (action === 'issue-list') return ['admin', 'safety', 'marketing'].includes(this.role)
    if (action === 'issue-assign') return ['admin', 'safety'].includes(this.role)
    if (action === 'issue-rectify') return this.role === 'marketing' && issue?.assigneeDept === '市场营销部' && ['待整改', '已逾期'].includes(issue.status)
    if (action === 'issue-review') return ['admin', 'safety'].includes(this.role) && issue?.status === '待复核'
    if (action === 'admin') return ['admin', 'safety'].includes(this.role)
    if (action === 'admin-only') return this.role === 'admin'
    if (action === 'duty-overview') return ['admin', 'safety', 'executive'].includes(this.role)
    return false
  },
  visibleIssues({ includeClosed = false } = {}) {
    let items = this.issues.filter((issue) => includeClosed || issue.status !== '已闭环')
    if (this.role === 'marketing') items = items.filter((issue) => issue.assigneeDept === '市场营销部')
    if (this.role === 'employee') items = items.filter((issue) => issue.public)
    if (this.role === 'executive') items = items.filter((issue) => issue.major || issue.status !== '已闭环')
    return [...items].sort((a, b) => Number(b.major) - Number(a.major) || a.deadline.localeCompare(b.deadline))
  },
  addIssue(payload) {
    const id = `XR-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${String(this.issues.length + 1).padStart(3, '0')}`
    const canAssign = this.can('issue-assign')
    const status = canAssign ? '待整改' : '待交办'
    const issue = { id, status, public: true, reporter: this.user.name, reporterDept: this.user.department, assignee: canAssign ? '市场整改员' : '', assigneeDept: canAssign ? '市场营销部' : '', rectification: null, reviewNote: '', createdAt: '刚刚', audit: [{ action: '隐患上报', actor: this.user.name, time: '刚刚', note: '形成不可删除记录' }], ...payload }
    this.issues.unshift(issue)
    this.pushMessage({ type: payload.major ? 'urgent' : 'normal', title: payload.major ? '新增重大隐患' : '新增隐患待交办', copy: payload.title, issueId: id })
    return id
  },
  assignIssue(id, payload) { const issue = this.issues.find((item) => item.id === id); if (!issue) return; Object.assign(issue, payload, { status: '待整改' }); issue.audit.push({ action: '交办市场营销部', actor: this.user.name, time: '刚刚', note: `限期 ${payload.deadline} 整改` }); this.pushMessage({ type: 'normal', title: '收到隐患交办单', copy: issue.title, issueId: id }) },
  submitRectification(id, rectification) { const issue = this.issues.find((item) => item.id === id); if (!issue) return; issue.rectification = { ...rectification, submittedAt: '刚刚' }; issue.status = '待复核'; issue.audit.push({ action: '整改提交', actor: this.user.name, time: '刚刚', note: rectification.note }); this.pushMessage({ type: 'review', title: '整改待安监复核', copy: issue.title, issueId: id }) },
  returnIssue(id, note) { const issue = this.issues.find((item) => item.id === id); if (!issue) return; issue.status = '待整改'; issue.reviewNote = note; issue.audit.push({ action: '安监退回整改', actor: this.user.name, time: '刚刚', note }); this.pushMessage({ type: 'urgent', title: '整改已退回', copy: note, issueId: id }) },
  closeIssue(id, note = '整改符合要求，确认闭环。') { const issue = this.issues.find((item) => item.id === id); if (!issue) return; issue.status = '已闭环'; issue.reviewNote = note; issue.audit.push({ action: '安监复核闭环', actor: this.user.name, time: '刚刚', note }); this.pushMessage({ type: 'closed', title: '隐患已闭环', copy: issue.title, issueId: id }) },
  pushMessage(message) { this.messages.unshift({ id: `m-${Date.now()}`, read: false, time: '刚刚', ...message }) },
  markRead(id) { const message = this.messages.find((item) => item.id === id); if (message) message.read = true }
})

export const allRoles = Object.entries(users).map(([id, item]) => ({ id, ...item }))
