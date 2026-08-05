<template>
  <view>
    <AdaptiveNavigation active="PROFILE" />
    <view class="profile-page">
    <view class="identity"><view class="avatar">{{ currentUser?.displayName?.slice(0,1) || '安' }}</view><view><view class="name">{{ currentUser?.displayName || '加载中' }}</view><view class="sub">{{ issueRoleText(currentUser?.role) }} · {{ currentUser?.department }}</view></view></view>
    <view v-if="isMockIssueMode" class="mock-warning"><view class="warning-title">Mock 演示模式</view><view>身份切换只用于验证权限和流程，不是生产级登录；附件也未上传至私有云存储。</view></view>
    <view v-if="canSwitchMockRole" class="section glass-panel"><view class="section-title">切换 Mock 身份</view><view v-for="item in roles" :key="item.id" class="role-row" :class="{ active:item.id===currentUser?.role }" @click="switchRole(item.id)"><view><view class="role-name">{{ item.name }}</view><view class="role-copy">{{ item.copy }}</view></view><view class="check">{{ item.id===currentUser?.role?'✓':'' }}</view></view></view>
    <view v-if="canViewDutyDashboard" class="section entry glass-panel" @click="openDutyAdmin"><view><view class="section-title">履职仪表盘</view><view class="role-copy">履职率必须 100%；未完成、退回、逾期及逾期补交均进入考核清单。</view></view><view class="arrow">→</view></view>
    <view v-if="canViewDutyDashboard" class="section entry glass-panel" @click="openOperationLogs"><view><view class="section-title">操作日志</view><view class="role-copy">查看关键操作的时间、操作人、对象与结果；日志不保存密码和完整附件地址。</view></view><view class="arrow">→</view></view>
    <view class="section glass-panel"><view class="section-title">Mock 演示边界</view><view class="guide">当前版本用于本地功能验证：未接入真实账号、短信、微信 AppID、私有云附件或生产部署。真实人员数据不在本项目中保存。</view></view>
    <view v-if="isCloudDutyMode()" class="cloud-login-card" @click="openCloudLogin"><view class="cloud-login-icon"><view class="cloud-login-icon-core" /></view><view class="cloud-login-copy"><text class="cloud-login-title">云端登录</text><text class="cloud-login-sub">连接 uniCloud 服务空间 xraxbeta1，使用测试账号登录履职云端</text></view><text class="cloud-login-arrow">→</text></view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getCurrentUser, isMockIssueMode, issueRoleText, setMockRole } from '../../services/issues/index.mjs'
import { setMockRole as setDutyMockRole } from '../../services/duty'
import { isMockRoleSwitcherEnabled } from '../../services/mock-mode.mjs'
import { isCloudDutyMode } from '../../services/duties/mode.mjs'
import AdaptiveNavigation from '../../components/navigation/AdaptiveNavigation.vue'
const currentUser=ref(null)
const canViewDutyDashboard=computed(()=>['SUPER_ADMIN','SAFETY_OFFICER'].includes(currentUser.value?.role))
const canSwitchMockRole=computed(()=>isMockIssueMode && isMockRoleSwitcherEnabled())
const roles=[
  {id:'SUPER_ADMIN',name:'超级管理员',copy:'拥有全公司查看、管理与留痕重开权限'},
  {id:'SAFETY_OFFICER',name:'安全监察部',copy:'全员隐患上报可查看、可交办市场整改并确认闭环；可查看全员履职'},
  {id:'MARKETING_OFFICER',name:'市场营销部',copy:'提交受办隐患整改；履职只可填写和查看本人'},
  {id:'EMPLOYEE',name:'员工',copy:'可随手拍上报隐患、填写本人履职；不能改写其他人员记录'}
]
async function refreshUser(){currentUser.value=await getCurrentUser()}
function switchRole(role){currentUser.value=setMockRole(role);setDutyMockRole(role);uni.showToast({title:'Mock 身份已切换',icon:'none'})}
function openDutyAdmin(){uni.navigateTo({url:'/pages/admin/duty'})}
function openOperationLogs(){uni.navigateTo({url:'/pages/admin/operation-logs'})}
function openCloudLogin(){uni.navigateTo({url:'/pages/login/index'})}
onShow(refreshUser)
</script>

