<template>
  <view>
    <AdaptiveNavigation active="PROFILE" />
    <view class="page">
    <view class="heading">
      <text class="title">操作日志</text>
      <text class="copy">记录关键操作的时间、操作人、对象与结果；不保存密码、会话凭证或完整附件地址。</text>
    </view>
    <view v-if="loading" class="state">正在加载操作日志…</view>
    <view v-else-if="error" class="state error">
      <text>{{ error }}</text>
      <button @click="load">重新加载</button>
    </view>
    <template v-else>
      <view class="filter-row">
        <picker :range="actionOptions" range-key="label" @change="changeAction">
          <view class="picker">{{ selectedAction.label }}</view>
        </picker>
        <text class="total">共 {{ result.total }} 条</text>
      </view>
      <view v-if="result.items.length" class="log-list">
        <view v-for="item in result.items" :key="item.id" class="log-card">
          <view class="log-top"><text class="action">{{ actionText(item.action) }}</text><text :class="['result', item.result === 'SUCCESS' ? 'success' : 'failure']">{{ item.result === 'SUCCESS' ? '成功' : '失败' }}</text></view>
          <text class="time">操作时间：{{ formatTime(item.occurredAt) }}</text>
          <text class="meta">操作人：{{ item.actorName }} · {{ item.actorDepartment }}</text>
          <text class="meta">对象：{{ item.targetType }} / {{ item.targetId }}</text>
          <text v-if="item.note" class="note">{{ item.note }}</text>
        </view>
      </view>
      <view v-else class="state">当前没有可显示的操作日志</view>
    </template>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { listOperationLogs } from '../../services/operation-logs/index.mjs'
import AdaptiveNavigation from '../../components/navigation/AdaptiveNavigation.vue'

const loading = ref(true)
const error = ref('')
const result = ref({ items: [], total: 0 })
const actionOptions = [
  { label: '全部操作', value: '' },
  { label: '履职提交', value: 'DUTY_SUBMIT' },
  { label: '履职审核通过', value: 'DUTY_APPROVE' },
  { label: '履职退回', value: 'DUTY_RETURN' },
  { label: '隐患上报', value: 'ISSUE_REPORT' },
  { label: '隐患交办', value: 'ISSUE_ASSIGN' },
  { label: '隐患整改', value: 'ISSUE_RECTIFY' },
  { label: '隐患闭环', value: 'ISSUE_CLOSE' }
]

const actionMap = Object.fromEntries(actionOptions.filter((item) => item.value).map((item) => [item.value, item.label]))
const selectedAction = computed(() => actionOptions.find((item) => item.value === selectedActionValue.value) || actionOptions[0])
const selectedActionValue = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    result.value = await listOperationLogs({ page: 1, pageSize: 50, action: selectedActionValue.value || undefined })
  } catch (err) {
    result.value = { items: [], total: 0 }
    error.value = err?.code === 'FORBIDDEN' ? '当前角色不能查看操作日志' : (err.message || '操作日志加载失败')
  } finally {
    loading.value = false
  }
}

function changeAction(event) {
  selectedActionValue.value = actionOptions[Number(event.detail.value)]?.value || ''
  load()
}

function actionText(action) {
  return actionMap[action] || action
}

function formatTime(value) {
  return value ? String(value).replace('T', ' ').replace('.000Z', '') : ''
}

onShow(load)
</script>

<style lang="scss" scoped>
.page{min-height:100vh;padding:30rpx 28rpx 64rpx;background:$xr-canvas}.heading{margin:14rpx 0 24rpx}.title{display:block;font-size:42rpx;font-weight:760;color:$xr-text}.copy{display:block;margin-top:8rpx;font-size:22rpx;line-height:1.6;color:$xr-muted}.filter-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:20rpx;padding:18rpx 22rpx;border:1rpx solid $xr-line;border-radius:18rpx;background:$xr-surface}.picker,.total{font-size:23rpx;color:$xr-text}.total{color:$xr-muted}.log-list{display:flex;flex-direction:column;gap:16rpx}.log-card{padding:24rpx;border:1rpx solid $xr-line;border-radius:20rpx;background:$xr-surface}.log-top{display:flex;align-items:center;justify-content:space-between}.action{font-size:27rpx;font-weight:700;color:$xr-text}.result{padding:4rpx 12rpx;border-radius:999rpx;font-size:20rpx}.success{background:#e8f5ee;color:$xr-green}.failure{background:#fff0ee;color:$xr-red}.time,.meta,.note{display:block;margin-top:10rpx;font-size:21rpx;line-height:1.5;color:$xr-muted}.note{padding-top:10rpx;border-top:1rpx solid $xr-line;color:$xr-text}.state{padding:100rpx 30rpx;text-align:center;color:$xr-muted}.state.error{color:$xr-red}.state button{margin-top:18rpx;background:#e7f2ed;color:$xr-green;font-size:23rpx}@media (min-width:1200px){.page{max-width:1120px;margin:0 0 0 260px;padding:36px 32px 70px}.title{font-size:30px}.copy,.picker,.total,.time,.meta,.note{font-size:13px}.filter-row{padding:14px 18px}.log-list{gap:12px}.log-card{padding:20px}.action{font-size:16px}.result{font-size:12px}}
</style>
