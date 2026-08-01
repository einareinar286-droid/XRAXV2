<template>
  <AppFrame active="inspection">
    <view class="xr-content admin-page"><view class="admin-heading"><view><view class="xr-page-title">真实情况抽查</view><view class="xr-page-copy">抽查记录可关联既有隐患，发现问题后进入整改闭环。</view></view><button v-if="allowed" class="xr-btn xr-btn-primary">+ 新建抽查</button></view>
      <view v-if="!allowed" class="xr-empty">无抽查管理权限</view><template v-else><view class="stat-grid"><view class="xr-card stat"><text>18</text><span>本月计划</span></view><view class="xr-card stat"><text>12</text><span>已完成</span></view><view class="xr-card stat danger"><text>3</text><span>发现问题</span></view></view><view class="xr-card inspect-card"><view class="inspect-title"><view class="xr-section-title">抽查计划与记录</view><view class="xr-filter">本月 ⌄</view></view><view v-for="row in rows" :key="row.id" class="inspect-row"><view><view class="inspect-row-head"><strong>{{ row.title }}</strong><view class="xr-status" :class="row.status==='已完成'?'xr-status-review':'xr-status-warning'">{{ row.status }}</view></view><view class="inspect-meta">{{ row.area }} · 抽查人 {{ row.inspector }} · {{ row.date }}</view><view class="inspect-link">{{ row.issue ? `已关联整改单 ${row.issue}` : '未发现需交办问题' }}</view></view><text>›</text></view></view></template>
    </view>
  </AppFrame>
</template>
<script setup>
import { computed } from 'vue'
import AppFrame from '../../components/AppFrame.vue'
import { demoStore } from '../../stores/demo'
const allowed = computed(() => demoStore.can('admin'))
const rows = [{ id: 1, status: '已完成', date: '2026-07-31', title: '配送作业现场抽查', area: '铜山区大学路线路', inspector: '安监专员', issue: 'XR-20260730-014' }, { id: 2, status: '待执行', date: '2026-08-02', title: '餐饮用户整改回访', area: '云龙区和平路', inspector: '安监管理员', issue: 'XR-20260731-001' }]
</script>
<style lang="scss" scoped>
.admin-page{max-width:1040px}.admin-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:14rpx;margin:4rpx 0 20rpx}.stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12rpx}.stat{padding:20rpx}.stat text,.stat span{display:block}.stat text{color:#27313e;font-size:37rpx;font-weight:750}.stat span{margin-top:4rpx;color:#7f8a97;font-size:18rpx}.stat.danger text{color:#ef4444}.inspect-card{margin-top:16rpx;padding:20rpx}.inspect-title{display:flex;justify-content:space-between;align-items:center}.inspect-row{display:flex;align-items:center;justify-content:space-between;gap:12rpx;padding:16rpx 0;border-top:1rpx solid #edf0f3}.inspect-row:first-of-type{margin-top:9rpx}.inspect-row>view{min-width:0;flex:1}.inspect-row-head{display:flex;align-items:center;gap:9rpx}.inspect-row strong{color:#374250;font-size:21rpx}.inspect-meta,.inspect-link{margin-top:5rpx;color:#808b97;font-size:18rpx}.inspect-link{color:#003c90}@media(min-width:900px){.admin-heading{margin:0 0 16px}.stat-grid{gap:10px}.stat{padding:16px}.stat text{font-size:27px}.stat span{font-size:10px}.inspect-card{margin-top:14px;padding:16px}.inspect-row{gap:10px;padding:12px 0}.inspect-row strong{font-size:12px}.inspect-meta,.inspect-link{margin-top:4px;font-size:10px}}
</style>
