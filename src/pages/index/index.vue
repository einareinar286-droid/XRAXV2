<template>
  <view class="page-shell">
    <view class="masthead">
      <view class="brand-lockup"><view class="brand-mark"><view class="brand-mark-core" /></view><view><text class="brand-name">徐燃安巡</text><text class="brand-subtitle">LPG 安全隐患闭环</text></view></view>
      <text class="role-chip">{{ issueStore.currentUser ? issueRoleText(issueStore.currentUser.role) : '加载身份中' }} · Mock</text>
    </view>

    <view class="work-overview">
      <view><text class="overview-title">待办工作台</text><text class="overview-copy">按风险、时限和当前责任环节排序，优先处理需要你推进的事项。</text></view>
      <view class="overview-count"><text>{{ pendingCount }}</text><text>项待推进</text></view>
    </view>

    <view class="status-ledger">
      <view class="ledger-item"><text class="ledger-label">重大隐患</text><text class="ledger-value danger">{{ majorCount }}</text></view>
      <view class="ledger-item"><text class="ledger-label">待安监复核</text><text class="ledger-value">{{ reviewCount }}</text></view>
      <view class="ledger-item"><text class="ledger-label">本期闭环</text><text class="ledger-value">{{ closedCount }}</text></view>
    </view>

    <view class="section-title-row"><view><text class="section-title">闭环待办</text><text class="section-caption">当前步骤与下一责任方一目了然</text></view><text class="count-label">{{ actionableIssues.length }} 项</text></view>
    <view v-if="issueStore.error" class="message-state error-state"><text>{{ issueStore.error }}</text><button @click="load">重新加载</button></view>

    <view v-for="issue in actionableIssues" :key="issue.id" class="issue-card" :class="{ major: issue.isMajor }" @click="openIssue(issue.id)">
      <view class="card-topline"><view class="status" :class="statusClass(issue.status)">{{ issueStatusText(issue.status) }}</view><view v-if="issue.isMajor" class="major-tag">重大隐患</view><text class="issue-id">{{ issue.id }}</text></view>
      <text class="issue-title">{{ issue.title }}</text>
      <view class="stage-row"><view class="stage-track"><view class="stage-dot" :class="statusClass(issue.status)" /><text>当前：{{ stageSummary(issue.status).currentLabel }}</text></view><text class="stage-next">下一步：{{ stageSummary(issue.status).nextLabel }}</text></view>
      <view class="issue-meta"><text>{{ issue.assignee?.department || '等待安全监察交办' }}</text><text>{{ issue.deadline ? `限期 ${issue.deadline}` : '期限待设置' }}</text></view>
      <text class="issue-location">{{ issue.location }}</text>
      <view class="card-link"><text>查看处置过程</text><view class="card-link-mark" /></view>
    </view>

    <view v-if="issueStore.loading && !actionableIssues.length" class="message-state">正在加载隐患…</view>
    <view v-else-if="!issueStore.error && !actionableIssues.length" class="message-state"><text>当前角色没有待处置事项</text><text class="message-copy">需要上报新隐患时，可前往“随手拍”。</text></view>
    <button v-if="issueStore.hasMore" class="load-more" :loading="issueStore.loading" @click="loadMore">加载更多</button>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import { issueRoleText, issueStatusText } from '../../services/issues/index.mjs'
import { getIssueStageSummary } from '../../domain/issues/presentation.mjs'
import { issueStore } from '../../stores/issues'

const visibleIssues = computed(() => issueStore.items)
const actionableIssues = computed(() => visibleIssues.value.filter((item) => item.status !== 'CLOSED'))
const pendingCount = computed(() => actionableIssues.value.length)
const majorCount = computed(() => visibleIssues.value.filter((item) => item.isMajor && item.status !== 'CLOSED').length)
const reviewCount = computed(() => visibleIssues.value.filter((item) => item.status === 'RECTIFICATION_SUBMITTED').length)
const closedCount = computed(() => visibleIssues.value.filter((item) => item.status === 'CLOSED').length)
function statusClass(status) { return ({ REPORTED: 'reported', ASSIGNED: 'todo', RECTIFICATION_SUBMITTED: 'review', REJECTED: 'rejected', CLOSED: 'closed' })[status] }
function stageSummary(status) { return getIssueStageSummary(status) }
function openIssue(id) { uni.navigateTo({ url: `/pages/issue/detail?id=${id}` }) }
async function load(){try{await issueStore.load()}catch{}finally{uni.stopPullDownRefresh()}}
async function loadMore(){if(issueStore.hasMore)await issueStore.load(issueStore.filters,{append:true})}
onShow(load)
onPullDownRefresh(load)
</script>

