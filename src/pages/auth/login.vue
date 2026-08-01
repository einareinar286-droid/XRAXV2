<template>
  <view class="login-page">
    <view class="login-panel">
      <view class="login-mark">安</view><view class="login-title">徐燃安巡</view><view class="login-subtitle">安全管理工作台</view>
      <view class="login-field"><text>用户名</text><input v-model="username" placeholder="请输入用户名"/></view>
      <view class="login-field"><text>密码</text><input v-model="password" password placeholder="请输入密码"/></view>
      <view class="login-options"><label><checkbox :checked="remember" color="#003c90" @click="remember=!remember"/> 记住登录</label><text>忘记密码？</text></view>
      <view v-if="error" class="login-error">{{ error }}</view>
      <button class="login-button" @click="login">登录</button>
    </view>
    <view class="demo-switch"><text>演示身份</text><view><button v-for="role in allRoles" :key="role.id" class="role-button" :class="{active:selected===role.id}" @click="selected=role.id">{{ role.roleName }}</button></view></view>
  </view>
</template>
<script setup>
import { ref } from 'vue'
import { allRoles, demoStore } from '../../stores/demo'
const username=ref('demo'),password=ref('Demo@2026'),selected=ref('admin'),remember=ref(true),error=ref('')
function login(){if(!username.value||!password.value){error.value='请输入用户名和密码';return}demoStore.setRole(selected.value);uni.switchTab({url:'/pages/index/index'})}
</script>
<style lang="scss" scoped>
.login-page{min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;box-sizing:border-box;padding:54rpx 28rpx;background:#f8f9fa}.login-panel{width:100%;max-width:480rpx;box-sizing:border-box;padding:40rpx 34rpx 32rpx;border:1rpx solid #e8edf2;border-radius:16rpx;background:#fff;box-shadow:0 12rpx 32rpx rgba(33,47,67,.06);text-align:center}.login-mark{width:76rpx;height:76rpx;margin:0 auto 16rpx;display:flex;align-items:center;justify-content:center;border-radius:18rpx;background:#003c90;color:#fff;font-size:38rpx;font-weight:800}.login-title{color:#191b22;font-size:31rpx;font-weight:760}.login-subtitle{margin-top:5rpx;color:#75808f;font-size:19rpx}.login-field{text-align:left;margin-top:22rpx}.login-field text{display:block;margin-bottom:8rpx;color:#516071;font-size:19rpx}.login-field input{height:62rpx;box-sizing:border-box;padding:0 14rpx;border-radius:8rpx;background:#f1f3f5;color:#191b22;font-size:21rpx}.login-options{display:flex;justify-content:space-between;align-items:center;margin-top:14rpx;color:#6f7b8b;font-size:17rpx;text-align:left}.login-options text{color:#003c90}.login-error{margin-top:12rpx;color:#d43838;font-size:18rpx}.login-button{width:100%;height:64rpx;margin-top:22rpx;border-radius:8rpx;background:#003c90;color:#fff;font-size:22rpx;font-weight:700}.demo-switch{width:100%;max-width:600rpx;margin-top:28rpx;text-align:center;color:#7b8491;font-size:17rpx}.demo-switch>view{display:flex;justify-content:center;flex-wrap:wrap;gap:10rpx;margin-top:12rpx}.role-button{height:40rpx;padding:0 12rpx;border:1rpx solid #dde4ec;border-radius:99rpx;background:#fff;color:#677282;font-size:16rpx}.role-button.active{border-color:#8db1ed;background:#e8f0ff;color:#003c90}@media(min-width:900px){.login-panel{max-width:320px;padding:26px 24px 22px;border-radius:10px;box-shadow:0 8px 22px rgba(33,47,67,.06)}.login-mark{width:48px;height:48px;margin-bottom:10px;border-radius:12px;font-size:23px}.login-title{font-size:19px}.login-subtitle{margin-top:3px;font-size:11px}.login-field{margin-top:15px}.login-field text{margin-bottom:5px;font-size:11px}.login-field input{height:36px;padding:0 10px;border-radius:6px;font-size:11px}.login-options{margin-top:9px;font-size:10px}.login-error{margin-top:8px;font-size:10px}.login-button{height:38px;margin-top:15px;border-radius:6px;font-size:12px}.demo-switch{max-width:420px;margin-top:20px;font-size:10px}.demo-switch>view{gap:6px;margin-top:8px}.role-button{height:24px;padding:0 8px;font-size:9px}}
</style>
