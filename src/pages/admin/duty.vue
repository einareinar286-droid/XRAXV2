<template>
  <view>
    <AdaptiveNavigation active="DUTY_DASHBOARD" />
    <view class="page">
    <view v-if="loading" class="state">正在汇总履职数据…</view>
    <view v-else-if="error" class="state error"><text>{{ error }}</text><button @click="load">重新加载</button></view>
    <template v-else-if="dashboard">
      <view class="heading"><text class="title">履职仪表盘</text><text class="copy">{{ scopeLabel }} · 履职必须 100%，只有按期审核通过才计入完成</text></view><view class="period-bar"><picker :range="periodViewOptions" range-key="label" @change="changePeriodView"><view class="period-pill">{{ selectedPeriodViewLabel }}</view></picker><text class="period-copy">按任务自身周期分组统计</text></view>
      <view class="instrument glass-panel-high" :class="{ qualified: dashboard.company.qualified, 'not-applicable': !dashboard.company.applicable }">
        <view><text class="instrument-label">履职率</text><text class="instrument-value">{{ rateText }}</text><text class="instrument-copy">目标 100% · {{ qualificationText }}</text></view>
        <view class="instrument-mark"><view class="needle" :style="{ transform: `rotate(${needleRotation}deg)` }" /><view class="mark-center" /></view>
        <view class="meter"><view class="meter-fill" :style="{ width: `${meterWidth}%` }" /></view>
      </view>
      <view class="ledger">
        <view><text>{{ dashboard.company.dueCount }}</text><span>应履职</span></view>
        <view><text>{{ dashboard.company.onTimeApprovedCount }}</text><span>按时通过</span></view>
        <view class="risk"><text>{{ dashboard.company.assessmentCount }}</text><span>进入考核</span></view>
      </view>

      <view class="section glass-panel"><text class="section-title">部门履职情况</text><view v-if="dashboard.departments.length"><view v-for="item in dashboard.departments" :key="item.department" class="department-row"><view><text class="department-name">{{ item.department }}</text><text class="department-copy">{{ item.applicable ? `按时通过 ${item.onTimeApprovedCount}/${item.dueCount}` : '本期无任务，不计入履职率' }}</text></view><text class="department-rate" :class="{ danger: item.applicable && !item.qualified }">{{ item.applicable ? `${item.completionRate}%` : '不适用' }}</text></view></view><view v-else class="empty">暂无履职任务</view></view>

      <view class="section people glass-panel"><view class="section-heading"><text class="section-title">全员履职明细</text><text class="review-count">{{ people.length }} 人</text></view><view class="people-filters"><picker :range="departmentOptions" @change="changeDepartment"><view class="filter-pill">{{ selectedDepartment }}</view></picker><picker :range="dutyStatusOptions" range-key="label" @change="changeDutyStatus"><view class="filter-pill">{{ selectedDutyStatus.label }}</view></picker><input v-model="peopleQuery.keyword" class="keyword" confirm-type="search" placeholder="姓名/部门/岗位" @confirm="searchPeople" /><button class="filter-action" @click="searchPeople">搜索</button><button class="filter-action reset" @click="resetPeople">重置</button></view><view v-if="peopleLoading" class="empty">正在筛选人员…</view><view v-else-if="peopleError" class="empty error">{{ peopleError }}</view><view v-else-if="people.length"><view v-for="person in people" :key="person.employeeId" class="person-row"><view><text class="assessment-title">{{ person.displayName }} · {{ person.position }}</text><text class="assessment-meta">{{ person.department }} · 应履职 {{ person.dueCount }} · 按时通过 {{ person.onTimeApprovedCount }}</text></view><view class="person-summary"><text :class="['person-rate', { danger: person.applicable && !person.qualified }]">{{ person.applicable ? `${person.completionRate}%` : '不适用' }}</text><text v-if="person.assessmentCount" class="assessment-reason">考核 {{ person.assessmentCount }}</text></view></view></view><view v-else class="empty">暂无符合条件的人员</view></view>

      <view class="section review glass-panel"><view class="section-heading"><text class="section-title">待审核履职</text><text class="review-count">{{ dashboard.reviewItems.length }} 项</text></view><view v-if="dashboard.reviewItems.length"><view v-for="item in dashboard.reviewItems" :key="item.id" class="review-row"><view><text class="assessment-title">{{ item.title }}</text><text class="assessment-meta">{{ item.ownerName }} · {{ item.department }} · 提交于 {{ formatTime(item.submittedAt) }}</text><textarea v-if="canReview" v-model="returnNotes[item.id]" maxlength="1000" placeholder="仅退回时填写原因" /></view><view v-if="canReview" class="review-actions"><button class="approve" :loading="submittingId===item.id" :disabled="submittingId===item.id" @click="review(item,'APPROVE')">审核通过</button><button class="return" :disabled="submittingId===item.id || !returnNotes[item.id]?.trim()" @click="review(item,'RETURN')">退回补充</button></view><text v-else class="assessment-reason">仅超级管理员可修改</text></view></view><view v-else class="empty success">当前没有待审核履职</view></view>

      <view class="section assessment glass-panel"><view class="section-heading"><text class="section-title">考核清单</text><text class="assessment-count">{{ dashboard.assessmentItems.length }} 项</text></view><view v-if="dashboard.assessmentItems.length"><view v-for="item in dashboard.assessmentItems" :key="item.id" class="assessment-row"><view><text class="assessment-title">{{ item.title }}</text><text class="assessment-meta">{{ item.department }} · {{ item.ownerName }} · 截止 {{ item.dueDate }}</text></view><text class="assessment-reason">{{ item.assessmentReason }}</text></view></view><view v-else class="empty success">本期没有进入考核的履职事项</view></view>
    </template>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getCurrentUser, getDutyDashboard, listDutyPeople, reviewDuty } from '../../services/duty'
