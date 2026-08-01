<template>
  <AppFrame active="home">
    <view class="xr-content dashboard">
      <view class="page-heading">
        <view><view class="xr-page-title">安全工作台</view><view class="xr-page-copy">实时查看重点隐患、整改进度和待复核事项。</view></view>
        <view class="period-select">近 30 天 ▾</view>
      </view>

      <view class="metric-grid">
        <view class="xr-card metric-card"><view class="metric-icon blue">▣</view><view class="metric-label">待处理</view><view class="metric-value">{{ pendingCount }}</view><view class="metric-trend">当前事项</view></view>
        <view class="xr-card metric-card danger"><view class="metric-icon red">△</view><view class="metric-label">重大隐患</view><view class="metric-value">{{ majorCount }}</view><view class="metric-trend red-text">重点关注</view></view>
        <view class="xr-card metric-card"><view class="metric-icon orange">◷</view><view class="metric-label">已逾期</view><view class="metric-value">{{ overdueCount }}</view><view class="metric-trend">需及时跟进</view></view>
        <view class="xr-card metric-card"><view class="metric-icon green">✓</view><view class="metric-label">已闭环</view><view class="metric-value">{{ closedCount }}</view><view class="metric-trend green-text">本周期</view></view>
      </view>

      <view class="dashboard-grid">
        <view class="xr-card urgent-card">
          <view class="card-heading"><view><view class="xr-section-title">重点隐患</view><view class="xr-caption">按风险等级与整改期限排序</view></view><text class="view-all" @click="openOrders">查看全部</text></view>
          <view v-for="issue in urgentIssues" :key="issue.id" class="hazard-row" @click="openIssue(issue.id)">
            <view class="hazard-thumb" :class="{major:issue.major}">{{ issue.major ? '!' : '安' }}</view>
            <view class="hazard-body"><view class="hazard-title">{{ issue.title }}</view><view class="hazard-meta">{{ issue.location || '暂未标注位置' }} · 限期 {{ issue.deadline }}</view></view>
            <view class="hazard-actions"><view class="xr-status" :class="statusClass(issue.status)">{{ issue.major ? '重大' : issue.status }}</view><button class="row-action" @click.stop="handleIssue(issue)">{{ actionText(issue) }}</button></view>
          </view>
          <view v-if="!urgentIssues.length" class="xr-empty">当前没有待处理隐患</view>
        </view>

        <view class="side-stack">
          <view class="xr-card distribution-card"><view class="xr-section-title">隐患分布</view><view v-for="item in distribution" :key="item.name" class="distribution-item"><view class="distribution-meta"><text><i :class="item.class"></i>{{ item.name }}</text><text :class="item.textClass">{{ item.count }}</text></view><view class="distribution-track"><view :class="item.class" :style="{width:item.width}"></view></view></view><button class="report-button" @click="openOrders">查看整改清单</button></view>
          <view class="xr-card report-card"><view class="report-symbol">◎</view><view class="xr-section-title">发现新隐患？</view><view class="xr-caption">现场拍照、定位并立即形成上报记录。</view><button class="xr-btn xr-btn-primary report-action" @click="createIssue">立即上报</button></view>
        </view>
      </view>
    </view>
  </AppFrame>
</template>

<script setup>
import { computed } from 'vue'
import AppFrame from '../../components/AppFrame.vue'
import { demoStore } from '../../stores/demo'

const visibleIssues = computed(() => demoStore.visibleIssues())
const urgentIssues = computed(() => visibleIssues.value.slice(0, 4))
const pendingCount = computed(() => visibleIssues.value.filter((item) => !['已闭环'].includes(item.status)).length)
const majorCount = computed(() => demoStore.issues.filter((item) => item.major && item.status !== '已闭环').length)
const overdueCount = computed(() => demoStore.issues.filter((item) => item.status === '已逾期').length)
const closedCount = computed(() => demoStore.issues.filter((item) => item.status === '已闭环').length)
const distribution = computed(() => {
  const total = Math.max(demoStore.issues.length, 1)
  const items = [
    { name: '重大', count: majorCount.value, class: 'major-bar', textClass: 'danger-text' },
    { name: '一般', count: demoStore.issues.filter((item) => !item.major && item.status !== '已闭环').length, class: 'warning-bar', textClass: 'warning-text' },
    { name: '已闭环', count: closedCount.value, class: 'closed-bar', textClass: 'green-text' }
  ]
  return items.map((item) => ({ ...item, width: `${Math.max(8, Math.round(item.count / total * 100))}%` }))
})
function statusClass(status) { return ({ '待交办':'xr-status-muted', '待整改':'xr-status-warning', '待复核':'xr-status-review', '已逾期':'xr-status-major', '已闭环':'xr-status-closed' })[status] || 'xr-status-info' }
function actionText(issue) { if (demoStore.can('issue-review', issue)) return '复核'; if (demoStore.can('issue-assign', issue) && issue.status === '待交办') return '交办'; return '查看' }
function handleIssue(issue) { if (demoStore.can('issue-review', issue)) { uni.navigateTo({ url: `/pages/issue/review?id=${issue.id}` }); return }; if (demoStore.can('issue-assign', issue) && issue.status === '待交办') { uni.navigateTo({ url: `/pages/issue/assign?id=${issue.id}` }); return }; openIssue(issue.id) }
function openIssue(id) { uni.navigateTo({ url: `/pages/issue/detail?id=${id}` }) }
function openOrders() { uni.navigateTo({ url: '/pages/issue/list' }) }
function createIssue() { uni.switchTab({ url: '/pages/issue/create' }) }
</script>

