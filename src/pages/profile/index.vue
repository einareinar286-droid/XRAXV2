<template>
  <view>
    <AdaptiveNavigation active="PROFILE" />
    <view class="profile-page">
    <view class="identity"><view class="avatar">{{ currentUser?.displayName?.slice(0,1) || '安' }}</view><view><view class="name">{{ currentUser?.displayName || '加载中' }}</view><view class="sub">{{ issueRoleText(currentUser?.role) }} · {{ currentUser?.department }}</view></view></view>
    <view v-if="isMockIssueMode" class="mock-warning"><view class="warning-title">Mock 演示模式</view><view>身份切换只用于验证权限和流程，不是生产级登录；附件也未上传至私有云存储。</view></view>
    <view v-if="canSwitchMockRole" class="section"><view class="section-title">切换 Mock 身份</view><view v-for="item in roles" :key="item.id" class="role-row" :class="{ active:item.id===currentUser?.role }" @click="switchRole(item.id)"><view><view class="role-name">{{ item.name }}</view><view class="role-copy">{{ item.copy }}</view></view><view class="check">{{ item.id===currentUser?.role?'✓':'' }}</view></view></view>
    <view v-if="canViewDutyDashboard" class="section entry" @click="openDutyAdmin"><view><view class="section-title">履职仪表盘</view><view class="role-copy">履职率必须 100%；未完成、退回、逾期及逾期补交均进入考核清单。</view></view><view class="arrow">→</view></view>
    <view class="section"><view class="section-title">Mock 演示边界</view><view class="guide">当前版本用于本地功能验证：未接入真实账号、短信、微信 AppID、私有云附件或生产部署。真实人员数据不在本项目中保存。</view></view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getCurrentUser, isMockIssueMode, issueRoleText, setMockRole } from '../../services/issues/index.mjs'
import { setMockRole as setDutyMockRole } from '../../services/duty'
import { isMockRoleSwitcherEnabled } from '../../services/mock-mode.mjs'
import AdaptiveNavigation from '../../components/navigation/AdaptiveNavigation.vue'
const currentUser=ref(null)
const canViewDutyDashboard=computed(()=>['SUPER_ADMIN','SAFETY_OFFICER','MARKETING_OFFICER'].includes(currentUser.value?.role))
const canSwitchMockRole=computed(()=>isMockIssueMode && isMockRoleSwitcherEnabled() && currentUser.value?.role==='SUPER_ADMIN')
const roles=[
  {id:'SUPER_ADMIN',name:'超级管理员',copy:'拥有全公司查看、管理与留痕重开权限'},
  {id:'SAFETY_OFFICER',name:'安全监察部',copy:'全员隐患上报可查看、可交办市场整改并确认闭环；履职仅审核本部门'},
  {id:'MARKETING_OFFICER',name:'市场营销部',copy:'提交受办隐患整改，审核本部门履职'},
  {id:'EMPLOYEE',name:'员工',copy:'可随手拍上报隐患、填写本人履职；不能改写其他人员记录'}
]
async function refreshUser(){currentUser.value=await getCurrentUser()}
function switchRole(role){currentUser.value=setMockRole(role);setDutyMockRole(role);uni.showToast({title:'Mock 身份已切换',icon:'none'})}
function openDutyAdmin(){uni.navigateTo({url:'/pages/admin/duty'})}
onShow(refreshUser)
</script>

<style lang="scss" scoped>
.profile-page{padding:32rpx 28rpx 60rpx}.identity{display:flex;align-items:center;gap:20rpx;padding:12rpx 0 28rpx}.avatar{width:92rpx;height:92rpx;border-radius:22rpx 22rpx 22rpx 5rpx;background:#006e55;color:#fff;display:flex;align-items:center;justify-content:center;font-size:42rpx;font-weight:700}.name{font-size:35rpx;font-weight:700}.sub,.role-copy,.guide{font-size:22rpx;color:#728079;line-height:1.6;margin-top:4rpx}.mock-warning{padding:24rpx;margin-bottom:20rpx;border:1rpx solid #ecd893;border-radius:20rpx;background:#fff8df;color:#765d14;font-size:22rpx;line-height:1.6}.warning-title{font-size:27rpx;font-weight:700;margin-bottom:4rpx}.section{background:#fff;border:1rpx solid #e0e8e3;border-radius:24rpx;padding:26rpx;margin-bottom:20rpx}.section-title{font-size:29rpx;font-weight:700;margin-bottom:14rpx}.role-row{padding:21rpx 0;display:flex;align-items:center;justify-content:space-between;border-top:1rpx solid #edf1ef}.role-name{font-size:27rpx;font-weight:600}.check{flex:0 0 auto;width:40rpx;height:40rpx;margin-left:16rpx;background:#eef3f1;border-radius:50%;color:#006e55;text-align:center;line-height:40rpx;font-weight:700}.active .check{background:#006e55;color:#fff}.entry{display:flex;align-items:center;justify-content:space-between}.entry .section-title{margin-bottom:4rpx}.arrow{font-size:38rpx;color:#006e55}.guide{margin:0}@media (min-width:1200px){.profile-page{max-width:820px;margin:0 0 0 260px;padding:40px 38px}.avatar{width:58px;height:58px;font-size:26px}.name{font-size:24px}.sub,.role-copy,.guide,.mock-warning{font-size:13px}.warning-title,.section-title,.role-name{font-size:17px}.section{padding:24px;border-radius:18px}.role-row{padding:16px 0}.check{width:30px;height:30px;line-height:30px}}
</style>
