<template>
  <view>
    <AdaptiveNavigation active="REPORT" />
    <view class="form-page">
    <view class="form-head"><view class="brand-lockup"><view class="brand-mark"><view class="brand-mark-core" /></view><view><text class="brand-name">徐燃安巡</text><text class="brand-subtitle">现场隐患上报</text></view></view><text class="mock-chip">Mock</text></view>
    <view class="notice glass-panel"><text class="notice-title">上报后进入待交办</text><text>当前身份与数据仅用于演示，不等同于生产级授权。</text></view>
    <template v-if="canReport">
      <view class="capture-panel glass-panel-high neon-glow-cyan" @click="addPhotos"><view class="capture-frame"><view class="capture-camera"><view class="capture-lens" /></view></view><text class="capture-title">随手拍上报</text><text class="capture-copy">先记录现场证据，再补充风险和位置</text><text class="capture-action">{{ form.attachments.length ? `已选 ${form.attachments.length} 张，继续添加` : '拍照或从相册选择' }}</text></view>

      <view class="form-card glass-panel">
        <view class="form-section"><view class="section-heading"><view class="section-mark"><view /></view><view><text class="section-title">基本信息</text><text class="section-copy">描述发现的隐患及其现场表现</text></view></view>
          <text class="field-label">隐患标题</text><textarea v-model="form.title" maxlength="60" placeholder="例如：餐饮用户使用可调节减压阀" />
          <text class="field-label">现场描述</text><textarea v-model="form.description" maxlength="1000" placeholder="记录现场情况、风险表现和已采取的临时措施" />
        </view>

        <view class="form-section"><view class="section-heading"><view class="section-mark risk"><view /></view><view><text class="section-title">风险判断</text><text class="section-copy">依据现场实际情况选择类别和严重程度</text></view></view>
          <text class="field-label">隐患类别</text><picker :range="categories" @change="form.category = categories[$event.detail.value]"><view class="picker"><text>{{ form.category }}</text><view class="picker-mark" /></view></picker>
          <text class="field-label">严重程度</text><picker :range="severityLabels" @change="form.severity = severities[$event.detail.value]"><view class="picker"><text>{{ severityText }}</text><view class="picker-mark" /></view></picker>
          <view class="risk-switch" @click="form.isMajor = !form.isMajor"><view><text class="field-label inline">是否重大隐患</text><text class="hint">依据现行重大隐患判定标准</text></view><view class="switch" :class="{ on: form.isMajor }"><view /></view></view>
        </view>

        <view class="form-section"><view class="section-heading"><view class="section-mark location"><view /></view><view><text class="section-title">地点与证据</text><text class="section-copy">补充现场位置和照片佐证，最多 6 张</text></view></view>
          <text class="field-label">现场位置（可选）</text><view class="location-box"><text>{{ form.location || '不填写也可提交' }}</text><view class="location-actions"><button @click.stop="currentLocation">当前位置</button><button @click.stop="pickLocation">地图选点</button></view></view>
          <text class="field-label">现场照片</text><view class="upload-row"><view v-for="item in form.attachments" :key="item.id" class="thumb"><image :src="item.previewUrl" mode="aspectFill" /></view><view v-if="form.attachments.length < 6" class="add-photo" @click="addPhotos"><view class="add-photo-mark" /><text>上传照片</text></view></view>
        </view>
      </view>
      <view class="submit-area"><text class="submit-hint">标题和现场描述为必填；定位为可选，未授权定位也不影响上报。</text><button class="primary" :loading="submitting" :disabled="submitting || !form.title || !form.description" @click="submit">上报隐患并进入待交办</button></view>
    </template>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getCurrentUser, issueSeverityText, reportIssue } from '../../services/issues/index.mjs'
import { chooseEvidenceImages, chooseMapLocation, getCurrentLocation, normalizeEvidenceAttachments } from '../../services/platform'
import AdaptiveNavigation from '../../components/navigation/AdaptiveNavigation.vue'

