<template>
  <view>
    <AdaptiveNavigation active="ASSIGN" />
    <view class="page">
      <view class="heading"><text class="title">隐患交办</text><text class="copy">待交办隐患由安全监察部或超级管理员交办至市场营销部整改。</text></view>
      <view v-if="loading" class="state">正在加载待交办事项…</view>
      <view v-else-if="error" class="state error">{{ error }}</view>
      <view v-else-if="items.length" class="list"><view v-for="item in items" :key="item.id" class="card" @click="openIssue(item.id)"><view><text class="tag">待交办</text><text class="name">{{ item.title }}</text><text class="meta">{{ item.departmentScope?.[0] || item.reporter?.department || '未标注部门' }} · {{ item.isMajor ? '重大隐患' : item.severity }}</text></view><text class="arrow">→</text></view></view>
      <view v-else class="state">当前没有待交办隐患</view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getCurrentUser, listIssues } from '../../services/issues/index.mjs'
import AdaptiveNavigation from '../../components/navigation/AdaptiveNavigation.vue'

const loading = ref(true)
const error = ref('')
const items = ref([])
async function load() {
  loading.value = true; error.value = ''
  try {
    const user = await getCurrentUser()
    if (!['SUPER_ADMIN', 'SAFETY_OFFICER'].includes(user.role)) throw new Error('当前角色不能处理隐患交办')
    items.value = (await listIssues({ status: 'REPORTED', page: 1, pageSize: 100 })).items
  } catch (err) { items.value = []; error.value = err.message || '待交办事项加载失败' } finally { loading.value = false }
}
function openIssue(id) { uni.navigateTo({ url: `/pages/issue/detail?id=${id}` }) }
onShow(load)
</script>

<style lang="scss" scoped>
.page{min-height:100vh;padding:30rpx 28rpx;background:$xr-canvas}.heading{margin:14rpx 0 24rpx}.title{display:block;font-size:42rpx;font-weight:760;color:$xr-text}.copy{display:block;margin-top:8rpx;font-size:22rpx;line-height:1.6;color:$xr-muted}.list{display:flex;flex-direction:column;gap:16rpx}.card{display:flex;align-items:center;justify-content:space-between;gap:18rpx;padding:24rpx;border:1rpx solid $xr-line;border-radius:20rpx;background:$xr-surface}.tag,.name,.meta{display:block}.tag{width:max-content;padding:4rpx 10rpx;border-radius:8rpx;background:#fff2e9;color:#a65400;font-size:19rpx}.name{margin-top:12rpx;font-size:28rpx;font-weight:700;color:$xr-text}.meta{margin-top:7rpx;font-size:21rpx;color:$xr-muted}.arrow{font-size:34rpx;color:$xr-green}.state{padding:100rpx 30rpx;text-align:center;color:$xr-muted}.state.error{color:$xr-red}@media (min-width:1200px){.page{max-width:1120px;margin-left:260px;padding:36px 32px}.title{font-size:30px}.copy,.meta{font-size:13px}.card{padding:20px}.tag{font-size:12px}.name{font-size:17px}}
</style>