import AdaptiveNavigation from '../../components/navigation/AdaptiveNavigation.vue'

const dashboard = ref(null)
const user = ref(null)
const loading = ref(true)
const error = ref('')
const submittingId = ref('')
const returnNotes = reactive({})
const rateText = computed(() => dashboard.value?.company.applicable ? `${dashboard.value.company.completionRate}%` : '不适用')
const meterWidth = computed(() => Math.max(0, Math.min(100, dashboard.value?.company.completionRate || 0)))
const needleRotation = computed(() => -90 + meterWidth.value * 1.8)
const qualificationText = computed(() => !dashboard.value?.company.applicable ? '本期无任务' : dashboard.value.company.qualified ? '达到履职要求' : '未达到 100%，应纳入考核')
const scopeLabel = computed(() => ['SUPER_ADMIN', 'SAFETY_OFFICER'].includes(user.value?.role) ? '公司视角' : '个人视角')
const canReview = computed(() => user.value?.role === 'SUPER_ADMIN')
const people = ref([])
const peopleLoading = ref(false)
const peopleError = ref('')
const peopleQuery = reactive({ department: '', dutyStatus: '', keyword: '' })
const periodViewOptions = [
  { label: '全部周期', value: '' },
  { label: '每日', value: 'DAILY' },
  { label: '每周', value: 'WEEKLY' },
  { label: '每两周', value: 'BIWEEKLY' },
  { label: '每月', value: 'MONTHLY' },
  { label: '每季度', value: 'QUARTERLY' },
  { label: '每半年', value: 'SEMIANNUAL' },
  { label: '每年', value: 'ANNUAL' }
]
const selectedPeriodView = ref('')
const selectedPeriodViewLabel = computed(() => periodViewOptions.find((item) => item.value === selectedPeriodView.value)?.label || '全部周期')
const dutyStatusOptions = [
  { label: '全部状态', value: '' },
  { label: '已达标', value: 'COMPLETED' },
  { label: '进入考核', value: 'ASSESSMENT' },
  { label: '无任务', value: 'NOT_APPLICABLE' }
]
const departmentOptions = computed(() => dashboard.value?.departments.map((item) => item.department) || [])
const selectedDepartment = computed(() => peopleQuery.department || '全部部门')
const selectedDutyStatus = computed(() => dutyStatusOptions.find((item) => item.value === peopleQuery.dutyStatus) || dutyStatusOptions[0])

async function loadPeople() {
  peopleLoading.value = true
  peopleError.value = ''
  try {
    people.value = await listDutyPeople({
      department: peopleQuery.department || undefined,
      dutyStatus: peopleQuery.dutyStatus || undefined,
      keyword: peopleQuery.keyword || undefined,
      periodType: selectedPeriodView.value || undefined
    })
  } catch (err) {
    people.value = []
    peopleError.value = err?.message || '人员明细加载失败'
  } finally {
    peopleLoading.value = false
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    user.value = await getCurrentUser()
    dashboard.value = await getDutyDashboard({ asOf: new Date().toISOString(), periodType: selectedPeriodView.value || undefined })
    await loadPeople()
  } catch (err) {
    dashboard.value = null
    error.value = err.message || '履职仪表盘加载失败'
  } finally {
    loading.value = false
  }
}