<style lang="scss" scoped>
.profile-page{padding:32rpx 28rpx 60rpx}
.identity{display:flex;align-items:center;gap:20rpx;padding:12rpx 0 28rpx}
.avatar{width:92rpx;height:92rpx;border-radius:22rpx 22rpx 22rpx 5rpx;background:linear-gradient(135deg,#0d1f1f,#102b29);border:1rpx solid rgba(99,247,255,.55);color:$xr-green-bright;display:flex;align-items:center;justify-content:center;font-size:42rpx;font-weight:700;box-shadow:$xr-cyan-glow}
.name{font-size:35rpx;font-weight:700;color:$xr-text}
.sub,.role-copy,.guide{font-size:22rpx;color:$xr-muted;line-height:1.6;margin-top:4rpx}
.mock-warning{padding:24rpx;margin-bottom:20rpx;border:1rpx solid rgba(255,210,138,.35);border-radius:20rpx;background:rgba(255,210,138,.08);color:$xr-amber;font-size:22rpx;line-height:1.6}
.warning-title{font-size:27rpx;font-weight:700;margin-bottom:4rpx}
.section{background:$xr-glass-bg;border:1rpx solid $xr-line;border-radius:24rpx;padding:26rpx;margin-bottom:20rpx}
.section-title{font-size:29rpx;font-weight:700;color:$xr-text;margin-bottom:14rpx}
.role-row{padding:21rpx 0;display:flex;align-items:center;justify-content:space-between;border-top:1rpx solid $xr-line}
.role-name{font-size:27rpx;font-weight:600;color:$xr-text}
.check{flex:0 0 auto;width:40rpx;height:40rpx;margin-left:16rpx;background:rgba(255,255,255,.06);border:1rpx solid $xr-line;border-radius:50%;color:$xr-green-bright;text-align:center;line-height:40rpx;font-weight:700}
.active .check{background:rgba(99,247,255,.2);border-color:rgba(99,247,255,.5);color:$xr-green-bright;box-shadow:$xr-cyan-glow}
.entry{display:flex;align-items:center;justify-content:space-between}
.entry .section-title{margin-bottom:4rpx}
.arrow{font-size:38rpx;color:$xr-green-bright}
.guide{margin:0}
@media (min-width:1200px){.profile-page{max-width:820px;margin:0 0 0 260px;padding:40px 38px}.avatar{width:58px;height:58px;font-size:26px}.name{font-size:24px}.sub,.role-copy,.guide,.mock-warning{font-size:13px}.warning-title,.section-title,.role-name{font-size:17px}.section{padding:24px;border-radius:18px}.role-row{padding:16px 0}.check{width:30px;height:30px;line-height:30px}}

.cloud-login-card{display:flex;align-items:center;gap:18rpx;padding:28rpx 26rpx;margin-bottom:20rpx;border-radius:24rpx;background:linear-gradient(135deg,rgba(0,244,254,.14) 0%,rgba(13,31,31,.85) 100%);border:2rpx solid rgba(0,244,254,.6);box-shadow:0 0 30rpx rgba(99,247,255,.25)}
.cloud-login-icon{width:64rpx;height:64rpx;flex:0 0 auto;border-radius:18rpx;background:rgba(0,244,254,.18);border:1rpx solid rgba(0,244,254,.6);display:flex;align-items:center;justify-content:center}
.cloud-login-icon-core{width:26rpx;height:26rpx;border:4rpx solid $xr-green-bright;border-radius:50%;position:relative}
.cloud-login-icon-core::after{content:'';position:absolute;right:-8rpx;top:1rpx;width:9rpx;height:9rpx;border-radius:50%;background:$xr-green-bright}
.cloud-login-copy{flex:1;min-width:0}
.cloud-login-title,.cloud-login-sub{display:block}
.cloud-login-title{font-size:29rpx;font-weight:700;color:$xr-green-bright}
.cloud-login-sub{margin-top:5rpx;font-size:20rpx;line-height:1.5;color:$xr-muted}
.cloud-login-arrow{font-size:36rpx;color:$xr-green-bright}

</style>
