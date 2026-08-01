<template>
  <AppFrame active="templates">
    <view class="xr-content template-page"><view class="template-heading"><view><view class="xr-page-title">检查表模板</view><view class="xr-page-copy">更新模板只影响后续周期；历史履职记录保留原始版本。</view></view><button v-if="allowed" class="xr-btn xr-btn-primary">+ 新建模板</button></view>
      <view v-if="!allowed" class="xr-empty">无模板管理权限</view><template v-else><view class="xr-card template-card"><view class="template-toolbar"><view class="xr-section-title">模板清单</view><view class="xr-filter">全部分类 ⌄</view></view><view v-for="item in templates" :key="item.name" class="template-row"><view class="template-icon">▤</view><view class="template-body"><strong>{{ item.name }}</strong><text>{{ item.category }} · {{ item.frequency }} · 适用 {{ item.target }}</text></view><view class="xr-status" :class="item.enabled?'xr-status-review':'xr-status-muted'">{{ item.enabled ? '启用' : '停用' }}</view><text>›</text></view></view><view class="reserved-card"><view class="xr-section-title">送气工画像接口预留</view><view>已预留关码次数、严重度、A/B/C 分级、60 天滚动降级与网格长字段；首版不开放页面。</view></view></template>
    </view>
  </AppFrame>
</template>
<script setup>
import { computed } from 'vue'
import AppFrame from '../../components/AppFrame.vue'
import { demoStore } from '../../stores/demo'
const allowed = computed(() => demoStore.can('admin'))
const templates = [{ name: '每周安全检查', category: '安全检查', frequency: '每周', target: '全员', enabled: true }, { name: '每月线下抽查', category: '线下抽查', frequency: '每月', target: '安监部', enabled: true }, { name: '季度安全宣教', category: '安全宣教', frequency: '每季度', target: '各部门', enabled: false }]
</script>
<style lang="scss" scoped>
.template-page{max-width:1040px}.template-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:14rpx;margin:4rpx 0 20rpx}.template-card{padding:20rpx}.template-toolbar{display:flex;align-items:center;justify-content:space-between}.template-row{display:flex;align-items:center;gap:12rpx;padding:16rpx 0;border-top:1rpx solid #edf0f3}.template-row:first-of-type{margin-top:9rpx}.template-icon{width:37rpx;height:37rpx;display:flex;align-items:center;justify-content:center;border-radius:8rpx;background:#e8f0ff;color:#003c90;font-size:20rpx}.template-body{min-width:0;flex:1}.template-body strong,.template-body text{display:block}.template-body strong{color:#394452;font-size:21rpx}.template-body text{margin-top:4rpx;color:#818c99;font-size:18rpx}.reserved-card{margin-top:16rpx;padding:20rpx;border-left:5rpx solid #0f52ba;border-radius:8rpx;background:#f2f7ff;color:#65717e;font-size:19rpx;line-height:1.65}.reserved-card .xr-section-title{margin-bottom:7rpx;color:#003c90}@media(min-width:900px){.template-heading{margin:0 0 16px}.template-card{padding:16px}.template-row{gap:10px;padding:12px 0}.template-icon{width:28px;height:28px;border-radius:6px;font-size:14px}.template-body strong{font-size:12px}.template-body text{margin-top:3px;font-size:10px}.reserved-card{margin-top:14px;padding:16px;font-size:11px}}
</style>