function changeDepartment(event) {
  peopleQuery.department = departmentOptions.value[Number(event.detail.value)] || ''
  loadPeople()
}

function changeDutyStatus(event) {
  peopleQuery.dutyStatus = dutyStatusOptions[Number(event.detail.value)]?.value || ''
  loadPeople()
}

function searchPeople() {
  peopleQuery.keyword = peopleQuery.keyword.trim()
  loadPeople()
}

function resetPeople() {
  peopleQuery.department = ''
  peopleQuery.dutyStatus = ''
  peopleQuery.keyword = ''
  loadPeople()
}

function changePeriodView(event) {
  selectedPeriodView.value = periodViewOptions[Number(event.detail.value)]?.value || ''
  load()
}

function formatTime(value) { return value ? String(value).replace('T', ' ').replace('.000Z', '') : '' }
async function review(item, decision) {
  if (submittingId.value) return
  submittingId.value = item.id
  try {
    await reviewDuty(item.id, { decision, note: decision === 'RETURN' ? returnNotes[item.id] : '' })
    uni.showToast({ title: decision === 'APPROVE' ? '审核通过' : '已退回补充', icon: 'success' })
    delete returnNotes[item.id]
    await load()
  } catch (err) {
    uni.showToast({ title: err.message || '审核失败', icon: 'none' })
  } finally {
    submittingId.value = ''
  }
}

onShow(load)
</script>

