<template>
  <view>
    <AdaptiveNavigation active="WORKBENCH" />
    <view class="page-shell">
      <view class="masthead">
        <view class="brand-lockup">
          <view class="brand-mark"><view class="brand-mark-core" /></view>
          <view><text class="brand-name">徐燃安巡</text><text class="brand-subtitle">LPG 安全闭环工作台</text></view>
        </view>
        <view class="data-chip"><text class="data-dot" />演示数据</view>
      </view>

      <view class="command-surface glass-panel-high neon-glow-cyan">
        <view>
          <text class="eyebrow">领导总览</text>
          <text class="overview-title">{{ roleLabel }}的安全闭环态势</text>
          <text class="overview-copy">所有指标由当前可见的 Mock 流程快照汇总，仅用于功能演示，不代表公司实际履职或隐患结果。</text>
        </view>
        <view class="command-side">
          <text class="command-value">{{ priorityItems.length }}</text>
          <text>项重点待办</text>
          <text class="updated-at">更新于 {{ generatedAtText }}</text>
        </view>
      </view>

      <view v-if="loading" class="message-state glass-panel">正在汇总工作台数据…</view>
      <view v-else-if="error" class="message-state error-state glass-panel"><text>{{ error }}</text><button @click="load">重新加载</button></view>

      <template v-else-if="snapshot">
        <view class="section-title-row"><view><text class="section-title">隐患闭环态势</text><text class="section-caption">按流程节点汇总，便于优先推动未闭环事项</text></view></view>
        <view class="metric-grid issue-grid">
          <view v-for="item in issueMetricCards" :key="item.label" class="metric-card glass-panel" :class="item.tone">
            <text class="metric-label">{{ item.label }}</text>
            <text class="metric-value">{{ item.value }}</text>
            <text class="metric-note">{{ item.note }}</text>
          </view>
        </view>

        <view class="section-title-row duty-heading"><view><text class="section-title">履职仪表盘</text><text class="section-caption">履职必须 100%，未完成事项进入考核</text></view><text class="qualified-chip">{{ snapshot.dutyMetrics ? '按期审核口径' : '当前无权限' }}</text></view>
        <view v-if="snapshot.dutyMetrics" class="metric-grid duty-grid">
          <view v-for="item in dutyMetricCards" :key="item.label" class="metric-card duty-card glass-panel" :class="item.tone">
            <text class="metric-label">{{ item.label }}</text>
            <text class="metric-value">{{ item.value }}</text>
            <text class="metric-note">{{ item.note }}</text>
          </view>
        </view>
        <view v-else class="permission-state">当前角色无履职总览权限。真实上线后，此处将按服务端授权展示对应部门或公司总览。</view>

        <view class="content-grid">
          <view class="priority-panel glass-panel">
            <view class="section-title-row"><view><text class="section-title">重点待办</text><text class="section-caption">重大隐患、待复核和临近期限事项优先</text></view><text class="count-label">{{ priorityItems.length }} 项</text></view>
            <view v-for="issue in priorityItems" :key="issue.id" class="priority-item" :class="{ major: issue.isMajor }" @click="openIssue(issue.id)">
              <view class="priority-topline"><text class="status-tag" :class="statusClass(issue.status)">{{ issueStatusText(issue.status) }}</text><text v-if="issue.isMajor" class="major-tag">重大隐患</text><text class="issue-id">{{ issue.id }}</text></view>
              <text class="priority-title">{{ issue.title }}</text>
              <view class="priority-meta"><text>{{ stageSummary(issue.status).currentLabel }}</text><text>{{ issue.deadline ? `限期 ${issue.deadline}` : '期限待设置' }}</text></view>
            </view>
            <view v-if="!priorityItems.length" class="empty-priority">当前没有需推进的未闭环事项。</view>
          </view>

          <view class="shortcut-panel glass-panel-high">
            <text class="section-title">快速入口</text>
            <text class="section-caption">按当前角色提供可用操作</text>
            <view v-for="item in shortcuts" :key="item.label" class="shortcut-item" @click="openShortcut(item)">
              <view><text class="shortcut-title">{{ item.label }}</text><text class="shortcut-copy">{{ item.copy }}</text></view>
              <text class="shortcut-arrow">→</text>
            </view>
          </view>
        </view>
      </template>
    </view>
  </view>
