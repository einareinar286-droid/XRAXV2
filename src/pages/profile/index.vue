<template>
  <view class="profile-page">
    <view class="identity"><view class="avatar">{{ currentUser?.displayName?.slice(0,1) || '安' }}</view><view><view class="name">{{ currentUser?.displayName || '加载中' }}</view><view class="sub">{{ issueRoleText(currentUser?.role) }} · {{ currentUser?.department }}</view></view></view>
    <view v-if="isMockIssueMode" class="mock-warning"><view class="warning-title">Mock 演示模式</view><view>身份切换只用于验证权限和流程，不是生产级登录；附件也未上传至私有云存储。</view></view>
    <view v-if="isMockIssueMode" class="section"><view class="section-title">切换 Mock 身份</view><view v-for="item in roles" :key="item.id" class="role-row" :class="{ active:item.id===currentUser?.role }" @click="switchRole(item.id)"><view><view class="role-name">{{ item.name }}</view><view class="role-copy">{{ item.copy }}</view></view><view class="check">{{ item.id===currentUser?.role?'✓':'' }}</view></view></view>
    <view v-if="currentUser?.role==='SAFETY_ADMIN'" class="section entry" @click="openDutyAdmin"><view><view class="section-title">安全履职总览</view><view class="role-copy">原履职模块入口保持不变，仅安全监察管理员可进入。</view></view><view class="arrow">→</view></view>
    <view class="section"><view class="section-title">M1 边界说明</view><view class="guide">本版本只提供可测试的前端 Mock 闭环。角色、部门和操作者由当前 Mock 会话决定，页面传入的伪造身份不会生效；真实账号、uniCloud 隐患部署、私有附件和生产级鉴权不在 M1 范围。</view></view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getCurrentUser, isMockIssueMode, issueRoleText, setMockRole } from '../../services/issues/index.mjs'
const currentUser=ref(null)
const roles=[
  {id:'SAFETY_INSPECTOR',name:'安全巡检/复核员',copy:'上报、交办、复核与退回；不能重开已闭环隐患'},
  {id:'SAFETY_ADMIN',name:'安全监察管理员',copy:'拥有安全侧权限，并可留痕重开已闭环隐患'},
  {id:'MARKETING_RECTIFIER',name:'市场整改员',copy:'只读取受办范围并提交整改佐证'},
  {id:'EXECUTIVE_READONLY',name:'高管只读用户',copy:'只读查看范围内进度，所有写接口均被拒绝'}
]
async function refreshUser(){currentUser.value=await getCurrentUser()}
function switchRole(role){currentUser.value=setMockRole(role);uni.showToast({title:'Mock 身份已切换',icon:'none'})}
function openDutyAdmin(){uni.navigateTo({url:'/pages/admin/duty'})}
onShow(refreshUser)
</script>

<style lang="scss" scoped>
.profile-page{padding:32rpx 28rpx 60rpx}.identity{display:flex;align-items:center;gap:20rpx;padding:12rpx 0 28rpx}.avatar{width:92rpx;height:92rpx;border-radius:22rpx 22rpx 22rpx 5rpx;background:#006e55;color:#fff;display:flex;align-items:center;justify-content:center;font-size:42rpx;font-weight:700}.name{font-size:35rpx;font-weight:700}.sub,.role-copy,.guide{font-size:22rpx;color:#728079;line-height:1.6;margin-top:4rpx}.mock-warning{padding:24rpx;margin-bottom:20rpx;border:1rpx solid #ecd893;border-radius:20rpx;background:#fff8df;color:#765d14;font-size:22rpx;line-height:1.6}.warning-title{font-size:27rpx;font-weight:700;margin-bottom:4rpx}.section{background:#fff;border:1rpx solid #e0e8e3;border-radius:24rpx;padding:26rpx;margin-bottom:20rpx}.section-title{font-size:29rpx;font-weight:700;margin-bottom:14rpx}.role-row{padding:21rpx 0;display:flex;align-items:center;justify-content:space-between;border-top:1rpx solid #edf1ef}.role-name{font-size:27rpx;font-weight:600}.check{flex:0 0 auto;width:40rpx;height:40rpx;margin-left:16rpx;background:#eef3f1;border-radius:50%;color:#006e55;text-align:center;line-height:40rpx;font-weight:700}.active .check{background:#006e55;color:#fff}.entry{display:flex;align-items:center;justify-content:space-between}.entry .section-title{margin-bottom:4rpx}.arrow{font-size:38rpx;color:#006e55}.guide{margin:0}
</style>
