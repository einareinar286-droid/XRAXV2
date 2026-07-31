<template>
  <aside class="sidebar">
    <view class="brand" @click="goTab('/pages/index/index')"><view class="mark">安</view><view><view class="company">徐州中燃能源有限公司</view><view class="name">徐燃安巡</view></view></view>
    <nav class="nav">
      <view class="item" :class="{active:active==='home'}" @click="goTab('/pages/index/index')">待办工作台</view>
      <view class="item" :class="{active:active==='messages'}" @click="go('/pages/messages/index')">消息中心 <text v-if="unread" class="count">{{unread}}</text></view>
      <view v-if="demoStore.can('issue-list')" class="item" :class="{active:active==='issues'}" @click="go('/pages/issue/list')">整改单</view>
      <view class="item" :class="{active:active==='duty'}" @click="goTab('/pages/duty/index')">我的履职</view>
      <view v-if="demoStore.can('duty-overview')" class="item" :class="{active:active==='overview'}" @click="go('/pages/admin/duty')">管理总览</view>
      <view v-if="demoStore.can('admin')" class="item" :class="{active:active==='inspection'}" @click="go('/pages/admin/inspection')">安监抽查</view>
      <view v-if="demoStore.can('admin')" class="item" :class="{active:active==='templates'}" @click="go('/pages/admin/templates')">检查表模板</view>
    </nav>
    <view class="footer" @click="goTab('/pages/profile/index')">{{roleNames[demoStore.role]}}<text>我的 ›</text></view>
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
.sidebar{display:none}@media(min-width:900px){.sidebar{position:fixed;z-index:20;top:18px;bottom:18px;left:18px;width:224px;box-sizing:border-box;display:flex;flex-direction:column;padding:24px 18px;background:#fffcfa;border-radius:25px}.brand{display:flex;align-items:center;gap:12px;padding:3px 8px 34px}.mark{width:42px;height:42px;display:flex;align-items:center;justify-content:center;border-radius:13px 13px 13px 3px;background:#211d1d;color:#fff;font-size:20px;font-weight:800}.company{font-size:10px;letter-spacing:1px;color:#756c6b}.name{font-size:20px;font-weight:760}.nav{display:grid;gap:6px}.item{font-size:14px;color:#6f6663;padding:12px 13px;border-radius:11px}.item.active{background:#211d1d;color:#fff}.count{float:right;background:#9f2349;color:#fff;padding:1px 6px;border-radius:6px}.footer{margin-top:auto;border-top:1px solid #e8dfdc;padding:18px 8px 2px;color:#756c6b;font-size:12px;line-height:1.6}.footer text{display:block;color:#211d1d}}
</style>