</template>
<script setup>
import { computed, ref } from 'vue'
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import { issueRoleText, issueStatusText } from '../../services/issues/index.mjs'
import { getIssueStageSummary } from '../../domain/issues/presentation.mjs'
import { getWorkbenchSnapshot } from '../../services/workbench/index.mjs'
import AdaptiveNavigation from '../../components/navigation/AdaptiveNavigation.vue'

const snapshot = ref(null)
const loading = ref(true)
const error = ref('')

const roleLabel = computed(() => snapshot.value?.user ? issueRoleText(snapshot.value.user.role) : '当前角色')
const generatedAtText = computed(() => snapshot.value?.generatedAt ? formatGeneratedAt(snapshot.value.generatedAt) : '--')
const priorityItems = computed(() => snapshot.value?.priorityItems || [])
const issueMetricCards = computed(() => {
  const metrics = snapshot.value?.issueMetrics || {}
  return [
    { label: '隐患总数', value: metrics.total ?? 0, note: '当前可见范围', tone: 'neutral' },
    { label: '待交办', value: metrics.reported ?? 0, note: '等待安监交办', tone: 'amber' },
    { label: '待整改', value: metrics.assigned ?? 0, note: '市场待处理', tone: 'amber' },
    { label: '待复核', value: metrics.review ?? 0, note: '等待安监确认', tone: 'blue' },
    { label: '已闭环', value: metrics.closed ?? 0, note: '流程已完成', tone: 'green' },
    { label: '重大隐患', value: metrics.major ?? 0, note: '需优先推动', tone: 'danger' }
  ]
})
const dutyMetricCards = computed(() => {
  const metrics = snapshot.value?.dutyMetrics || {}
  return [
    { label: '履职率', value: formatPercent(metrics.completionRate), note: '仅按时且审核通过计入', tone: 'green' },
    { label: '待审核', value: metrics.reviewCount ?? 0, note: '等待审核处理', tone: 'blue' },
    { label: '考核项', value: metrics.assessmentCount ?? 0, note: '未完成、退回或逾期', tone: 'danger' }
  ]
})
const shortcuts = computed(() => {
  const role = snapshot.value?.user?.role
  const items = [{ label: '随手拍上报', copy: '全员可上报，定位可选', path: '/pages/issue/create', tab: true }]
  if (role === 'MARKETING_OFFICER' || role === 'SUPER_ADMIN') {
    items.push({ label: '待整改隐患', copy: '安监部交办单，整改后提交图文佐证', path: '/pages/issue/my-rectify' })
  }
  if (['SUPER_ADMIN', 'SAFETY_OFFICER', 'MARKETING_OFFICER'].includes(role)) {
    items.push({ label: '履职仪表盘', copy: '查看履职与考核清单', path: '/pages/admin/duty' })
  }
  items.push({ label: '我的', copy: '查看当前演示身份与系统边界', path: '/pages/profile/index', tab: true })
  return items
})

function formatPercent(value) {
  if (typeof value !== 'number') return '--'
  return `${Math.round(Math.max(0, Math.min(100, value)))}%`
}

function formatGeneratedAt(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function statusClass(status) {
  return ({ REPORTED: 'reported', ASSIGNED: 'assigned', RECTIFICATION_SUBMITTED: 'review', REJECTED: 'rejected', CLOSED: 'closed' })[status]
}

function stageSummary(status) {
  return getIssueStageSummary(status)
}

function openIssue(id) {
  uni.navigateTo({ url: `/pages/issue/detail?id=${id}` })
}

function openShortcut(item) {
  if (item.tab) {
    uni.switchTab({ url: item.path })
    return
  }
  uni.navigateTo({ url: item.path })
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    snapshot.value = await getWorkbenchSnapshot()
  } catch (err) {
    error.value = err.message || '工作台数据加载失败'
  } finally {
    loading.value = false
    uni.stopPullDownRefresh()
  }
}

onShow(load)
onPullDownRefresh(load)
</script>

