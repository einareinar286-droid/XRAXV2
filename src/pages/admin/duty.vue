<template>
  <view class="page">
    <view v-if="loading" class="state">正在汇总履职数据…</view>
    <view v-else-if="error" class="state error"><text>{{ error }}</text><button @click="load">重新加载</button></view>
    <template v-else-if="dashboard">
      <view class="heading"><text class="title">履职仪表盘</text><text class="copy">{{ scopeLabel }} · 仅“按时提交并审核通过”计入完成</text></view>

      <view class="instrument" :class="{ qualified: dashboard.company.qualified, 'not-applicable': !dashboard.company.applicable }">
        <view><text class="instrument-label">履职率</text><text class="instrument-value">{{ rateText }}</text><text class="instrument-copy">目标 100% · {{ qualificationText }}</text></view>
        <view class="instrument-mark"><view class="needle" :style="{ transform: `rotate(${needleRotation}deg)` }" /><view class="mark-center" /></view>
        <view class="meter"><view class="meter-fill" :style="{ width: `${meterWidth}%` }" /></view>
      </view>

      <view class="ledger">
        <view><text>{{ dashboard.company.dueCount }}</text><span>应履职</span></view>
        <view><text>{{ dashboard.company.onTimeApprovedCount }}</text><span>按时通过</span></view>
        <view class="risk"><text>{{ dashboard.company.assessmentCount }}</text><span>进入考核</span></view>
      </view>

      <view class="section"><text class="section-title">部门履职情况</text><view v-if="dashboard.departments.length" class="department-list"><view v-for="item in dashboard.departments" :key="item.department" class="department-row"><view><text class="department-name">{{ item.department }}</text><text class="department-copy">{{ item.applicable ? `按时通过 ${item.onTimeApprovedCount}/${item.dueCount}` : '本期无任务，不计入履职率' }}</text></view><text class="department-rate" :class="{ danger: item.applicable && !item.qualified }">{{ item.applicable ? `${item.completionRate}%` : '不适用' }}</text></view></view><view v-else class="empty">本权限范围内暂无履职任务</view></view>

      <view class="section review"><view class="section-heading"><text class="section-title">待审核履职</text><text class="review-count">{{ dashboard.reviewItems.length }} 项</text></view><view v-if="dashboard.reviewItems.length"><view v-for="item in dashboard.reviewItems" :key="item.id" class="review-row"><view><text class="assessment-title">{{ item.title }}</text><text class="assessment-meta">{{ item.ownerName }} · {{ item.department }} · 提交于 {{ formatTime(item.submittedAt) }}</text><textarea v-model="returnNotes[item.id]" maxlength="1000" placeholder="仅退回时填写原因" /></view><view class="review-actions"><button class="approve" :loading="submittingId===item.id" :disabled="submittingId===item.id" @click="review(item,'APPROVE')">审核通过</button><button class="return" :disabled="submittingId===item.id || !returnNotes[item.id]?.trim()" @click="review(item,'RETURN')">退回补充</button></view></view></view><view v-else class="empty success">当前没有待审核履职</view></view>

      <view class="section assessment"><view class="section-heading"><text class="section-title">考核清单</text><text class="assessment-count">{{ dashboard.assessmentItems.length }} 项</text></view><view v-if="dashboard.assessmentItems.length"><view v-for="item in dashboard.assessmentItems" :key="item.id" class="assessment-row"><view><text class="assessment-title">{{ item.title }}</text><text class="assessment-meta">{{ item.department }} · {{ item.ownerName }} · 截止 {{ item.dueDate }}</text></view><text class="assessment-reason">{{ item.assessmentReason }}</text></view></view><view v-else class="empty success">本权限范围内没有进入考核的履职事项</view></view>
    </template>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getCurrentUser, getDutyDashboard, reviewDuty } from '../../services/duty'

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
const scopeLabel = computed(() => user.value?.role === 'SUPER_ADMIN' ? '公司视角' : `${user.value?.department || ''}视角`)

async function load() {
  loading.value = true
  error.value = ''
  try {
    user.value = await getCurrentUser()
    dashboard.value = await getDutyDashboard({ asOf: new Date().toISOString() })
  } catch (err) {
    dashboard.value = null
    error.value = err.message || '履职仪表盘加载失败'
  } finally {
    loading.value = false
  }
}

function formatTime(value){return value?String(value).replace('T',' ').replace('.000Z',''):''}
async function review(item, decision){if(submittingId.value)return;submittingId.value=item.id;try{await reviewDuty(item.id,{decision,note:decision==='RETURN'?returnNotes[item.id]:''});uni.showToast({title:decision==='APPROVE'?'审核通过':'已退回补充',icon:'success'});delete returnNotes[item.id];await load()}catch(err){uni.showToast({title:err.message||'审核失败',icon:'none'})}finally{submittingId.value=''}}

onShow(load)
</script>

