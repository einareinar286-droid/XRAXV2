<template>
  <view>
    <AdaptiveNavigation active="DUTY" />
    <view class="page">
    <view class="heading"><text class="title">我的安全履职</text><text class="copy">只有按时提交并审核通过才计入履职率；退回、逾期和未提交均会进入考核。</text></view>
    <view v-if="loading" class="state">正在加载本期任务…</view>
    <view v-else-if="error" class="state error"><text>{{ error }}</text><button @click="load">重新加载</button></view>
    <template v-else>
      <view v-for="task in tasks" :key="task.id" class="task" @click="open(task.id)"><view class="task-top"><text class="status" :class="task.status.toLowerCase()">{{ dutyStatusText(task.status) }}</text><text class="due">截止 {{ task.dueDate }}</text></view><text class="task-title">{{ task.title }}</text><text class="task-meta">{{ task.periodType ? periodLabel(task.periodType) + ' · ' + task.cycleStart + ' 至 ' + task.cycleEnd : (task.category || '履职任务') + ' · ' + (task.frequency || '本期') }}</text><text v-if="task.status==='RETURNED'" class="return-note">审核退回，请补充后重新提交</text><text v-else-if="task.status==='SUBMITTED'" class="return-note pending">已提交，等待审核</text></view>
      <view v-if="!tasks.length" class="state">本期暂无分配给你的履职任务</view>
    </template>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { dutyStatusText, listMyDuties } from '../../services/duty'
import { PERIOD_TYPE_LABELS } from '../../domain/duties/periods.mjs'
import AdaptiveNavigation from '../../components/navigation/AdaptiveNavigation.vue'

const tasks = ref([])
function periodLabel(type) { return PERIOD_TYPE_LABELS[type] || type }
const loading = ref(true)
const error = ref('')
async function load(){loading.value=true;error.value='';try{tasks.value=await listMyDuties()}catch(err){error.value=err.message||'履职任务加载失败'}finally{loading.value=false}}
function open(id){uni.navigateTo({url:`/pages/duty/record?id=${id}`})}
onShow(load)
</script>

<style lang="scss" scoped>
.page{min-height:100vh;padding:30rpx 28rpx 64rpx;background:$xr-canvas}.heading{margin:14rpx 0 24rpx}.title{display:block;font-size:42rpx;font-weight:760;color:$xr-text}.copy{display:block;margin-top:8rpx;font-size:22rpx;line-height:1.6;color:$xr-muted}.task{margin-top:16rpx;padding:25rpx;border-radius:20rpx;background:$xr-surface;border:1rpx solid $xr-line}.task-top{display:flex;justify-content:space-between;align-items:center;gap:16rpx}.status{padding:6rpx 10rpx;border-radius:8rpx;background:#edf3f0;color:$xr-green;font-size:20rpx}.status.submitted{background:#e8f0ff;color:#245eb4}.status.returned{background:#fff0ee;color:$xr-red}.due,.task-meta{font-size:20rpx;color:$xr-muted}.task-title{display:block;margin:18rpx 0 7rpx;font-size:29rpx;font-weight:700;color:$xr-text}.return-note{display:block;margin-top:14rpx;font-size:21rpx;color:$xr-red}.return-note.pending{color:#245eb4}.state{padding:72rpx 24rpx;text-align:center;color:$xr-muted}.state.error{color:$xr-red}.state button{margin-top:18rpx;background:#e7f2ed;color:$xr-green;font-size:23rpx}@media (min-width:1200px){.page{max-width:820px;margin:0 0 0 260px;padding:36px 32px}.title{font-size:30px}.copy,.due,.task-meta,.return-note{font-size:13px}.task{padding:22px}.task-title{font-size:19px}.status{font-size:12px}}
</style>