<style lang="scss" scoped>
.page-shell{min-height:100vh;padding:28rpx 28rpx 64rpx;background:transparent}
.masthead{display:flex;align-items:center;justify-content:space-between;gap:18rpx;margin:12rpx 0 26rpx}
.brand-lockup{display:flex;align-items:center;gap:14rpx}
.brand-mark{width:64rpx;height:64rpx;border-radius:18rpx 18rpx 18rpx 6rpx;background:$xr-surface-strong;border:1rpx solid rgba(0,244,254,.55);display:flex;align-items:center;justify-content:center;box-shadow:$xr-cyan-glow}
.brand-mark-core{width:26rpx;height:26rpx;border:4rpx solid $xr-green-bright;border-radius:50%;position:relative}
.brand-mark-core::after{content:'';position:absolute;right:-7rpx;top:1rpx;width:8rpx;height:8rpx;border-radius:50%;background:$xr-green-bright}
.brand-name,.brand-subtitle{display:block}
.brand-name{font-size:36rpx;line-height:1.2;font-weight:760;color:$xr-text}
.brand-subtitle{margin-top:4rpx;font-size:20rpx;color:$xr-muted}
.data-chip{display:flex;align-items:center;gap:8rpx;max-width:270rpx;padding:9rpx 13rpx;border:1rpx solid rgba(0,244,254,.35);border-radius:12rpx;background:rgba(0,244,254,.08);color:$xr-green-bright;font-size:19rpx;line-height:1.35}
.data-dot{width:10rpx;height:10rpx;flex:0 0 auto;border-radius:50%;background:$xr-green-bright;box-shadow:$xr-cyan-glow}
.command-surface{display:flex;justify-content:space-between;gap:26rpx;padding:32rpx 28rpx;border-radius:26rpx;background:linear-gradient(135deg,#0d1f1f 0%,#102b29 100%);color:#fff}
.eyebrow{display:block;font-size:19rpx;letter-spacing:.12em;color:$xr-green-bright}
.overview-title{display:block;margin-top:12rpx;font-size:37rpx;font-weight:760;line-height:1.3;color:$xr-text}
.overview-copy{display:block;max-width:480rpx;margin-top:10rpx;font-size:21rpx;line-height:1.65;color:$xr-muted}
.command-side{flex:0 0 auto;min-width:116rpx;padding-left:18rpx;border-left:1rpx solid rgba(255,255,255,.22);text-align:right;color:$xr-muted;font-size:19rpx}
.command-value{display:block;margin-bottom:7rpx;color:$xr-green-bright;font-size:56rpx;line-height:1;font-weight:760;text-shadow:0 0 24rpx rgba(99,247,255,.5)}
.updated-at{display:block;margin-top:18rpx;font-size:18rpx;color:rgba(255,255,255,.45)}
.section-title-row{display:flex;align-items:flex-end;justify-content:space-between;gap:18rpx;margin:40rpx 0 18rpx}
.section-title,.section-caption{display:block}
.section-title{font-size:32rpx;font-weight:750;color:$xr-text}
.section-caption,.count-label{margin-top:5rpx;font-size:21rpx;color:$xr-muted}
.qualified-chip{padding:7rpx 11rpx;border-radius:9rpx;background:rgba(99,247,255,.12);color:$xr-green-bright;font-size:19rpx;border:1rpx solid rgba(99,247,255,.3)}
.metric-grid{display:grid;gap:14rpx}
.issue-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
.duty-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
.metric-card{min-width:0;padding:21rpx 18rpx;border-radius:18rpx}
.metric-label,.metric-value,.metric-note{display:block}
.metric-label{font-size:20rpx;color:$xr-muted}
.metric-value{margin-top:11rpx;font-size:38rpx;font-weight:760;line-height:1;color:$xr-text}
.metric-note{margin-top:9rpx;font-size:18rpx;line-height:1.45;color:$xr-muted-dim}
.metric-card.amber .metric-value{color:$xr-amber;text-shadow:0 0 18rpx rgba(255,210,138,.35)}
.metric-card.blue .metric-value{color:$xr-green-bright;text-shadow:0 0 18rpx rgba(99,247,255,.4)}
.metric-card.green .metric-value{color:$xr-lime;text-shadow:0 0 18rpx rgba(168,240,154,.35)}
.metric-card.danger .metric-value{color:$xr-red;text-shadow:0 0 18rpx rgba(255,180,171,.45)}
.duty-heading{margin-top:42rpx}
.duty-card{background:rgba(13,31,31,.6)}
.permission-state{padding:28rpx;border:1rpx dashed $xr-line-strong;border-radius:18rpx;background:rgba(255,255,255,.03);font-size:22rpx;line-height:1.7;color:$xr-muted}
.content-grid{display:grid;gap:18rpx;margin-top:42rpx}
.priority-panel,.shortcut-panel{padding:24rpx;border-radius:22rpx}
.priority-panel .section-title-row{margin:0 0 18rpx}
.priority-item{padding:19rpx 0;border-top:1rpx solid $xr-line}
.priority-item:first-of-type{border-top:0}
.priority-item.major{padding-left:13rpx;border-left:4rpx solid $xr-red}
.priority-topline{display:flex;align-items:center;gap:9rpx}
.status-tag,.major-tag{padding:5rpx 9rpx;border-radius:7rpx;font-size:18rpx}
.status-tag.reported{background:rgba(255,172,232,.12);color:$xr-magenta}
.status-tag.assigned{background:rgba(255,210,138,.12);color:$xr-amber}
.status-tag.review{background:rgba(99,247,255,.12);color:$xr-green-bright}
.status-tag.rejected{background:rgba(255,180,171,.14);color:$xr-red}
.status-tag.closed{background:rgba(168,240,154,.12);color:$xr-lime}
.major-tag{background:rgba(255,180,171,.14);color:$xr-red;font-weight:700}
.issue-id{margin-left:auto;font-size:18rpx;color:$xr-muted}
.priority-title{display:block;margin:13rpx 0 11rpx;font-size:26rpx;line-height:1.45;font-weight:700;color:$xr-text}
.priority-meta{display:flex;justify-content:space-between;gap:12rpx;font-size:19rpx;color:$xr-muted}
.empty-priority{padding:34rpx 12rpx;text-align:center;color:$xr-muted;font-size:21rpx}
.shortcut-panel{background:linear-gradient(160deg,rgba(13,31,31,.72) 0%,rgba(19,19,19,.9) 100%)}
.shortcut-panel .section-caption{margin-bottom:11rpx}
.shortcut-item{display:flex;align-items:center;justify-content:space-between;gap:14rpx;padding:19rpx 0;border-top:1rpx solid $xr-line}
.shortcut-title,.shortcut-copy{display:block}
.shortcut-title{font-size:24rpx;font-weight:700;color:$xr-text}
.shortcut-copy{margin-top:5rpx;font-size:19rpx;color:$xr-muted}
.shortcut-arrow{font-size:30rpx;color:$xr-green-bright}
.message-state{display:flex;flex-direction:column;align-items:center;gap:10rpx;margin-top:28rpx;padding:68rpx 24rpx;text-align:center;color:$xr-muted;border-radius:22rpx;font-size:23rpx}
.error-state{color:$xr-red;border-color:rgba(255,180,171,.4)}
.error-state button{margin-top:14rpx;background:rgba(99,247,255,.12);color:$xr-green-bright;font-size:23rpx;border:1rpx solid rgba(99,247,255,.35)}
@media (min-width:1200px){.page-shell{max-width:1240px;margin:0 0 0 260px;padding:38px 42px 70px}.masthead{margin-top:0}.brand-mark{width:48px;height:48px}.brand-mark-core{width:18px;height:18px;border-width:3px}.brand-name{font-size:25px}.brand-subtitle,.data-chip{font-size:12px}.data-dot{width:6px;height:6px}.command-surface{padding:34px 38px}.eyebrow{font-size:11px}.overview-title{font-size:31px}.overview-copy{font-size:14px}.command-side{font-size:12px}.command-value{font-size:54px}.updated-at{font-size:11px}.section-title-row{margin-top:40px}.section-title{font-size:23px}.section-caption,.count-label,.qualified-chip{font-size:12px}.metric-grid{gap:14px}.metric-card{padding:20px}.metric-label{font-size:12px}.metric-value{font-size:31px}.metric-note{font-size:11px}.permission-state{padding:24px;font-size:13px}.content-grid{grid-template-columns:minmax(0,1.5fr) minmax(290px,.8fr);align-items:start;gap:20px;margin-top:42px}.priority-panel,.shortcut-panel{padding:26px}.priority-title{font-size:17px}.status-tag,.major-tag,.issue-id,.priority-meta,.shortcut-copy{font-size:12px}.shortcut-title{font-size:15px}.shortcut-arrow{font-size:24px}.message-state{font-size:14px}}
</style>