const categories = ['用户用气安全', '配送作业', '厂站设备', '管网设施', '安全管理']
const severities = ['LOW','MEDIUM','HIGH','CRITICAL']
const severityLabels = severities.map(issueSeverityText)
const form = reactive({ title:'', description:'', category:categories[0], severity:'MEDIUM', isMajor:false, location:'', locationSource:'NONE', coordinates:null, attachments:[] })
const currentUser = ref(null), submitting = ref(false)
const canReport = computed(() => Boolean(currentUser.value))
const severityText = computed(() => issueSeverityText(form.severity))
async function addPhotos(){try{const res=await chooseEvidenceImages();form.attachments.push(...normalizeEvidenceAttachments(res).slice(0,6-form.attachments.length))}catch{}}
async function currentLocation(){try{const res=await getCurrentLocation();form.location=`当前位置：${res.latitude.toFixed(6)}, ${res.longitude.toFixed(6)}`;form.locationSource='AUTO';form.coordinates={latitude:res.latitude,longitude:res.longitude}}catch{uni.showToast({title:'未取得定位权限，可跳过定位继续上报',icon:'none'})}}
async function pickLocation(){try{const res=await chooseMapLocation();form.location=res.address||res.name||'';form.locationSource=form.location?'MANUAL':'NONE';form.coordinates=null}catch{}}
async function submit(){if(submitting.value)return;submitting.value=true;try{const issue=await reportIssue({...form});uni.showToast({title:'隐患已上报',icon:'success'});setTimeout(()=>uni.navigateTo({url:`/pages/issue/detail?id=${issue.id}`}),500)}catch(error){uni.showToast({title:error.message||'上报失败',icon:'none'})}finally{submitting.value=false}}
onShow(async()=>{currentUser.value=await getCurrentUser()})
</script>

