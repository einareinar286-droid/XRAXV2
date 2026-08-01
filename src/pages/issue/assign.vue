<template>
  <AppFrame active="issues">
    <view class="assign-page xr-content">
      <view v-if="issue && allowed" class="assign-card xr-card">
        <view class="assign-header"><view><view class="xr-page-title">安监交办</view><view class="xr-page-copy">下达市场营销部整改任务</view></view><text class="close" @click="back">×</text></view>
        <view class="assign-issue"><text>关联隐患</text><strong>{{ issue.id }} · {{ issue.title }}</strong></view>
        <view class="assign-grid"><view class="field"><text class="xr-field-label">责任部门</text><view class="xr-select">市场营销部</view></view><view class="field"><text class="xr-field-label">责任人</text><view class="xr-select">市场整改员</view></view></view>
        <view class="field"><text class="xr-field-label">整改期限 <text class="required">*</text></text><picker mode="date" :value="form.deadline" @change="form.deadline=$event.detail.value"><view class="xr-select">{{ form.deadline }} <text>⌄</text></view></picker></view>
        <view class="field"><text class="xr-field-label">交办要求</text><textarea v-model="form.requirement" class="xr-textarea" placeholder="填写整改要求、复核标准和需要留存的佐证材料"/></view>
        <view class="assign-footer"><label class="public-summary"><checkbox :checked="form.public" color="#003C90" @click="form.public=!form.public"/> 公开处理摘要</label><view><button class="cancel" @click="back">取消</button><button class="xr-btn xr-btn-primary" @click="submit">确认交办</button></view></view>
      </view>
      <view v-else-if="issue" class="xr-empty">无交办权限，已返回可访问范围。</view><view v-else class="xr-empty">未找到待交办隐患</view>
    </view>
  </AppFrame>
</template>
<script setup>
import { computed, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import AppFrame from '../../components/AppFrame.vue'
import { demoStore } from '../../stores/demo'
let id = ''
const issue = computed(() => demoStore.issues.find((item) => item.id === id))
const allowed = computed(() => demoStore.can('issue-assign', issue.value))
const form = reactive({ deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), requirement: '请在期限内完成整改，上传整改前后照片及文字说明，提交安全监察部复核。', public: true })
onLoad((options) => { id = options.id })
function back() { uni.navigateBack({ delta: 1, fail: () => uni.switchTab({ url: '/pages/index/index' }) }) }
function submit() { if (!allowed.value) return; demoStore.assignIssue(id, { assignee: '市场整改员', assigneeDept: '市场营销部', deadline: form.deadline }); uni.showToast({ title: '交办单已下达', icon: 'success' }); setTimeout(back, 450) }
</script>
<style lang="scss" scoped>
.assign-page{max-width:720px}.assign-card{padding:26rpx}.assign-header{display:flex;justify-content:space-between;align-items:flex-start}.close{width:40rpx;height:40rpx;display:flex;align-items:center;justify-content:center;border-radius:50%;color:#7d8998;font-size:31rpx}.assign-issue{margin-top:22rpx;padding:15rpx;border-radius:8rpx;background:#f5f7fa}.assign-issue text,.assign-issue strong{display:block}.assign-issue text{color:#84909e;font-size:18rpx}.assign-issue strong{margin-top:5rpx;color:#374352;font-size:21rpx}.assign-grid{display:grid;gap:16rpx}.field{margin-top:18rpx}.required{color:#ef4444}.assign-footer{display:flex;flex-direction:column;gap:16rpx;margin-top:25rpx}.assign-footer>view{display:flex;justify-content:flex-end;gap:14rpx}.public-summary{color:#697686;font-size:19rpx}.cancel{padding:0 8rpx;color:#6d7887;font-size:20rpx}@media(min-width:900px){.assign-card{padding:22px}.close{width:26px;height:26px;font-size:20px}.assign-issue{margin-top:16px;padding:11px}.assign-issue text{font-size:10px}.assign-issue strong{margin-top:4px;font-size:12px}.assign-grid{grid-template-columns:1fr 1fr;gap:12px}.field{margin-top:15px}.assign-footer{flex-direction:row;align-items:center;justify-content:space-between;gap:12px;margin-top:20px}.public-summary{font-size:11px}.cancel{font-size:11px}}
</style>
