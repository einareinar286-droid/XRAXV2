import { reactive } from 'vue'
import { getCurrentUser, listIssues } from '../services/issues/index.mjs'

export const issueStore = reactive({
  currentUser: null,
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
  hasMore: false,
  loading: false,
  error: '',
  filters: {},

  async load(filters = this.filters, { append = false } = {}) {
    if (this.loading) return
    this.loading = true
    this.error = ''
    try {
      this.currentUser = await getCurrentUser()
      this.filters = { ...filters }
      const page = append ? this.page + 1 : 1
      const result = await listIssues({ ...this.filters, page, pageSize: this.pageSize })
      this.items = append ? [...this.items, ...result.items] : result.items
      this.total = result.total
      this.page = result.page
      this.hasMore = result.hasMore
    } catch (error) {
      this.error = error.message || '隐患加载失败'
      throw error
    } finally {
      this.loading = false
    }
  }
})
