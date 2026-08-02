<template>
  <view class="page-shell">
    <view class="masthead">
      <view class="brand-lockup"><view class="brand-mark">安</view><view><view class="eyebrow">徐州中燃能源有限公司</view><view class="brand-name">徐燃安巡</view></view></view>
      <view class="role-chip">{{ issueStore.currentUser ? issueRoleText(issueStore.currentUser.role) : '加载中' }} · Mock</view>
    </view>
    <view class="hero"><view><view class="hero-kicker">今日需要处置</view><view class="hero-number">{{ pendingCount }}</view><view class="hero-copy">事项进入闭环后，不允许删除，只能留痕处理。</view></view><view class="hero-seal">SAFE<br>LOOP</view></view>
    <view class="metric-grid"><view class="metric-card danger"><text>{{ majorCount }}</text><span>重大隐患</span></view><view class="metric-card"><text>{{ reviewCount }}</text><span>待安监复核</span></view><view class="metric-card"><text>{{ closedCount }}</text><span>本期已闭环</span></view></view>
    <view class="section-title-row"><view><view class="section-title">闭环待办</view><view class="section-caption">按风险和整改期限排序</view></view><view class="count-label">{{ actionableIssues.length }} 项</view></view>
    <view v-if="issueStore.error" class="error-state"><text>{{ issueStore.error }}</text><button @click="load">重试</button></view>
    <view v-for="issue in actionableIssues" :key="issue.id" class="issue-card" :class="{ major: issue.isMajor }" @click="openIssue(issue.id)">
      <view class="card-topline"><view class="status" :class="statusClass(issue.status)">{{ issueStatusText(issue.status) }}</view><view v-if="issue.isMajor" class="major-tag">重大隐患</view><view class="issue-id">{{ issue.id }}</view></view>
      <view class="issue-title">{{ issue.title }}</view><view class="issue-meta"><text>{{ issue.assignee?.department || '等待安监交办' }}</text><text>{{ issue.deadline ? `限期 ${issue.deadline}` : '期限待设置' }}</text></view><view class="issue-location">{{ issue.location }}</view><view class="open-arrow">查看处置过程 →</view>
    </view>
    <view v-if="issueStore.loading && !actionableIssues.length" class="empty-state">正在加载隐患…</view>
    <view v-else-if="!issueStore.error && !actionableIssues.length" class="empty-state">当前角色没有待处置事项</view>
    <button v-if="issueStore.hasMore" class="load-more" :loading="issueStore.loading" @click="loadMore">加载更多</button>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import { issueRoleText, issueStatusText } from '../../services/issues/index.mjs'
import { issueStore } from '../../stores/issues'
const visibleIssues = computed(() => issueStore.items)
const actionableIssues = computed(() => visibleIssues.value.filter((item) => item.status !== 'CLOSED'))
const pendingCount = computed(() => actionableIssues.value.length)
const majorCount = computed(() => visibleIssues.value.filter((item) => item.isMajor && item.status !== 'CLOSED').length)
const reviewCount = computed(() => visibleIssues.value.filter((item) => item.status === 'RECTIFICATION_SUBMITTED').length)
const closedCount = computed(() => visibleIssues.value.filter((item) => item.status === 'CLOSED').length)
function statusClass(status) { return ({ REPORTED: 'reported', ASSIGNED: 'todo', RECTIFICATION_SUBMITTED: 'review', REJECTED: 'rejected', CLOSED: 'closed' })[status] }
function openIssue(id) { uni.navigateTo({ url: `/pages/issue/detail?id=${id}` }) }
async function load(){try{await issueStore.load()}catch{}finally{uni.stopPullDownRefresh()}}
async function loadMore(){if(issueStore.hasMore)await issueStore.load(issueStore.filters,{append:true})}
onShow(load)
onPullDownRefresh(load)
</script>

<style lang="scss" scoped>
.page-shell{padding:28rpx 28rpx 60rpx}.masthead{display:flex;align-items:center;justify-content:space-between;margin:18rpx 0 30rpx}.brand-lockup{display:flex;gap:16rpx;align-items:center}.brand-mark{width:66rpx;height:66rpx;border-radius:18rpx 18rpx 18rpx 4rpx;background:#006e55;color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:34rpx;box-shadow:0 10rpx 22rpx rgba(0,110,85,.2)}.eyebrow{font-size:19rpx;letter-spacing:2rpx;color:#6a756f}.brand-name{font-size:38rpx;line-height:44rpx;font-weight:700;letter-spacing:2rpx}.role-chip,.major-tag{border-radius:999px;padding:10rpx 18rpx;background:#e7f1ed;color:#006e55;font-size:22rpx}.hero{color:#fff;padding:42rpx 36rpx;border-radius:28rpx;display:flex;align-items:flex-end;justify-content:space-between;background:linear-gradient(135deg,#003d31,#007d61);box-shadow:0 22rpx 42rpx rgba(0,79,61,.19)}.hero-kicker{font-size:24rpx;opacity:.82}.hero-number{font-size:104rpx;font-weight:760;line-height:1;letter-spacing:-5rpx;margin:7rpx 0}.hero-copy{font-size:22rpx;opacity:.7;max-width:420rpx;line-height:1.5}.hero-seal{font-size:19rpx;line-height:1.35;letter-spacing:2rpx;padding:22rpx 12rpx;border:1rpx solid rgba(255,255,255,.38);border-radius:50%;text-align:center;transform:rotate(-10deg)}.metric-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16rpx;margin:22rpx 0 44rpx}.metric-card{background:#fff;border:1rpx solid #e2e9e6;border-radius:20rpx;padding:22rpx 18rpx}.metric-card text{display:block;font-size:47rpx;line-height:1;font-weight:700;color:#17201d}.metric-card span{font-size:21rpx;color:#728078;display:block;margin-top:10rpx}.metric-card.danger text{color:#d83a2e}.section-title-row{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:18rpx}.section-title{font-size:34rpx;font-weight:700}.section-caption,.count-label{font-size:22rpx;color:#748079;margin-top:4rpx}.issue-card{position:relative;background:#fff;padding:26rpx;border:1rpx solid #e0e7e3;border-radius:22rpx;margin-bottom:18rpx;overflow:hidden}.issue-card.major::before{content:'';position:absolute;inset:0 auto 0 0;width:8rpx;background:#d83a2e}.card-topline,.issue-meta{display:flex;align-items:center;gap:12rpx}.issue-id{margin-left:auto;color:#96a29b;font-size:20rpx}.status{font-size:21rpx;padding:6rpx 12rpx;border-radius:8rpx}.reported{background:#f1edff;color:#6550a4}.todo{background:#fff2e9;color:#a65400}.review{background:#e8f0ff;color:#245eb4}.rejected{background:#fff0ee;color:#c93228}.closed{background:#e9f5ed;color:#267444}.major-tag{background:#fff0ee;color:#c93228;padding:6rpx 12rpx;font-size:20rpx}.issue-title{font-size:30rpx;font-weight:650;margin:20rpx 0 16rpx}.issue-meta{color:#52625a;font-size:22rpx;justify-content:space-between}.issue-location{font-size:22rpx;color:#87938d;margin-top:12rpx}.open-arrow{color:#006e55;font-size:22rpx;margin-top:22rpx}.empty-state,.error-state{text-align:center;padding:80rpx 24rpx;color:#88948d}.error-state button,.load-more{margin-top:20rpx;background:#e7f2ed;color:#006e55;font-size:24rpx}.load-more{margin-bottom:28rpx}
</style>