<style lang="scss" scoped>
.page{min-height:100vh;padding:30rpx 28rpx 64rpx;background:transparent}
.heading{margin:14rpx 0 24rpx}
.period-bar{display:flex;align-items:center;gap:16rpx;margin:-6rpx 0 20rpx}
.period-pill{padding:10rpx 22rpx;border:1rpx solid rgba(99,247,255,.35);border-radius:999rpx;background:rgba(99,247,255,.08);color:$xr-green-bright;font-size:23rpx}
.period-copy{font-size:20rpx;color:$xr-muted}
.title{display:block;font-size:42rpx;font-weight:760;color:$xr-text}
.copy{display:block;margin-top:8rpx;font-size:22rpx;color:$xr-muted;line-height:1.6}
.instrument{position:relative;padding:30rpx;border-radius:24rpx;background:linear-gradient(135deg,#0d1f1f 0%,#102b29 100%);border:1rpx solid rgba(99,247,255,.25);box-shadow:$xr-cyan-glow;color:#fff;overflow:hidden}
.instrument-label,.instrument-copy{display:block}
.instrument-label{font-size:22rpx;color:$xr-muted}
.instrument-value{display:block;margin:8rpx 0;font-size:64rpx;line-height:1;font-weight:780;font-variant-numeric:tabular-nums;color:$xr-green-bright;text-shadow:0 0 30rpx rgba(99,247,255,.5)}
.instrument-copy{font-size:21rpx;color:$xr-muted}
.instrument-mark{position:absolute;right:28rpx;top:34rpx;width:124rpx;height:62rpx;border:4rpx solid rgba(99,247,255,.4);border-bottom:0;border-radius:124rpx 124rpx 0 0}
.needle{position:absolute;bottom:0;left:58rpx;width:4rpx;height:50rpx;transform-origin:bottom center;background:$xr-green-bright;border-radius:4rpx;box-shadow:$xr-cyan-glow}
.mark-center{position:absolute;bottom:-7rpx;left:53rpx;width:14rpx;height:14rpx;border-radius:50%;background:$xr-green-bright}
.meter{height:12rpx;margin-top:26rpx;border-radius:999rpx;background:rgba(255,255,255,.1);overflow:hidden}
.meter-fill{height:100%;border-radius:inherit;background:$xr-amber}
.qualified .meter-fill{background:$xr-green-bright}
.not-applicable .meter-fill{background:$xr-muted-dim}
.ledger{display:grid;grid-template-columns:repeat(3,1fr);gap:1rpx;margin:20rpx 0 30rpx;background:$xr-line;border:1rpx solid $xr-line;border-radius:18rpx;overflow:hidden}
.ledger view{padding:22rpx;background:$xr-glass-bg;text-align:center}
.ledger text,.ledger span{display:block}
.ledger text{font-size:39rpx;line-height:1;font-weight:760;font-variant-numeric:tabular-nums;color:$xr-text}
.ledger span{margin-top:8rpx;font-size:20rpx;color:$xr-muted}
.ledger .risk text{color:$xr-red;text-shadow:0 0 18rpx rgba(255,180,171,.4)}
.section{margin-top:20rpx;padding:26rpx;border-radius:22rpx;background:$xr-glass-bg;border:1rpx solid $xr-line}
.section-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:8rpx}
.section-title{font-size:29rpx;font-weight:720;color:$xr-text}
.department-row,.assessment-row,.review-row,.person-row{display:flex;justify-content:space-between;gap:18rpx;padding:20rpx 0;border-top:1rpx solid $xr-line}
.department-name,.assessment-title,.department-copy,.assessment-meta{display:block}
.department-name,.assessment-title{font-size:26rpx;font-weight:650;color:$xr-text}
.department-copy,.assessment-meta{margin-top:5rpx;font-size:20rpx;color:$xr-muted;line-height:1.5}
.department-rate,.person-rate{flex:0 0 auto;font-size:28rpx;font-weight:740;color:$xr-green-bright;font-variant-numeric:tabular-nums}
.department-rate.danger,.person-rate.danger,.assessment-reason,.assessment-count{color:$xr-red}
.person-summary{display:flex;flex:0 0 145rpx;align-items:flex-end;flex-direction:column;gap:8rpx}
.assessment,.review,.people{margin-top:20rpx}
.assessment-count,.review-count{font-size:21rpx}
.assessment-reason{font-size:20rpx;line-height:1.5}
.review-row textarea{box-sizing:border-box;width:100%;height:108rpx;margin-top:14rpx;padding:14rpx;border-radius:12rpx;background:rgba(255,255,255,.04);border:1rpx solid $xr-line;font-size:22rpx;color:$xr-text}
.review-actions{display:flex;flex:0 0 150rpx;flex-direction:column;gap:10rpx}
.review-actions button{width:100%;font-size:20rpx}
.approve{background:rgba(99,247,255,.15);color:$xr-green-bright;border:1rpx solid rgba(99,247,255,.4)}
.return{background:rgba(255,180,171,.12);color:$xr-red;border:1rpx solid rgba(255,180,171,.4)}
.people-filters{display:flex;flex-wrap:wrap;gap:10rpx;align-items:center;margin:6rpx 0 16rpx}
.filter-pill{padding:10rpx 20rpx;border:1rpx solid rgba(99,247,255,.35);border-radius:999rpx;background:rgba(99,247,255,.08);color:$xr-green-bright;font-size:22rpx}
.keyword{flex:1 1 200rpx;min-width:200rpx;padding:10rpx 18rpx;border:1rpx solid $xr-line;border-radius:999rpx;background:rgba(255,255,255,.04);font-size:22rpx;color:$xr-text}
.filter-action{flex:0 0 auto;padding:0 20rpx;background:rgba(99,247,255,.12);color:$xr-green-bright;font-size:22rpx;line-height:2.2;border:1rpx solid rgba(99,247,255,.3)}
.filter-action.reset{background:rgba(255,180,171,.1);color:$xr-red;border-color:rgba(255,180,171,.35)}
.empty.error{color:$xr-red}
.empty{padding:36rpx 0 10rpx;text-align:center;font-size:22rpx;color:$xr-muted}
.empty.success{color:$xr-lime}
.state{padding:100rpx 30rpx;text-align:center;color:$xr-muted}
.state.error{color:$xr-red}
.state button{margin-top:18rpx;background:rgba(99,247,255,.12);color:$xr-green-bright;font-size:23rpx;border:1rpx solid rgba(99,247,255,.35)}
@media (min-width:1200px){.page{max-width:1120px;margin:0 0 0 260px;padding:36px 32px 70px}.title{font-size:30px}.copy{font-size:13px}.instrument{padding:30px}.instrument-label,.instrument-copy{font-size:13px}.instrument-value{font-size:64px}.instrument-mark{right:32px;top:38px;width:150px;height:75px}.needle{left:71px;height:61px}.mark-center{left:65px}.meter{height:8px;margin-top:24px}.ledger{margin:20px 0 30px}.ledger view{padding:20px}.ledger text{font-size:30px}.ledger span,.department-copy,.assessment-meta,.assessment-reason,.assessment-count,.review-actions button{font-size:12px}.section{padding:24px}.section-title{font-size:18px}.department-row,.assessment-row,.review-row,.person-row{padding:18px 0}.department-name,.assessment-title{font-size:16px}.department-rate,.person-rate{font-size:20px}.review-row textarea{height:72px;font-size:13px}.review-actions{flex-basis:110px}.person-summary{flex-basis:100px}.filter-pill,.keyword,.filter-action{font-size:12px}}
</style>
