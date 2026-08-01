<template>
  <AppFrame active="issues">
    <view class="xr-content report-page">
      <view class="report-heading"><view class="back" @click="back">‹</view><view><view class="xr-page-title">隐患随手拍</view><view class="xr-page-copy">记录现场隐患并形成可追溯的上报事项。</view></view></view>
      <view class="xr-card report-form">
        <view class="form-section-title">▣ 基本信息</view>
        <view class="field"><text class="xr-field-label">隐患标题 <text class="required">*</text></text><input v-model="form.title" class="xr-input" maxlength="60" placeholder="例如：餐饮用户使用可调节减压阀"/></view>
        <view class="field"><text class="xr-field-label">隐患描述</text><textarea v-model="form.description" class="xr-textarea" maxlength="300" placeholder="请说明发现位置、现场情况和需要采取的措施"/></view>
        <view class="two-fields"><view class="field"><text class="xr-field-label">隐患类别 <text class="required">*</text></text><picker :range="categories" @change="form.category=categories[$event.detail.value]"><view class="xr-select">{{ form.category }} <text>⌄</text></view></picker></view><view class="field"><text class="xr-field-label">风险等级 <text class="required">*</text></text><view class="risk-options"><view v-for="item in risks" :key="item.value" class="risk-option" :class="{active:form.major===item.value,major:item.value}" @click="form.major=item.value">{{ item.label }}</view></view></view></view>
        <view class="form-divider"></view>
        <view class="form-section-title">◎ 现场图片</view>
        <view class="photo-row"><view v-for="item in form.attachments" :key="item" class="photo"><image :src="item" mode="aspectFill"/></view><view class="photo upload" @click="addPhotos"><text>＋</text><text>添加照片</text></view></view>
        <view class="form-divider"></view>
        <view class="form-section-title">⌖ 现场位置</view>
        <view class="location-actions"><button class="location-button current" @click="currentLocation">◉ 当前位置</button><button class="location-button" @click="pickLocation">⌖ 地图选点</button></view>
        <view class="map-preview"><view class="map-pin">●</view><view class="map-line one"></view><view class="map-line two"></view><view class="map-label">{{ form.location || '请选择隐患发生位置' }}</view></view>
        <view class="field deadline-field"><text class="xr-field-label">建议整改期限</text><picker mode="date" :value="form.deadline" @change="form.deadline=$event.detail.value"><view class="xr-select">{{ form.deadline }} <text>⌄</text></view></picker></view>
        <view class="form-footer"><button class="cancel" @click="back">取消</button><button class="xr-btn xr-btn-primary submit" :disabled="!form.title" @click="submit">提交上报</button></view>
      </view>
    </view>
  </AppFrame>
</template>

<script setup>
import { reactive } from 'vue'
import AppFrame from '../../components/AppFrame.vue'
import { chooseEvidenceImages, chooseMapLocation, getCurrentLocation } from '../../services/platform'
import { demoStore } from '../../stores/demo'
const categories=['用户用气安全','配送作业','厂站设备','管网设施','安全管理']
const risks=[{label:'一般',value:false},{label:'重大',value:true}]
const form=reactive({title:'',description:'',category:categories[0],major:false,location:'',attachments:[],deadline:new Date(Date.now()+7*86400000).toISOString().slice(0,10)})
async function addPhotos(){try{const res=await chooseEvidenceImages();form.attachments.push(...res.tempFilePaths)}catch{}}
async function currentLocation(){try{const res=await getCurrentLocation();form.location=`当前位置 ${res.latitude.toFixed(6)}, ${res.longitude.toFixed(6)}`}catch{uni.showToast({title:'未取得定位权限',icon:'none'})}}
async function pickLocation(){try{const res=await chooseMapLocation();form.location=res.address||res.name||'已选择地图位置'}catch{}}
function back(){uni.navigateBack({delta:1,fail:()=>uni.switchTab({url:'/pages/index/index'})})}
function submit(){const id=demoStore.addIssue({...form,description:form.description||form.title});uni.showToast({title:'隐患已上报',icon:'success'});setTimeout(()=>uni.navigateTo({url:`/pages/issue/detail?id=${id}`}),500)}
</script>

