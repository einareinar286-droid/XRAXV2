<template>
  <view class="login-page">
    <view class="login-card glass-panel-high neon-glow-cyan">
      <view class="login-brand">
        <view class="brand-mark"><view class="brand-mark-core" /></view>
        <text class="login-title">徐燃安巡 · 云端登录</text>
        <text class="login-subtitle">测试版 AppID · 假账号测试阶段</text>
      </view>

      <view class="form-field">
        <text class="field-label">用户名</text>
        <input v-model="form.username" class="field-input" placeholder="测试账号用户名" placeholder-class="placeholder" />
      </view>
      <view class="form-field">
        <text class="field-label">密码</text>
        <input v-model="form.password" class="field-input" password placeholder="测试账号密码" placeholder-class="placeholder" />
      </view>

      <button class="primary" :loading="submitting" :disabled="submitting || !form.username || !form.password" @click="login">
        登录
      </button>
      <text v-if="error" class="error-text">{{ error }}</text>
      <text class="hint">云登录需构建时开启 VITE_XR_DUTY_MODE=cloud；当前 Mock 模式登录不可用。</text>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { cloudLogin } from '../../services/auth/index.mjs'

const form = reactive({ username: '', password: '' })
const submitting = ref(false)
const error = ref('')

async function login() {
  if (submitting.value) return
  submitting.value = true
  error.value = ''
  try {
    const user = await cloudLogin({ username: form.username, password: form.password })
    uni.showToast({ title: `欢迎，${form.username}`, icon: 'success' })
    setTimeout(() => uni.navigateBack(), 400)
  } catch (err) {
    error.value = err?.message || '登录失败'
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-page{min-height:100vh;padding:80rpx 40rpx;display:flex;flex-direction:column;align-items:center;background:transparent}
.login-card{width:100%;max-width:560rpx;padding:48rpx 36rpx;border-radius:28rpx;display:flex;flex-direction:column;gap:8rpx}
.login-brand{display:flex;flex-direction:column;align-items:center;gap:12rpx;margin-bottom:28rpx}
.brand-mark{width:72rpx;height:72rpx;border-radius:20rpx 20rpx 20rpx 8rpx;background:$xr-surface-strong;border:1rpx solid rgba(0,244,254,.55);display:flex;align-items:center;justify-content:center;box-shadow:$xr-cyan-glow}
.brand-mark-core{width:28rpx;height:28rpx;border:4rpx solid $xr-green-bright;border-radius:50%;position:relative}
.brand-mark-core::after{content:'';position:absolute;right:-8rpx;top:1rpx;width:9rpx;height:9rpx;border-radius:50%;background:$xr-green-bright}
.login-title{font-size:34rpx;font-weight:760;color:$xr-text}
.login-subtitle{font-size:21rpx;color:$xr-muted}
.form-field{margin-bottom:20rpx}
.field-label{display:block;margin-bottom:10rpx;font-size:23rpx;font-weight:650;color:$xr-text}
.field-input{height:88rpx;padding:0 22rpx;border-radius:14rpx;background:rgba(255,255,255,.04);border:1rpx solid $xr-line;color:$xr-text;font-size:26rpx}
.placeholder{color:$xr-muted-dim}
.primary{height:92rpx;line-height:92rpx;margin-top:16rpx;border-radius:16rpx;background:$xr-green-bright;color:$xr-text-inverse;font-size:28rpx;font-weight:700;box-shadow:$xr-cyan-glow}
.primary[disabled]{background:$xr-surface-container-high;color:$xr-muted;box-shadow:none}
.error-text{display:block;margin-top:14rpx;text-align:center;color:$xr-red;font-size:22rpx}
.hint{display:block;margin-top:18rpx;text-align:center;font-size:19rpx;line-height:1.6;color:$xr-muted}
</style>