<style lang="scss" scoped>
.page-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:20rpx; margin:6rpx 0 26rpx; }.period-select{padding:11rpx 15rpx;border:1rpx solid #e3e7ec;border-radius:8rpx;background:#fff;color:#5d6672;font-size:20rpx;white-space:nowrap}.metric-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14rpx}.metric-card{min-height:164rpx;padding:20rpx;position:relative;overflow:hidden}.metric-card.danger{border-color:#ffe0dd}.metric-icon{width:44rpx;height:44rpx;display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:23rpx}.blue{background:#e8f0ff;color:#003c90}.red{background:#fff0ef;color:#ef4444}.orange{background:#fff6df;color:#c47500}.green{background:#e8faf2;color:#006c49}.metric-label{margin-top:12rpx;color:#69707d;font-size:20rpx}.metric-value{margin-top:2rpx;color:#191b22;font-size:42rpx;font-weight:760;line-height:1.1}.metric-trend{margin-top:5rpx;color:#8b939e;font-size:18rpx}.red-text,.danger-text{color:#d43838}.green-text{color:#006c49}.warning-text{color:#ae6500}.dashboard-grid{display:grid;gap:16rpx;margin-top:18rpx}.urgent-card,.distribution-card,.report-card{padding:22rpx}.card-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:14rpx;margin-bottom:12rpx}.view-all{padding:5rpx 0;color:#003c90;font-size:20rpx}.hazard-row{display:flex;align-items:center;gap:13rpx;padding:16rpx 0;border-top:1rpx solid #eef1f4}.hazard-thumb{width:46rpx;height:46rpx;flex:0 0 46rpx;display:flex;align-items:center;justify-content:center;border-radius:10rpx;background:#e8f0ff;color:#003c90;font-size:21rpx;font-weight:800}.hazard-thumb.major{background:#fff0ef;color:#ef4444}.hazard-body{flex:1;min-width:0}.hazard-title{font-size:23rpx;font-weight:680;color:#242a34;line-height:1.4}.hazard-meta{margin-top:4rpx;color:#8b939e;font-size:18rpx;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.hazard-actions{display:flex;flex-direction:column;align-items:flex-end;gap:7rpx}.row-action{padding:0;color:#003c90;font-size:19rpx;font-weight:650}.side-stack{display:grid;gap:16rpx}.distribution-item{margin-top:18rpx}.distribution-meta{display:flex;justify-content:space-between;color:#5f6874;font-size:19rpx}.distribution-meta i{display:inline-block;width:10rpx;height:10rpx;margin-right:7rpx;border-radius:50%}.distribution-track{height:7rpx;margin-top:8rpx;background:#edf0f3;border-radius:99rpx;overflow:hidden}.distribution-track view{height:100%;border-radius:99rpx}.major-bar{background:#ef4444}.warning-bar{background:#f59e0b}.closed-bar{background:#006c49}.report-button{width:100%;height:58rpx;margin-top:20rpx;border-radius:10rpx;background:#f5f7fa;color:#394452;font-size:20rpx}.report-card{text-align:center}.report-symbol{width:62rpx;height:62rpx;margin:0 auto 12rpx;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#e8f0ff;color:#003c90;font-size:31rpx}.report-card .xr-caption{margin:8rpx auto 16rpx}.report-action{width:100%}@media(min-width:900px){.page-heading{margin:0 0 20px}.period-select{padding:7px 10px;font-size:11px}.metric-grid{grid-template-columns:repeat(4,1fr);gap:12px}.metric-card{min-height:124px;padding:16px}.metric-icon{width:34px;height:34px;font-size:17px}.metric-label{margin-top:10px;font-size:11px}.metric-value{font-size:28px}.metric-trend{font-size:10px}.dashboard-grid{grid-template-columns:minmax(0,1.85fr) minmax(260px,.85fr);gap:14px;margin-top:16px}.urgent-card,.distribution-card,.report-card{padding:18px}.card-heading{margin-bottom:9px}.view-all{font-size:11px}.hazard-row{gap:10px;padding:12px 0}.hazard-thumb{width:34px;height:34px;flex-basis:34px;border-radius:8px;font-size:15px}.hazard-title{font-size:12px}.hazard-meta{font-size:10px}.hazard-actions{gap:5px}.row-action{font-size:10px}.side-stack{gap:14px}.distribution-item{margin-top:14px}.distribution-meta{font-size:10px}.distribution-meta i{width:6px;height:6px;margin-right:5px}.distribution-track{height:5px;margin-top:6px}.report-button{height:34px;margin-top:15px;border-radius:7px;font-size:10px}.report-symbol{width:44px;height:44px;margin-bottom:9px;font-size:22px}.report-card .xr-caption{margin:6px auto 13px}.report-action{width:100%}}
</style>
