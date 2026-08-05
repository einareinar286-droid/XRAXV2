<template>
  <view>
    <AdaptiveNavigation active="MY_RECTIFY" />
    <view class="page">
      <view class="heading">
        <text class="title">待整改隐患</text>
        <text class="copy">安监部交办给我部门的隐患清单，整改后提交图文佐证，经安监部复核后闭环。</text>
      </view>

      <view class="tabs">
        <view class="tab" :class="{ active: activeTab === 'PENDING' }" @click="switchTab('PENDING')">
          待整改 <text class="tab-count">{{ pendingCount }}</text>
        </view>
        <view class="tab" :class="{ active: activeTab === 'ALL' }" @click="switchTab('ALL')">
          全部交办 <text class="tab-count">{{ totalCount }}</text>
        </view>
      </view>

      <view v-if="loading" class="state">正在加载交办单…</view>
      <view v-else-if="error" class="state error"><text>{{ error }}</text><button @click="load">重新加载</button></view>

      <template v-else>
        <view v-if="items.length" class="list">
          <view v-for="issue in items" :key="issue.id" class="card glass-panel" @click="openIssue(issue.id)">
            <view class="card-top">
              <text class="status-tag" :class="statusClass(issue.status)">{{ issueStatusText(issue.status) }}</text>
              <text v-if="issue.isMajor" class="major-tag">重大隐患</text>
              <text class="issue-id">{{ issue.id }}</text>
            </view>
            <text class="card-title">{{ issue.title }}</text>
            <view class="card-meta">
              <text>交办：{{ issue.assignee?.department }}</text>
              <text>限期：{{ issue.deadline || '未设置' }}</text>
            </view>
            <view v-if="issue.status === 'REJECTED' && issue.rectification" class="reject-note">退回原因：{{ issue.rectification.note }}</view>
            <view class="card-action">{{ issue.status === 'ASSIGNED' ? '去整改 →' : '重新整改 →' }}</view>
          </view>
        </view>
        <view v-else class="state">当前没有待整改的隐患交办单</view>
      </template>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getCurrentUser, issueStatusText, listIssues } from '../../services/issues/index.mjs'
import AdaptiveNavigation from '../../components/navigation/AdaptiveNavigation.vue'

const loading = ref(true)
const error = ref('')
const activeTab = ref('PENDING')
const allItems = ref([])

const pendingItems = computed(() => allItems.value.filter((item) => ['ASSIGNED', 'REJECTED'].includes(item.status)))
const items = computed(() => (activeTab.value === 'PENDING' ? pendingItems.value : allItems.value))
const pendingCount = computed(() => pendingItems.value.length)
const totalCount = computed(() => allItems.value.length)

function statusClass(status) {
  return ({ ASSIGNED: 'assigned', REJECTED: 'rejected', RECTIFICATION_SUBMITTED: 'submitted', CLOSED: 'closed' })[status] || ''
}

function switchTab(tab) {
  activeTab.value = tab
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const user = await getCurrentUser()
    if (!['MARKETING_OFFICER', 'SUPER_ADMIN'].includes(user.role)) {
      throw new Error('当前角色不能查看整改交办单')
    }
    // 全部交办（状态过滤由服务层 canReadIssue 保证只看本部门）
    const result = await listIssues({ page: 1, pageSize: 100 })
    allItems.value = result.items
  } catch (err) {
    allItems.value = []
    error.value = err.message || '交办单加载失败'
  } finally {
    loading.value = false
  }
}

function openIssue(id) {
  uni.navigateTo({ url: `/pages/issue/detail?id=${id}` })
}

onShow(load)
</script>

<style lang="scss" scoped>
.page{min-height:100vh;padding:30rpx 28rpx 64rpx;background:transparent}
.heading{margin:14rpx 0 24rpx}
.title{display:block;font-size:42rpx;font-weight:760;color:$xr-text}
.copy{display:block;margin-top:8rpx;font-size:22rpx;line-height:1.6;color:$xr-muted}
.tabs{display:flex;gap:12rpx;margin-bottom:20rpx}
.tab{display:flex;align-items:center;gap:8rpx;padding:12rpx 22rpx;border-radius:999rpx;border:1rpx solid $xr-line;background:rgba(255,255,255,.04);color:$xr-muted;font-size:23rpx}
.tab.active{border-color:rgba(0,244,254,.6);background:rgba(0,244,254,.12);color:$xr-green-bright;font-weight:700}
.tab-count{font-size:19rpx;opacity:.8}
.list{display:flex;flex-direction:column;gap:16rpx}
.card{padding:24rpx;border-radius:22rpx}
.card-top{display:flex;align-items:center;gap:10rpx}
.status-tag,.major-tag{padding:5rpx 10rpx;border-radius:8rpx;font-size:19rpx}
.status-tag.assigned{background:rgba(255,210,138,.12);color:$xr-amber;border:1rpx solid rgba(255,210,138,.35)}
.status-tag.rejected{background:rgba(255,180,171,.14);color:$xr-red;border:1rpx solid rgba(255,180,171,.4)}
.status-tag.submitted{background:rgba(99,247,255,.12);color:$xr-green-bright;border:1rpx solid rgba(99,247,255,.35)}
.status-tag.closed{background:rgba(168,240,154,.12);color:$xr-lime;border:1rpx solid rgba(168,240,154,.35)}
.major-tag{background:rgba(255,180,171,.14);color:$xr-red;font-weight:700}
.issue-id{margin-left:auto;font-size:18rpx;color:$xr-muted}
.card-title{display:block;margin:16rpx 0 10rpx;font-size:28rpx;font-weight:700;line-height:1.45;color:$xr-text}
.card-meta{display:flex;justify-content:space-between;gap:12rpx;font-size:20rpx;color:$xr-muted}
.reject-note{margin-top:12rpx;padding:12rpx 14rpx;border-radius:10rpx;background:rgba(255,180,171,.1);color:$xr-red;font-size:20rpx;line-height:1.5}
.card-action{margin-top:16rpx;text-align:right;font-size:23rpx;font-weight:700;color:$xr-green-bright}
.state{padding:80rpx 24rpx;text-align:center;color:$xr-muted;font-size:22rpx}
.state.error{color:$xr-red}
.state button{margin-top:16rpx;background:rgba(99,247,255,.12);color:$xr-green-bright;font-size:23rpx;border:1rpx solid rgba(99,247,255,.35)}
</style>