<style lang="scss" scoped>
.form-page{min-height:100vh;padding:28rpx;background:transparent}
.form-head{display:flex;align-items:center;justify-content:space-between;gap:18rpx;margin:8rpx 0 22rpx}
.brand-lockup{display:flex;align-items:center;gap:14rpx}
.brand-mark{width:62rpx;height:62rpx;border-radius:18rpx 18rpx 18rpx 6rpx;background:$xr-surface-strong;border:1rpx solid rgba(0,244,254,.55);display:flex;align-items:center;justify-content:center;box-shadow:$xr-cyan-glow}
.brand-mark-core{width:24rpx;height:24rpx;border:4rpx solid $xr-green-bright;border-radius:50%;position:relative}
.brand-mark-core::after{content:'';position:absolute;right:-7rpx;top:1rpx;width:8rpx;height:8rpx;border-radius:50%;background:$xr-green-bright}
.brand-name,.brand-subtitle{display:block}
.brand-name{font-size:34rpx;font-weight:760;color:$xr-text}
.brand-subtitle{margin-top:4rpx;font-size:20rpx;color:$xr-muted}
.mock-chip{padding:9rpx 13rpx;border-radius:12rpx;background:rgba(99,247,255,.12);color:$xr-green-bright;font-size:20rpx;border:1rpx solid rgba(99,247,255,.3)}
.notice{padding:19rpx 22rpx;border:1rpx solid rgba(255,210,138,.35);border-radius:18rpx;background:rgba(255,210,138,.08);color:$xr-amber;font-size:21rpx;line-height:1.6}
.notice-title{display:block;font-size:24rpx;font-weight:700}
.capture-panel{display:flex;flex-direction:column;align-items:center;margin:20rpx 0;padding:34rpx 28rpx;border-radius:24rpx;background:linear-gradient(135deg,rgba(13,31,31,.9) 0%,rgba(19,19,19,.95) 100%);color:$xr-text}
.capture-frame{width:84rpx;height:64rpx;border:3rpx solid rgba(99,247,255,.76);border-radius:14rpx;display:flex;align-items:center;justify-content:center;position:relative}
.capture-frame::before{content:'';position:absolute;top:-10rpx;left:18rpx;width:28rpx;height:10rpx;border-radius:5rpx 5rpx 0 0;background:rgba(99,247,255,.76)}
.capture-camera{width:44rpx;height:34rpx;border-radius:9rpx;background:rgba(0,0,0,.32);display:flex;align-items:center;justify-content:center}
.capture-lens{width:18rpx;height:18rpx;border:3rpx solid $xr-green-bright;border-radius:50%}
.capture-title{margin-top:18rpx;font-size:34rpx;font-weight:760;color:$xr-green-bright}
.capture-copy{margin-top:7rpx;font-size:22rpx;color:$xr-muted}
.capture-action{margin-top:18rpx;padding:9rpx 15rpx;border:1rpx solid rgba(99,247,255,.45);border-radius:12rpx;font-size:20rpx;color:$xr-green-bright}
.form-card{border-radius:24rpx;overflow:hidden}
.form-section{padding:28rpx;border-bottom:1rpx solid $xr-line}
.form-section:last-child{border-bottom:0}
.section-heading{display:flex;gap:14rpx;margin-bottom:26rpx}
.section-mark{width:42rpx;height:42rpx;flex:0 0 auto;border-radius:14rpx;background:rgba(99,247,255,.1);border:1rpx solid rgba(99,247,255,.3);display:flex;align-items:center;justify-content:center}
.section-mark view{width:16rpx;height:16rpx;border:3rpx solid $xr-green-bright;border-radius:4rpx}
.section-mark.risk{background:rgba(255,180,171,.1);border-color:rgba(255,180,171,.4)}
.section-mark.risk view{border-radius:50%;border-color:$xr-red}
.section-mark.location{background:rgba(255,210,138,.1);border-color:rgba(255,210,138,.4)}
.section-mark.location view{border-radius:50% 50% 50% 0;border-color:$xr-amber;transform:rotate(-45deg)}
.section-title,.section-copy{display:block}
.section-title{font-size:29rpx;font-weight:720;color:$xr-text}
.section-copy{margin-top:4rpx;font-size:20rpx;line-height:1.5;color:$xr-muted}
.field-label{display:block;margin:0 0 13rpx;font-size:24rpx;font-weight:650;color:$xr-text}
.field-label:not(:first-child){margin-top:27rpx}
.field-label.inline{margin:0}
.hint{display:block;margin-top:5rpx;font-size:20rpx;color:$xr-muted}
textarea{width:100%;height:132rpx;padding:18rpx;box-sizing:border-box;border-radius:14rpx;background:rgba(255,255,255,.04);border:1rpx solid $xr-line;font-size:25rpx;color:$xr-text}
.picker,.location-box{display:flex;align-items:center;justify-content:space-between;padding:20rpx;border-radius:14rpx;background:rgba(255,255,255,.04);border:1rpx solid $xr-line;color:$xr-text;font-size:24rpx}
.picker-mark{width:12rpx;height:12rpx;border-right:2rpx solid $xr-muted;border-bottom:2rpx solid $xr-muted;transform:rotate(45deg) translateY(-4rpx)}
.risk-switch{display:flex;align-items:center;justify-content:space-between;margin-top:27rpx}
.switch{width:78rpx;height:44rpx;padding:4rpx;box-sizing:border-box;border-radius:99rpx;background:$xr-surface-container-high}
.switch view{width:36rpx;height:36rpx;border-radius:50%;background:$xr-muted;transition:transform .2s}
.switch.on{background:rgba(255,180,171,.5);box-shadow:$xr-red-glow}
.switch.on view{transform:translateX(34rpx);background:$xr-red}
.location-box{align-items:flex-start;gap:18rpx}
.location-actions{display:flex;flex:0 0 auto;gap:8rpx}
.location-actions button{padding:0;background:transparent;color:$xr-green-bright;font-size:20rpx;line-height:1.4}
.upload-row{display:flex;flex-wrap:wrap;gap:14rpx}
.thumb,.add-photo{width:120rpx;height:120rpx;border-radius:14rpx;overflow:hidden}
.thumb image{width:100%;height:100%}
.add-photo{display:flex;flex-direction:column;align-items:center;justify-content:center;border:1rpx dashed $xr-line-strong;color:$xr-green-bright;font-size:20rpx;background:rgba(255,255,255,.02)}
.add-photo-mark{width:28rpx;height:28rpx;border:3rpx solid currentColor;border-radius:8rpx;position:relative;margin-bottom:8rpx}
.add-photo-mark::after,.add-photo-mark::before{content:'';position:absolute;left:50%;top:50%;background:currentColor;transform:translate(-50%,-50%)}
.add-photo-mark::after{width:14rpx;height:3rpx}
.add-photo-mark::before{width:3rpx;height:14rpx}
.submit-area{margin:22rpx 0 34rpx}
.submit-hint{display:block;margin-bottom:13rpx;font-size:20rpx;color:$xr-muted}
.primary{height:94rpx;line-height:94rpx;background:$xr-green-bright;color:$xr-text-inverse;border-radius:16rpx;font-size:28rpx;font-weight:700;box-shadow:$xr-cyan-glow}
.primary[disabled]{background:$xr-surface-container-high;color:$xr-muted;box-shadow:none}
@media (min-width:1200px){.form-page{max-width:860px;margin:0 0 0 260px;padding:34px 30px}.brand-mark{width:46px;height:46px}.brand-mark-core{width:18px;height:18px;border-width:3px}.brand-name{font-size:25px}.brand-subtitle,.mock-chip{font-size:12px}.notice{padding:15px 18px;font-size:13px}.notice-title{font-size:14px}.capture-panel{padding:34px}.capture-frame{width:72px;height:54px}.capture-title{font-size:28px}.capture-copy,.capture-action{font-size:13px}.form-section{padding:28px}.section-mark{width:38px;height:38px}.section-title{font-size:18px}.section-copy,.hint,.submit-hint{font-size:12px}.field-label{font-size:14px}.picker,.location-box,textarea{font-size:14px}.location-actions button{font-size:12px}.primary{height:48px;line-height:48px;font-size:15px}}
</style>
