<template>
  <view class="form-page">
    <view class="notice"><text class="notice-title">现场隐患随手拍 · Mock</text><text>上报后先进入“待交办”，不会直接伪装成已完成服务端授权。</text></view>
    <view v-if="currentUser && !canReport" class="unauthorized">当前身份为 {{ currentUser.displayName }}，无权上报隐患。请在“我的”切换 Mock 身份。</view>
    <template v-else>
    <view class="form-card">
      <view class="field-label">隐患标题</view><textarea v-model="form.title" maxlength="60" placeholder="例如：餐饮用户使用可调节减压阀" />
      <view class="field-label">现场描述</view><textarea v-model="form.description" maxlength="1000" placeholder="记录现场情况、风险表现和已采取的临时措施" />
      <view class="field-label">隐患类别</view><picker :range="categories" @change="form.category = categories[$event.detail.value]"><view class="picker">{{ form.category }} <text>⌄</text></view></picker>
      <view class="field-label">严重程度</view><picker :range="severityLabels" @change="form.severity = severities[$event.detail.value]"><view class="picker">{{ severityText }} <text>⌄</text></view></picker>
      <view class="risk-switch" @click="form.isMajor = !form.isMajor"><view><text class="field-label">是否重大隐患</text><text class="hint">依据现行重大隐患判定标准</text></view><view class="switch" :class="{ on: form.isMajor }"><view /></view></view>
      <view class="field-label">现场位置</view><view class="location-box"><text>{{ form.location || '未选择位置' }}</text><view class="location-actions"><button @click="currentLocation">当前位置</button><button @click="pickLocation">地图选点</button></view></view>
      <view class="field-label">现场照片（最多 6 张）</view><view class="upload-row"><view v-for="item in form.attachments" :key="item.id" class="thumb"><image :src="item.previewUrl" mode="aspectFill" /></view><view v-if="form.attachments.length<6" class="add-photo" @click="addPhotos">＋<text>上传</text></view></view>
    </view>
    <button class="primary" :loading="submitting" :disabled="submitting||!form.title||!form.description||!form.location" @click="submit">上报隐患并进入待交办</button>
    </template>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getCurrentUser, issueSeverityText, reportIssue } from '../../services/issues/index.mjs'
import { chooseEvidenceImages, chooseMapLocation, getCurrentLocation, normalizeEvidenceAttachments } from '../../services/platform'
const categories = ['用户用气安全', '配送作业', '厂站设备', '管网设施', '安全管理']
const severities = ['LOW','MEDIUM','HIGH','CRITICAL']
const severityLabels = severities.map(issueSeverityText)
const form = reactive({ title:'', description:'', category:categories[0], severity:'MEDIUM', isMajor:false, location:'', attachments:[] })
const currentUser=ref(null),submitting=ref(false)
const canReport=computed(()=>['SAFETY_INSPECTOR','SAFETY_ADMIN'].includes(currentUser.value?.role))
const severityText=computed(()=>issueSeverityText(form.severity))
async function addPhotos(){try{const res=await chooseEvidenceImages();form.attachments.push(...normalizeEvidenceAttachments(res).slice(0,6-form.attachments.length))}catch{}}
async function currentLocation(){try{const res=await getCurrentLocation();form.location=`当前位置：${res.latitude.toFixed(6)}, ${res.longitude.toFixed(6)}`}catch{uni.showToast({title:'未取得定位权限',icon:'none'})}}
async function pickLocation(){try{const res=await chooseMapLocation();form.location=res.address||res.name}catch{}}
async function submit(){if(submitting.value)return;submitting.value=true;try{const issue=await reportIssue({...form});uni.showToast({title:'隐患已上报',icon:'success'});setTimeout(()=>uni.navigateTo({url:`/pages/issue/detail?id=${issue.id}`}),500)}catch(error){uni.showToast({title:error.message||'上报失败',icon:'none'})}finally{submitting.value=false}}
onShow(async()=>{currentUser.value=await getCurrentUser()})
</script>

<style lang="scss" scoped>
.form-page{padding:28rpx}.notice{padding:28rpx;border-radius:22rpx;background:#e4f2ed;color:#145f4d;font-size:23rpx;line-height:1.6}.notice-title{display:block;font-size:30rpx;font-weight:700;margin-bottom:4rpx}.unauthorized{padding:34rpx;margin-top:20rpx;border-radius:20rpx;background:#fff0ee;color:#9b2c24;line-height:1.6}.form-card{background:#fff;border:1rpx solid #e1e8e4;border-radius:24rpx;padding:28rpx;margin:20rpx 0 26rpx}.field-label{font-size:25rpx;font-weight:650;display:block;margin:0 0 14rpx}.field-label:not(:first-child){margin-top:28rpx}textarea{width:100%;height:132rpx;background:#f5f8f6;border-radius:14rpx;padding:18rpx;box-sizing:border-box;font-size:26rpx}.picker,.location-box{padding:20rpx;border-radius:14rpx;background:#f5f8f6;color:#33413a;font-size:25rpx;display:flex;justify-content:space-between;margin-bottom:12rpx}.risk-switch{display:flex;align-items:center;justify-content:space-between;margin-top:28rpx}.hint{display:block;color:#7d8983;font-size:21rpx;font-weight:400}.switch{width:78rpx;height:44rpx;border-radius:99rpx;background:#c9d4cf;padding:4rpx;box-sizing:border-box}.switch view{width:36rpx;height:36rpx;border-radius:50%;background:#fff;transition:all .2s}.switch.on{background:#d83a2e}.switch.on view{transform:translateX(34rpx)}.location-actions{display:flex;gap:10rpx}.location-actions button{font-size:21rpx;color:#006e55;padding:0;background:transparent}.upload-row{display:flex;gap:14rpx;flex-wrap:wrap}.thumb,.add-photo{width:120rpx;height:120rpx;border-radius:14rpx;overflow:hidden}.thumb image{width:100%;height:100%}.add-photo{border:1rpx dashed #9ba9a1;color:#006e55;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:42rpx}.add-photo text{font-size:20rpx}.primary{background:#006e55;color:#fff;border-radius:16rpx;font-size:29rpx;height:96rpx;line-height:96rpx}.primary[disabled]{background:#b6c4be}
</style>
