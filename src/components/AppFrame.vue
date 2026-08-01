<template>
  <view class="xr-shell">
    <DesktopSidebar :active="active" />
    <view class="xr-main">
      <view class="xr-topbar">
        <view class="xr-mobile-brand" @click="goTab('/pages/index/index')">
          <view class="xr-mobile-mark">安</view>
          <text>徐燃安巡</text>
        </view>
        <view class="xr-topbar-actions">
          <view class="xr-icon-button" @click="go('/pages/messages/index')">铃</view>
          <view class="xr-topbar-role">{{ roleNames[demoStore.role] }}</view>
        </view>
      </view>
      <slot />
    </view>
  </view>
</template>

<script setup>
import DesktopSidebar from './DesktopSidebar.vue'
import { demoStore, roleNames } from '../stores/demo'

defineProps({ active: { type: String, default: '' } })
function go(url) { uni.navigateTo({ url }) }
function goTab(url) { uni.switchTab({ url }) }
</script>
