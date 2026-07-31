<template>
  <DesktopSidebar active="messages"/><view class="page xr-desktop-page"><view class="head"><view><view class="eyebrow">系统内提醒</view><view class="title">消息中心</view></view><view class="count">{{ unread }} 未读</view></view>
    <view class="tip">临期、逾期、交办、退回和闭环均在此留痕。生产环境由服务端根据权限分发。</view>
    <view v-for="item in demoStore.messages" :key="item.id" class="message" :class="[{ unread:!item.read }, item.type]" @click="open(item)"><view class="message-top"><view class="message-title">{{ item.title }}</view><view class="time">{{ item.time }}</view></view><view class="copy">{{ item.copy }}</view><view class="go">查看事项 ›</view></view>
    <view v-if="!demoStore.messages.length" class="empty">当前没有需要处理的消息</view>
  </view>
</template>
<script setup>
import { computed } from 'vue'
import { demoStore } from '../../stores/demo'
import DesktopSidebar from '../../components/DesktopSidebar.vue'
const unread=computed(()=>demoStore.messages.filter(x=>!x.read).length)
function open(item){demoStore.markRead(item.id); if(item.issueId) uni.navigateTo({url:`/pages/issue/detail?id=${item.issueId}`})}
</script>
<style lang="scss" scoped>
.page{padding:32rpx 28rpx 64rpx;max-width:1240px;margin:auto}.head{display:flex;align-items:flex-end;justify-content:space-between;margin:12rpx 0 22rpx}.eyebrow{font-size:20rpx;letter-spacing:3rpx;color:#9f2349}.title{font-size:44rpx;font-weight:750;letter-spacing:-1rpx}.count{font-size:22rpx;color:#9f2349;background:#f8e8ed;padding:9rpx 14rpx;border-radius:10rpx}.tip{font-size:23rpx;color:#756c6b;line-height:1.65;background:#fff8f8;border-left:6rpx solid #9f2349;padding:20rpx 22rpx;margin-bottom:20rpx}.message{background:#fffcfa;border-bottom:1rpx solid #e8dfdc;padding:26rpx 24rpx;transition:transform .2s ease}.message:active{transform:scale(.99)}.message.unread{box-shadow:inset 6rpx 0 #9f2349}.message-top{display:flex;justify-content:space-between;gap:18rpx}.message-title{font-size:29rpx;font-weight:680}.time,.copy{font-size:22rpx;color:#756c6b}.copy{margin-top:10rpx;line-height:1.55}.go{margin-top:16rpx;font-size:22rpx;color:#9f2349}.urgent .message-title,.overdue .message-title{color:#b62e2b}.empty{text-align:center;padding:110rpx 0;color:#8f8582}
</style>
