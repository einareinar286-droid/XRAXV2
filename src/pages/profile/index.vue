<template>
  <view class="profile-page">
    <view class="identity"><view class="avatar">安</view><view><view class="name">演示账号</view><view class="sub">{{ roleNames[demoStore.role] }} · 权限模拟</view></view></view>
    <view class="section"><view class="section-title">切换演示身份</view><view v-for="item in roles" :key="item.id" class="role-row" :class="{ active:item.id===demoStore.role }" @click="demoStore.setRole(item.id)"><view><view class="role-name">{{ item.name }}</view><view class="role-copy">{{ item.copy }}</view></view><view class="check">{{ item.id===demoStore.role?'✓':'' }}</view></view></view>
    <view v-if="demoStore.role==='safety'" class="section entry" @click="openDutyAdmin"><view><view class="section-title">安全履职总览</view><view class="role-copy">筛选所有人员、部门、周期和完成状态</view></view><view class="arrow">→</view></view>
    <view class="section"><view class="section-title">生产版权限说明</view><view class="guide">正式接入 uni-id 后，员工只能查询和提交自己名下的履职周期；安全监察部管理员可查看全员数据。任务不提供删除接口，每次提交都保留审计记录。</view></view>
  </view>
</template>
<script setup>
import { demoStore, roleNames } from '../../stores/demo'
const roles=[{id:'safety',name:'安全监察部',copy:'查看全部隐患、复核闭环、查看履职总览'},{id:'marketing',name:'市场营销部',copy:'接收交办、提交整改佐证'},{id:'executive',name:'高管查看',copy:'只读查看重点隐患与进度'}]
function openDutyAdmin(){uni.navigateTo({url:'/pages/admin/duty'})}
</script>
<style lang="scss" scoped>
.profile-page{padding:32rpx 28rpx}.identity{display:flex;align-items:center;gap:20rpx;padding:12rpx 0 38rpx}.avatar{width:92rpx;height:92rpx;border-radius:22rpx 22rpx 22rpx 5rpx;background:#006e55;color:#fff;display:flex;align-items:center;justify-content:center;font-size:42rpx;font-weight:700}.name{font-size:35rpx;font-weight:700}.sub,.role-copy,.guide{font-size:22rpx;color:#728079;line-height:1.6;margin-top:4rpx}.section{background:#fff;border:1rpx solid #e0e8e3;border-radius:24rpx;padding:26rpx;margin-bottom:20rpx}.section-title{font-size:29rpx;font-weight:700;margin-bottom:14rpx}.role-row{padding:21rpx 0;display:flex;align-items:center;justify-content:space-between;border-top:1rpx solid #edf1ef}.role-name{font-size:27rpx;font-weight:600}.check{width:40rpx;height:40rpx;background:#eef3f1;border-radius:50%;color:#006e55;text-align:center;line-height:40rpx;font-weight:700}.active .check{background:#006e55;color:#fff}.entry{display:flex;align-items:center;justify-content:space-between}.arrow{font-size:38rpx;color:#006e55}.guide{margin:0}
</style>
