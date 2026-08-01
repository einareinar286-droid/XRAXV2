<template>
  <aside class="sidebar">
    <view class="brand" @click="goTab('/pages/index/index')">
      <view class="mark">安</view>
      <view><view class="name">徐燃安巡</view><view class="company">Xuzhou China Gas</view></view>
    </view>
    <nav class="nav">
      <view class="item" :class="{active:active==='home'}" @click="goTab('/pages/index/index')"><text class="nav-icon">▦</text><text>工作台</text></view>
      <view class="item" :class="{active:active==='issues'}" @click="go('/pages/issue/list')"><text class="nav-icon">▤</text><text>隐患管理</text></view>
      <view class="item" :class="{active:active==='duty'||active==='overview'}" @click="goTab('/pages/duty/index')"><text class="nav-icon">☑</text><text>安全履职</text></view>
      <view class="item" :class="{active:active==='messages'}" @click="go('/pages/messages/index')"><text class="nav-icon">◌</text><text>消息中心</text><text v-if="unread" class="count">{{ unread }}</text></view>
      <view class="item" :class="{active:active==='profile'||active==='inspection'||active==='templates'}" @click="goTab('/pages/profile/index')"><text class="nav-icon">⚙</text><text>设置</text></view>
    </nav>
    <view class="sidebar-bottom">
      <button class="new-hazard" @click="goTab('/pages/issue/create')">＋ 新建隐患</button>
      <view class="help" @click="goTab('/pages/profile/index')">当前身份: {{ roleNames[demoStore.role] }}</view>
    </view>
  </aside>
</template>
<script setup>
import {computed} from 'vue'
import {demoStore,roleNames} from '../stores/demo'
defineProps({active:{type:String,default:''}})
const unread=computed(()=>demoStore.messages.filter(x=>!x.read).length)
function go(url){uni.navigateTo({url})}function goTab(url){uni.switchTab({url})}
</script>
<style lang="scss" scoped>
.sidebar { display: none; }
@media (min-width: 900px) {
  .sidebar { position: fixed; z-index: 20; inset: 0 auto 0 0; width: 208px; display: flex; flex-direction: column; box-sizing: border-box; padding: 22px 12px 18px; background: rgba(255,255,255,.92); border-right: 1px solid #edf0f3; }
  .brand { display: flex; align-items: center; gap: 9px; padding: 2px 8px 28px; }
  .mark { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 8px; background: #003c90; color: #fff; font-size: 14px; font-weight: 800; }
  .name { color: #003c90; font-size: 15px; line-height: 1.2; font-weight: 800; letter-spacing: -.3px; }
  .company { margin-top: 2px; color: #89919c; font-size: 9px; letter-spacing: .2px; }
  .nav { display: grid; gap: 3px; }
  .item { min-height: 36px; display: flex; align-items: center; gap: 9px; padding: 0 10px; border-radius: 7px; color: #66707d; font-size: 12px; box-sizing: border-box; }
  .item.active { background: #e8f0ff; color: #003c90; font-weight: 700; }
  .nav-icon { width: 16px; color: inherit; font-size: 14px; text-align: center; }
  .count { min-width: 16px; height: 16px; margin-left: auto; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #ef4444; color: #fff; font-size: 9px; }
  .sidebar-bottom { margin-top: auto; }
  .new-hazard { width: 100%; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 7px; background: #003c90; color: #fff; font-size: 11px; font-weight: 700; box-shadow: 0 7px 16px rgba(15,82,186,.18); }
  .help { padding: 16px 7px 0; color: #8b939e; font-size: 10px; line-height: 1.5; }
}
</style>