<style lang="scss" scoped>
.report-page{max-width:960px}.report-heading{display:flex;align-items:center;gap:16rpx;margin:5rpx 0 20rpx}.back{width:48rpx;height:48rpx;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#fff;color:#334154;font-size:39rpx;line-height:1}.report-form{padding:22rpx}.form-section-title{color:#3d4857;font-size:21rpx;font-weight:700}.field{margin-top:20rpx}.required{color:#ef4444}.two-fields{display:grid;gap:18rpx}.risk-options{display:grid;grid-template-columns:repeat(2,1fr);gap:10rpx}.risk-option{height:62rpx;display:flex;align-items:center;justify-content:center;border:1rpx solid #e1e6eb;border-radius:99rpx;color:#68727f;font-size:20rpx}.risk-option.active{border:2rpx solid #f59e0b;background:#fff6df;color:#ae6500;font-weight:700}.risk-option.active.major{border-color:#ef4444;background:#fff0ef;color:#d43838}.form-divider{height:1rpx;background:#eef1f4;margin:24rpx 0}.photo-row{display:flex;flex-wrap:wrap;gap:12rpx;margin-top:15rpx}.photo{width:126rpx;height:126rpx;overflow:hidden;border-radius:9rpx;background:#f1f3f5}.photo image{width:100%;height:100%}.upload{border:1rpx dashed #aab5c4;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#6e7d90;gap:5rpx}.upload text:first-child{font-size:35rpx;line-height:1}.upload text:last-child{font-size:18rpx}.location-actions{display:flex;gap:10rpx;margin-top:14rpx}.location-button{height:54rpx;padding:0 14rpx;border:1rpx solid #dbe2ec;border-radius:99rpx;background:#fff;color:#4c5969;font-size:19rpx}.location-button.current{background:#003c90;border-color:#003c90;color:#fff}.map-preview{height:180rpx;position:relative;overflow:hidden;margin-top:14rpx;border-radius:9rpx;background:linear-gradient(135deg,#e6ebee 0 24%,#f8fbfc 24% 48%,#e7edf1 48% 61%,#f6f8f9 61%);border:1rpx solid #e2e7ec}.map-line{position:absolute;height:14rpx;width:120%;background:rgba(255,255,255,.9);transform:rotate(-12deg);left:-30rpx}.map-line.one{top:48rpx}.map-line.two{top:118rpx;transform:rotate(22deg)}.map-pin{position:absolute;z-index:2;left:50%;top:60rpx;color:#ef4444;font-size:43rpx;text-shadow:0 2rpx 6rpx rgba(120,20,20,.22)}.map-label{position:absolute;z-index:3;right:10rpx;bottom:10rpx;left:10rpx;padding:11rpx 13rpx;border-radius:7rpx;background:rgba(255,255,255,.93);color:#4b5663;font-size:18rpx;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.deadline-field{max-width:360rpx}.form-footer{display:flex;justify-content:flex-end;align-items:center;gap:16rpx;margin-top:28rpx}.cancel{padding:0 8rpx;color:#69707d;font-size:21rpx}.submit{min-width:180rpx}@media(min-width:900px){.report-heading{gap:12px;margin:0 0 16px}.back{width:30px;height:30px;font-size:25px}.report-form{padding:22px}.form-section-title{font-size:12px}.field{margin-top:16px}.two-fields{grid-template-columns:1fr 1fr;gap:14px}.risk-options{gap:8px}.risk-option{height:36px;font-size:11px}.form-divider{margin:20px 0}.photo-row{gap:10px;margin-top:12px}.photo{width:88px;height:88px}.upload text:first-child{font-size:25px}.upload text:last-child{font-size:10px}.location-actions{gap:8px;margin-top:10px}.location-button{height:34px;padding:0 10px;font-size:10px}.map-preview{height:132px;margin-top:10px}.map-line{height:10px}.map-line.one{top:34px}.map-line.two{top:88px}.map-pin{top:38px;font-size:31px}.map-label{right:8px;bottom:8px;left:8px;padding:8px 10px;font-size:10px}.deadline-field{max-width:230px}.form-footer{gap:12px;margin-top:22px}.cancel{font-size:11px}.submit{min-width:130px}}
</style>