<style lang="scss" scoped>
.page{min-height:100vh;padding:30rpx 28rpx 64rpx;background:$xr-canvas}.heading{margin:14rpx 0 24rpx}.title{display:block;font-size:42rpx;font-weight:760;color:$xr-text}.copy{display:block;margin-top:8rpx;font-size:22rpx;color:$xr-muted;line-height:1.6}.instrument{position:relative;padding:30rpx;border-radius:24rpx;background:$xr-surface-strong;color:$xr-text-inverse;overflow:hidden}.instrument-label,.instrument-copy{display:block}.instrument-label{font-size:22rpx;color:#b8c8c1}.instrument-value{display:block;margin:8rpx 0;font-size:64rpx;line-height:1;font-weight:780;font-variant-numeric:tabular-nums}.instrument-copy{font-size:21rpx;color:#b8c8c1}.instrument-mark{position:absolute;right:28rpx;top:34rpx;width:124rpx;height:62rpx;border:4rpx solid #587269;border-bottom:0;border-radius:124rpx 124rpx 0 0}.needle{position:absolute;bottom:0;left:58rpx;width:4rpx;height:50rpx;transform-origin:bottom center;background:$xr-green-bright;border-radius:4rpx}.mark-center{position:absolute;bottom:-7rpx;left:53rpx;width:14rpx;height:14rpx;border-radius:50%;background:$xr-text-inverse}.meter{height:12rpx;margin-top:26rpx;border-radius:999rpx;background:#30453e;overflow:hidden}.meter-fill{height:100%;border-radius:inherit;background:$xr-amber}.qualified .meter-fill{background:$xr-green-bright}.not-applicable .meter-fill{background:#73867e}.ledger{display:grid;grid-template-columns:repeat(3,1fr);gap:1rpx;margin:20rpx 0 30rpx;background:$xr-line;border:1rpx solid $xr-line;border-radius:18rpx;overflow:hidden}.ledger view{padding:22rpx;background:$xr-surface;text-align:center}.ledger text,.ledger span{display:block}.ledger text{font-size:39rpx;line-height:1;font-weight:760;font-variant-numeric:tabular-nums;color:$xr-text}.ledger span{margin-top:8rpx;font-size:20rpx;color:$xr-muted}.ledger .risk text{color:$xr-red}.section{margin-top:20rpx;padding:26rpx;border-radius:22rpx;background:$xr-surface;border:1rpx solid $xr-line}.section-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:8rpx}.section-title{font-size:29rpx;font-weight:720;color:$xr-text}.department-row,.assessment-row,.review-row{display:flex;justify-content:space-between;gap:18rpx;padding:20rpx 0;border-top:1rpx solid $xr-line}.department-name,.assessment-title,.department-copy,.assessment-meta{display:block}.department-name,.assessment-title{font-size:26rpx;font-weight:650;color:$xr-text}.department-copy,.assessment-meta{margin-top:5rpx;font-size:20rpx;color:$xr-muted;line-height:1.5}.department-rate{flex:0 0 auto;font-size:28rpx;font-weight:740;color:$xr-green;font-variant-numeric:tabular-nums}.department-rate.danger,.assessment-reason,.assessment-count{color:$xr-red}.assessment,.review{margin-top:20rpx}.assessment-count,.review-count{font-size:21rpx}.assessment-reason{flex:0 0 136rpx;text-align:right;font-size:20rpx;line-height:1.5}.review-row textarea{box-sizing:border-box;width:100%;height:108rpx;margin-top:14rpx;padding:14rpx;border-radius:12rpx;background:#f2f6f3;font-size:22rpx}.review-actions{display:flex;flex:0 0 150rpx;flex-direction:column;gap:10rpx}.review-actions button{width:100%;font-size:20rpx}.approve{background:$xr-green;color:#fff}.return{background:#fff0ee;color:$xr-red}.empty{padding:36rpx 0 10rpx;text-align:center;font-size:22rpx;color:$xr-muted}.empty.success{color:$xr-green}.state{padding:100rpx 30rpx;text-align:center;color:$xr-muted}.state.error{color:$xr-red}.state button{margin-top:18rpx;background:#e7f2ed;color:$xr-green;font-size:23rpx}@media (min-width:1200px){.page{max-width:1120px;margin:0 auto;padding:36px 32px 70px}.title{font-size:30px}.copy{font-size:13px}.instrument{padding:30px}.instrument-label,.instrument-copy{font-size:13px}.instrument-value{font-size:64px}.instrument-mark{right:32px;top:38px;width:150px;height:75px}.needle{left:71px;height:61px}.mark-center{left:65px}.meter{height:8px;margin-top:24px}.ledger{margin:20px 0 30px}.ledger view{padding:20px}.ledger text{font-size:30px}.ledger span,.department-copy,.assessment-meta,.assessment-reason,.assessment-count,.review-actions button{font-size:12px}.section{padding:24px}.section-title{font-size:18px}.department-row,.assessment-row,.review-row{padding:18px 0}.department-name,.assessment-title{font-size:16px}.department-rate{font-size:20px}.review-row textarea{height:72px;font-size:13px}.review-actions{flex-basis:110px}}
</style>
