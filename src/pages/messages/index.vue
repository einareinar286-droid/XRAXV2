<template>
  <AppFrame active="messages">
    <view class="xr-content messages-page"><view class="messages-heading"><view><view class="xr-page-title">消息中心</view><view class="xr-page-copy">交办、临期、逾期、退回和闭环消息均在此留痕。</view></view><view class="unread-count">{{ unread }} 条未读</view></view>
      <view class="xr-card messages-card"><view v-for="item in demoStore.messages" :key="item.id" class="message-row" :class="[{ unread:!item.read }, item.type]" @click="open(item)"><view class="message-indicator"></view><view class="message-body"><view class="message-top"><strong>{{ item.title }}</strong><text>{{ item.time }}</text></view><view class="message-copy">{{ item.copy }}</view><view class="message-link">查看事项 →</view></view></view><view v-if="!demoStore.messages.length" class="xr-empty">当前没有需要处理的消息</view></view>
    </view>
  </AppFrame>
</template>
<script setup>
import { computed } from 'vue'
import AppFrame from '../../components/AppFrame.vue'
import { demoStore } from '../../stores/demo'
const unread = computed(() => demoStore.messages.filter((item) => !item.read).length)
function open(item) { demoStore.markRead(item.id); if (item.issueId) uni.navigateTo({ url: `/pages/issue/detail?id=${item.issueId}` }) }
</script>
<style lang="scss" scoped>
.messages-page{max-width:900px}.messages-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:14rpx;margin:4rpx 0 20rpx}.unread-count{padding:7rpx 11rpx;border-radius:99rpx;background:#e8f0ff;color:#003c90;font-size:18rpx;white-space:nowrap}.messages-card{overflow:hidden}.message-row{position:relative;display:flex;gap:14rpx;padding:19rpx 20rpx;border-bottom:1rpx solid #e9edf1;transition:background .2s ease}.message-row:last-child{border-bottom:0}.message-row.unread{background:#f7faff}.message-row:active{background:#f1f5f9}.message-indicator{width:9rpx;height:9rpx;flex:0 0 9rpx;margin-top:11rpx;border-radius:50%;background:#9da7b5}.unread .message-indicator{background:#0f52ba}.urgent .message-indicator,.overdue .message-indicator{background:#ef4444}.review .message-indicator{background:#f59e0b}.message-body{min-width:0;flex:1}.message-top{display:flex;align-items:baseline;justify-content:space-between;gap:12rpx}.message-top strong{color:#303947;font-size:23rpx}.message-top text{color:#8c96a3;font-size:17rpx;white-space:nowrap}.message-copy{margin-top:6rpx;color:#707b88;font-size:19rpx;line-height:1.55}.message-link{margin-top:10rpx;color:#003c90;font-size:18rpx}@media(min-width:900px){.messages-heading{margin:0 0 16px}.unread-count{padding:5px 8px;font-size:10px}.message-row{gap:10px;padding:14px 16px}.message-indicator{width:7px;height:7px;flex-basis:7px;margin-top:8px}.message-top strong{font-size:13px}.message-top text{font-size:10px}.message-copy{margin-top:4px;font-size:11px}.message-link{margin-top:7px;font-size:10px}}
</style>
