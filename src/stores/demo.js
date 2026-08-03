import { reactive } from 'vue'
import { setMockRole } from '../services/issues/index.mjs'

export const demoStore = reactive({
  role: 'safety',
  issues: [],
  setRole(role) {
    const mapped = ({ admin: 'SUPER_ADMIN', safety: 'SAFETY_OFFICER', marketing: 'MARKETING_OFFICER', employee: 'EMPLOYEE' })[role]
    if (!mapped) return
    this.role = role
    setMockRole(mapped)
  }
})

export const roleNames = {
  safety: '安全监察部',
  marketing: '市场营销部',
  executive: '高管查看'
}
