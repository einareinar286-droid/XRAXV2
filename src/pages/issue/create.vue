<template>
  <view class="form-page">
    <view class="notice"><text class="notice-title">现场隐患随手拍</text><text>上传后将生成不可删除的隐患记录，并进入交办闭环。</text></view>
    <view class="form-card">
      <view class="field-label">隐患描述</view><textarea v-model="form.title" maxlength="60" placeholder="例如：餐饮用户使用可调节减压阀" />
      <view class="field-label">隐患类别</view><picker :range="categories" @change="form.category = categories[$event.detail.value]"><view class="picker">{{ form.category }} <text>⌄</text></view></picker>
      <view class="risk-switch" @click="form.major = !form.major"><view><text class="field-label">是否重大隐患</text><text class="hint">依据《城镇燃气经营安全重大隐患判定标准》</text></view><view class="switch" :class="{ on: form.major }"><view /></view></view>
      <view class="field-label">现场位置</view><view class="location-box"><text>{{ form.location || '未选择位置' }}</text><view class="location-actions"><button @click="currentLocation">当前位置</button><button @click="pickLocation">地图选点</button></view></view>
      <view class="field-label">现场照片</view><view class="upload-row"><view v-for="item in form.attachments" :key="item" class="thumb"><image :src="item" mode="aspectFill" /></view><view class="add-photo" @click="addPhotos">＋<text>上传</text></view></view>
      <view class="field-label">交办部门与限期</view><view class="picker">市场营销部 · 默认负责人：演示负责人</view><picker mode="date" :value="form.deadline" @change="form.deadline = $event.detail.value"><view class="picker">{{ form.deadline }} 前整改 <text>⌄</text></view></picker>
    </view>
    <button class="primary" :disabled="!form.title" @click="submit">下达交办单并进入待整改</button>
  </view>
</template>

<script setup>
import { reactive } from 'vue'
import { chooseEvidenceImages, chooseMapLocation, getCurrentLocation } from '../../services/platform'
import { demoStore } from '../../stores/demo'
const categories = ['用户用气安全', '配送作业', '厂站设备', '管网设施', '安全管理']
const form = reactive({ title:'', category:categories[0], major:false, location:'', attachments:[], deadline:'2026-08-07' })
async function addPhotos(){try{const res=await chooseEvidenceImages();form.attachments.push(...res.tempFilePaths)}catch{}}
async function currentLocation(){try{const res=await getCurrentLocation();form.location=`当前位置：${res.latitude.toFixed(6)}, ${res.longitude.toFixed(6)}`}catch{uni.showToast({title:'未取得定位权限',icon:'none'})}}
async function pickLocation(){try{const res=await chooseMapLocation();form.location=res.address||res.name}catch{}}
function submit(){const id=demoStore.addIssue({...form,reporter:'安全监察部 · 演示上报人',assignee:'市场营销部 · 演示负责人',description:form.title});uni.showToast({title:'交办单已生成',icon:'success'});setTimeout(()=>uni.navigateTo({url:`/pages/issue/detail?id=${id}`}),600)}
</script>

<style lang="scss" scoped>
.form-page{padding:28rpx}.notice{padding:28rpx;border-radius:22rpx;background:#e4f2ed;color:#145f4d;font-size:23rpx;line-height:1.6}.notice-title{display:block;font-size:30rpx;font-weight:700;margin-bottom:4rpx}.form-card{background:#fff;border:1rpx solid #e1e8e4;border-radius:24rpx;padding:28rpx;margin:20rpx 0 26rpx}.field-label{font-size:25rpx;font-weight:650;display:block;margin:0 0 14rpx}.field-label:not(:first-child){margin-top:28rpx}textarea{width:100%;height:132rpx;background:#f5f8f6;border-radius:14rpx;padding:18rpx;box-sizing:border-box;font-size:26rpx}.picker,.location-box{padding:20rpx;border-radius:14rpx;background:#f5f8f6;color:#33413a;font-size:25rpx;display:flex;justify-content:space-between;margin-bottom:12rpx}.risk-switch{display:flex;align-items:center;justify-content:space-between;margin-top:28rpx}.hint{display:block;color:#7d8983;font-size:21rpx;font-weight:400}.switch{width:78rpx;height:44rpx;border-radius:99rpx;background:#c9d4cf;padding:4rpx;box-sizing:border-box}.switch view{width:36rpx;height:36rpx;border-radius:50%;background:#fff;transition:all .2s}.switch.on{background:#d83a2e}.switch.on view{transform:translateX(34rpx)}.location-actions{display:flex;gap:10rpx}.location-actions button{font-size:21rpx;color:#006e55;padding:0;background:transparent}.upload-row{display:flex;gap:14rpx;flex-wrap:wrap}.thumb,.add-photo{width:120rpx;height:120rpx;border-radius:14rpx;overflow:hidden}.thumb image{width:100%;height:100%}.add-photo{border:1rpx dashed #9ba9a1;color:#006e55;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:42rpx}.add-photo text{font-size:20rpx}.primary{background:#006e55;color:#fff;border-radius:16rpx;font-size:29rpx;height:96rpx;line-height:96rpx}.primary[disabled]{background:#b6c4be}
</style>
