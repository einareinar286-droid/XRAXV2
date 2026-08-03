<template>
  <view class="lifecycle-path" :class="{ 'is-major': isMajor }">
    <view class="path-header">
      <text class="path-title">闭环路径</text>
      <text class="path-current">当前步骤：{{ summary.currentLabel }}</text>
    </view>

    <view class="path-track">
      <view v-for="step in steps" :key="step.key" class="path-step" :class="[`is-${step.state}`, { 'is-returned': step.returned }]">
        <view class="path-node"><view class="path-node-core" /></view>
        <view class="path-copy">
          <text class="path-label">{{ step.label }}</text>
          <text v-if="step.returned" class="path-returned">退回整改</text>
        </view>
      </view>
    </view>

    <view class="path-summary">
      <text class="path-summary-label">下一步</text>
      <text class="path-summary-value">{{ summary.nextLabel }}</text>
      <text v-if="deadline" class="path-deadline">整改期限：{{ deadline }}</text>
      <text v-if="reviewReason && status === 'REJECTED'" class="path-reason">退回原因：{{ reviewReason }}</text>
      <text v-else class="path-hint">{{ summary.hint }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { buildIssueLifecycle, getIssueStageSummary } from '../../domain/issues/presentation.mjs'

const props = defineProps({
  status: { type: String, required: true },
  deadline: { type: String, default: '' },
  isMajor: { type: Boolean, default: false },
  reviewReason: { type: String, default: '' }
})

const steps = computed(() => buildIssueLifecycle(props.status))
const summary = computed(() => getIssueStageSummary(props.status))
</script>

<style lang="scss" scoped>
.lifecycle-path{background:$xr-surface;border:1rpx solid $xr-line;border-radius:24rpx;padding:26rpx;box-sizing:border-box}.path-header{display:flex;align-items:baseline;justify-content:space-between;gap:16rpx;margin-bottom:26rpx}.path-title{font-size:30rpx;font-weight:700;color:$xr-text}.path-current{font-size:21rpx;color:$xr-green}.path-track{display:flex;align-items:flex-start;overflow:hidden}.path-step{position:relative;flex:1 1 0;display:flex;flex-direction:column;align-items:center;min-width:0}.path-step:not(:last-child)::after{content:'';position:absolute;left:calc(50% + 24rpx);top:20rpx;width:calc(100% - 48rpx);height:2rpx;background:$xr-line-strong}.path-node{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;width:42rpx;height:42rpx;border:4rpx solid $xr-line-strong;border-radius:50%;background:$xr-surface;box-sizing:border-box}.path-node-core{width:12rpx;height:12rpx;border-radius:50%;background:transparent}.path-copy{display:flex;flex-direction:column;align-items:center;min-width:0;margin-top:12rpx}.path-label{font-size:21rpx;line-height:1.35;color:$xr-muted;white-space:nowrap}.path-returned{margin-top:6rpx;padding:3rpx 8rpx;border-radius:8rpx;background:#fff0ee;color:$xr-red;font-size:17rpx;white-space:nowrap}.is-completed .path-node{border-color:$xr-green;background:$xr-green}.is-completed .path-node-core{background:$xr-surface}.is-completed .path-label{color:$xr-text}.is-completed:not(:last-child)::after{background:$xr-green}.is-current .path-node{border-color:$xr-green-bright;background:$xr-surface;box-shadow:0 0 0 8rpx rgba(40,200,155,.15)}.is-current .path-node-core{background:$xr-green-bright}.is-current .path-label{color:$xr-green;font-weight:700}.is-returned .path-node{border-color:$xr-red}.is-returned .path-node-core{background:$xr-red}.path-summary{margin-top:26rpx;padding:18rpx 20rpx;border-radius:16rpx;background:#eef5f1;display:flex;flex-wrap:wrap;gap:8rpx 14rpx;align-items:baseline}.path-summary-label{font-size:21rpx;color:$xr-muted}.path-summary-value{font-size:24rpx;font-weight:700;color:$xr-text}.path-deadline,.path-hint,.path-reason{width:100%;font-size:21rpx;line-height:1.55;color:$xr-muted}.path-reason{color:$xr-red}.is-major .path-summary{background:#fff5f4}@media (min-width:1200px){.lifecycle-path{height:100%;min-height:500px;padding:28px 24px}.path-header{display:block;margin-bottom:32px}.path-current{display:block;margin-top:7px;font-size:13px}.path-track{display:block}.path-step{width:100%;min-height:66px;display:flex;flex-direction:row;align-items:flex-start;text-align:left}.path-step:not(:last-child)::after{left:19px;top:42px;width:2px;height:32px}.path-node{flex:0 0 auto;width:38px;height:38px;border-width:3px}.path-copy{align-items:flex-start;margin:7px 0 0 14px}.path-label{font-size:14px}.path-returned{font-size:11px}.path-summary{margin-top:18px;display:block}.path-summary-label{display:block;font-size:12px}.path-summary-value{display:block;margin-top:4px;font-size:16px}.path-deadline,.path-hint,.path-reason{display:block;margin-top:10px;font-size:12px}}
@media (prefers-reduced-motion:no-preference){.is-current .path-node{animation:path-current-in 220ms ease-out both}@keyframes path-current-in{from{opacity:.6;transform:scale(.84)}to{opacity:1;transform:scale(1)}}}
</style>
