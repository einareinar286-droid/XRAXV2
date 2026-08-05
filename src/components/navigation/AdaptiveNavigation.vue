<template>
  <view class="desktop-navigation glass-panel">
    <view class="navigation-brand">
      <view class="brand-mark"><view class="brand-mark-core" /></view>
      <view>
        <text class="brand-name">徐燃安巡</text>
        <text class="brand-copy">LPG 安全闭环工作台</text>
      </view>
    </view>
    <view class="navigation-items">
      <view
        v-for="item in items"
        :key="item.id"
        class="navigation-item"
        :class="{ active: item.id === active, disabled: item.disabled }"
        @click="go(item)"
      >
        <text>{{ item.label }}</text>
        <text v-if="item.disabled" class="planned-mark">规划中</text>
        <view v-else-if="item.id === active" class="active-mark" />
      </view>
    </view>
    <view class="navigation-footer">演示环境 · 未接入真实业务数据</view>
  </view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { getCurrentUser } from '../../services/issues/index.mjs'

defineProps({
  active: {
    type: String,
    required: true
  }
})

const currentUser = ref(null)
const items = computed(() => {
  const base = [
    { id: 'WORKBENCH', label: '工作台', path: '/pages/index/index', tab: true },
    { id: 'DUTY', label: '安全履职', path: '/pages/duty/index' },
    { id: 'REPORT', label: '随手拍', path: '/pages/issue/create', tab: true },
    { id: 'DRIVER_PROFILE', label: '送气工画像', disabled: true },
    { id: 'PROFILE', label: '我的', path: '/pages/profile/index', tab: true }
  ]
  if (!['SUPER_ADMIN', 'SAFETY_OFFICER'].includes(currentUser.value?.role)) return base
  return [
    base[0],
    { id: 'ASSIGN', label: '隐患交办', path: '/pages/admin/issue-assign' },
    base[1],
    { id: 'DUTY_DASHBOARD', label: '履职仪表盘', path: '/pages/admin/duty' },
    ...base.slice(2)
  ]
})

onMounted(async () => { currentUser.value = await getCurrentUser() })

function go(item) {
  if (item.disabled) {
    uni.showToast({ title: '送气工画像规划中', icon: 'none' })
    return
  }
  if (item.tab) uni.switchTab({ url: item.path })
  else uni.navigateTo({ url: item.path })
}
</script>

<style lang="scss" scoped>
.desktop-navigation { display: none; }

@media screen and (min-width: 1200px) {
  .desktop-navigation {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 20;
    display: flex;
    width: 260px;
    padding: 30px 20px 26px;
    box-sizing: border-box;
    flex-direction: column;
    border-right: 1px solid $xr-line;
    background: $xr-glass-bg;
    backdrop-filter: $xr-blur;
    -webkit-backdrop-filter: $xr-blur;
    color: $xr-text;
  }
  .navigation-brand { display: flex; align-items: center; gap: 14px; padding: 6px 10px 32px; }
  .brand-mark { display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 14px; background: $xr-surface-strong; border: 1px solid $xr-green-bright; box-shadow: $xr-cyan-glow; }
  .brand-mark-core { width: 16px; height: 16px; border: 3px solid $xr-green-bright; border-radius: 50%; position: relative; }
  .brand-mark-core::after { content: ''; position: absolute; right: -6px; top: 0; width: 6px; height: 6px; border-radius: 50%; background: $xr-green-bright; }
  .brand-name, .brand-copy { display: block; }
  .brand-name { font-size: 21px; font-weight: 760; letter-spacing: .03em; color: $xr-green-bright; }
  .brand-copy { margin-top: 6px; font-size: 12px; color: $xr-muted; }
  .navigation-items { display: flex; flex-direction: column; gap: 8px; }
  .navigation-item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 48px;
    padding: 0 14px;
    border-radius: 12px;
    border-left: 3px solid transparent;
    color: $xr-muted;
    font-size: 15px;
    transition: background .2s ease, color .2s ease;
  }
  .navigation-item.active { background: rgba(99, 247, 255, .10); border-left-color: $xr-green-bright; color: $xr-green-bright; font-weight: 700; box-shadow: inset 0 0 18px rgba(99, 247, 255, .06); }
  .navigation-item.disabled { color: rgba(255, 255, 255, .32); }
  .active-mark { width: 6px; height: 6px; border-radius: 50%; background: $xr-green-bright; box-shadow: $xr-cyan-glow; }
  .planned-mark { font-size: 11px; color: rgba(255, 255, 255, .38); }
  .navigation-footer { margin-top: auto; padding: 16px 12px 0; border-top: 1px solid $xr-line; font-size: 11px; line-height: 1.65; color: $xr-muted; }
}
</style>
