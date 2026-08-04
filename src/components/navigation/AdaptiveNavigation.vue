<template>
  <view class="desktop-navigation">
    <view class="navigation-brand">
      <text class="brand-name">徐燃安巡</text>
      <text class="brand-copy">安全闭环工作台</text>
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
    padding: 34px 22px 28px;
    box-sizing: border-box;
    flex-direction: column;
    border-right: 1px solid #d8e3dc;
    background: linear-gradient(165deg, #0b342c 0%, #0a5747 58%, #08705b 100%);
    color: #fff;
    box-shadow: 12px 0 30px rgba(15, 60, 49, .12);
  }
  .navigation-brand { padding: 8px 14px 34px; }
  .brand-name, .brand-copy { display: block; }
  .brand-name { font-size: 25px; font-weight: 760; letter-spacing: .04em; }
  .brand-copy { margin-top: 8px; font-size: 12px; color: rgba(255, 255, 255, .68); }
  .navigation-items { display: flex; flex-direction: column; gap: 8px; }
  .navigation-item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 48px;
    padding: 0 14px;
    border-radius: 12px;
    color: rgba(255, 255, 255, .74);
    font-size: 15px;
    transition: background .2s ease, color .2s ease;
  }
  .navigation-item.active { background: rgba(255, 255, 255, .15); color: #fff; font-weight: 700; }
  .navigation-item.disabled { color: rgba(255, 255, 255, .38); }
  .active-mark { width: 6px; height: 6px; border-radius: 50%; background: #90e0c8; box-shadow: 0 0 0 5px rgba(144, 224, 200, .14); }
  .planned-mark { font-size: 11px; color: rgba(255, 255, 255, .42); }
  .navigation-footer { margin-top: auto; padding: 16px 14px 0; border-top: 1px solid rgba(255, 255, 255, .16); font-size: 11px; line-height: 1.65; color: rgba(255, 255, 255, .55); }
}
</style>