<style lang="scss" scoped>
.page-shell{min-height:100vh;padding:28rpx 28rpx 64rpx;background:$xr-canvas}.masthead{display:flex;align-items:center;justify-content:space-between;gap:18rpx;margin:12rpx 0 30rpx}.brand-lockup{display:flex;align-items:center;gap:14rpx}.brand-mark{width:64rpx;height:64rpx;border-radius:18rpx 18rpx 18rpx 6rpx;background:$xr-green;display:flex;align-items:center;justify-content:center;box-shadow:0 12rpx 26rpx rgba(0,110,85,.18)}.brand-mark-core{width:26rpx;height:26rpx;border:4rpx solid #fff;border-radius:50%;position:relative}.brand-mark-core::after{content:'';position:absolute;right:-7rpx;top:1rpx;width:8rpx;height:8rpx;border-radius:50%;background:#fff}.brand-name,.brand-subtitle{display:block}.brand-name{font-size:36rpx;line-height:1.2;font-weight:760;color:$xr-text}.brand-subtitle{margin-top:4rpx;font-size:20rpx;color:$xr-muted}.role-chip{max-width:220rpx;padding:9rpx 13rpx;border-radius:12rpx;background:#e5f1eb;color:$xr-green;font-size:20rpx;line-height:1.35;text-align:right}.work-overview{display:flex;align-items:flex-end;justify-content:space-between;gap:28rpx;padding:30rpx 28rpx;border-radius:24rpx;background:$xr-surface;border:1rpx solid $xr-line}.overview-title{display:block;font-size:34rpx;font-weight:750;color:$xr-text}.overview-copy{display:block;max-width:460rpx;margin-top:8rpx;font-size:22rpx;line-height:1.6;color:$xr-muted}.overview-count{flex:0 0 auto;text-align:right}.overview-count text{display:block}.overview-count text:first-child{font-size:58rpx;line-height:1;font-weight:760;color:$xr-green}.overview-count text:last-child{margin-top:6rpx;font-size:20rpx;color:$xr-muted}.status-ledger{display:flex;margin:18rpx 0 44rpx;padding:4rpx 0;border-top:1rpx solid $xr-line;border-bottom:1rpx solid $xr-line}.ledger-item{flex:1;min-width:0;padding:18rpx 16rpx;border-right:1rpx solid $xr-line}.ledger-item:last-child{border-right:0}.ledger-label,.ledger-value{display:block}.ledger-label{font-size:20rpx;color:$xr-muted}.ledger-value{margin-top:7rpx;font-size:34rpx;line-height:1;font-weight:760;color:$xr-text}.ledger-value.danger{color:$xr-red}.section-title-row{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:18rpx}.section-title,.section-caption{display:block}.section-title{font-size:32rpx;font-weight:750;color:$xr-text}.section-caption,.count-label{margin-top:4rpx;font-size:21rpx;color:$xr-muted}.issue-card{position:relative;padding:26rpx;margin-bottom:18rpx;border:1rpx solid $xr-line;border-radius:22rpx;background:$xr-surface;overflow:hidden}.issue-card.major{border-color:#eab9b3}.card-topline{display:flex;align-items:center;gap:12rpx}.status,.major-tag{padding:6rpx 11rpx;border-radius:8rpx;font-size:20rpx}.reported{background:#f1edff;color:#6550a4}.todo{background:#fff2e9;color:#a65400}.review{background:#e8f0ff;color:#245eb4}.rejected{background:#fff0ee;color:#c93228}.closed{background:#e9f5ed;color:#267444}.major-tag{background:#fff0ee;color:$xr-red;font-weight:700}.issue-id{margin-left:auto;font-size:19rpx;color:$xr-muted}.issue-title{display:block;margin:18rpx 0;font-size:29rpx;line-height:1.45;font-weight:700;color:$xr-text}.stage-row{display:flex;align-items:center;justify-content:space-between;gap:16rpx;padding:14rpx 16rpx;border-radius:14rpx;background:#f1f6f3;font-size:21rpx;color:$xr-text}.stage-track{display:flex;align-items:center;gap:9rpx;min-width:0}.stage-dot{width:14rpx;height:14rpx;border-radius:50%;background:$xr-green;flex:0 0 auto}.stage-dot.todo{background:$xr-amber}.stage-dot.review{background:#245eb4}.stage-dot.rejected{background:$xr-red}.stage-next{color:$xr-green;text-align:right}.issue-meta{display:flex;justify-content:space-between;gap:16rpx;margin-top:16rpx;font-size:21rpx;color:#52625a}.issue-location{display:block;margin-top:9rpx;font-size:21rpx;color:$xr-muted}.card-link{display:flex;align-items:center;justify-content:space-between;margin-top:20rpx;color:$xr-green;font-size:22rpx}.card-link-mark{width:14rpx;height:14rpx;border-top:2rpx solid currentColor;border-right:2rpx solid currentColor;transform:rotate(45deg);margin-right:4rpx}.message-state{display:flex;flex-direction:column;align-items:center;gap:10rpx;padding:68rpx 24rpx;text-align:center;color:$xr-muted;background:$xr-surface;border:1rpx dashed $xr-line-strong;border-radius:22rpx;font-size:23rpx}.message-copy{font-size:20rpx}.error-state{color:#a7372f;background:#fff7f6;border-color:#edc2be}.error-state button,.load-more{margin-top:14rpx;background:#e7f2ed;color:$xr-green;font-size:23rpx}.load-more{margin-bottom:28rpx}@media (min-width:1200px){.page-shell{max-width:1200px;margin:0 auto;padding:34px 30px 64px}.masthead{margin-top:0}.brand-mark{width:46px;height:46px}.brand-mark-core{width:18px;height:18px;border-width:3px}.brand-name{font-size:25px}.brand-subtitle{font-size:12px}.role-chip{font-size:12px;max-width:none}.work-overview{padding:28px 30px}.overview-title{font-size:28px}.overview-copy{font-size:14px}.overview-count text:first-child{font-size:52px}.overview-count text:last-child,.ledger-label,.section-caption,.count-label{font-size:12px}.status-ledger{margin-bottom:38px}.ledger-item{padding:18px}.ledger-value{font-size:28px}.section-title{font-size:24px}.issue-card{padding:22px}.status,.major-tag{font-size:12px}.issue-id{font-size:12px}.issue-title{font-size:19px}.stage-row,.issue-meta,.issue-location,.card-link{font-size:13px}.message-state{font-size:14px}}
</style>
