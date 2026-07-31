<template>
  <view v-if="issue" class="detail-page">
    <view class="issue-summary" :class="{ major: issue.major }"><view class="topline"><view class="status" :class="statusClass(issue.status)">{{ issue.status }}</view><view v-if="issue.major" class="major-tag">重大隐患</view></view><view class="title">{{ issue.title }}</view><view class="id">{{ issue.id }}</view><view class="summary-line">整改责任：{{ issue.assignee }}</view><view class="summary-line">规定期限：{{ issue.deadline }}</view></view>
    <view class="timeline-title">闭环过程</view>
    <view class="timeline"><view class="timeline-row done"><view class="dot" /><view><view class="step-name">隐患上报</view><view class="step-copy">{{ issue.reporter }} · {{ issue.createdAt }}</view><view class="step-copy">{{ issue.description }}</view></view></view><view class="timeline-row" :class="{ done: issue.rectification }"><view class="dot" /><view><view class="step-name">整改提交</view><view v-if="issue.rectification" class="step-copy">{{ issue.rectification.note }} · {{ issue.rectification.submittedAt }}</view><view v-else class="step-copy">等待市场营销部上传整改说明和现场照片</view></view></view><view class="timeline-row" :class="{ done: issue.status === '已闭环' }"><view class="dot" /><view><view class="step-name">安监复核与闭环</view><view class="step-copy">{{ issue.status === '已闭环' ? '已完成复核，闭环记录永久留存' : '复核后才可闭环' }}</view></view></view></view>
    <view v-if="canRectify" class="action-card"><view class="card-title">提交整改佐证</view><textarea v-model="rectification.note" placeholder="填写整改措施、现场情况和无法完成的原因" /><view class="upload-row"><view v-for="item in rectification.attachments" :key="item" class="thumb"><image :src="item" mode="aspectFill" /></view><view class="add-photo" @click="addPhotos">＋<text>上传照片</text></view></view><button class="primary" :disabled="!rectification.note" @click="submitRectification">提交安监复核</button></view>
    <view v-if="canReview" class="action-card review-card"><view class="card-title">安监复核</view><view class="review-note">请核对整改说明、现场照片和实际风险是否已消除。</view><button class="primary" @click="closeIssue">确认复核并闭环</button></view>
    <view v-if="demoStore.role === 'executive'" class="executive-note">高管模式只读：可查看重大隐患及闭环进度，不参与审批。</view>
  </view>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { demoStore } from '../../stores/demo'
import { chooseEvidenceImages } from '../../services/platform'
let issueId = ''
const issue = computed(() => demoStore.issues.find((item) => item.id === issueId))
const rectification = reactive({ note:'', attachments:[] })
const canRectify = computed(() => demoStore.role === 'marketing' && issue.value?.status === '待整改')
const canReview = computed(() => demoStore.role === 'safety' && issue.value?.status === '待复核')
onLoad((options) => { issueId = options.id })
function statusClass(status) { return ({ '待整改':'todo', '待复核':'review', '已闭环':'closed' })[status] }
async function addPhotos(){try{const res=await chooseEvidenceImages();rectification.attachments.push(...res.tempFilePaths)}catch{}}
function submitRectification(){demoStore.submitRectification(issueId,rectification);uni.showToast({title:'已提交复核',icon:'success'})}
function closeIssue(){demoStore.closeIssue(issueId);uni.showToast({title:'隐患已闭环',icon:'success'})}
</script>

<style lang="scss" scoped>
.detail-page{padding:28rpx}.issue-summary{background:#fff;border:1rpx solid #e0e8e3;border-radius:24rpx;padding:28rpx}.issue-summary.major{border-color:#f0beb9;box-shadow:inset 8rpx 0 #d83a2e}.topline{display:flex;gap:12rpx;align-items:center}.status,.major-tag{font-size:21rpx;padding:7rpx 12rpx;border-radius:8rpx}.todo{background:#fff2e9;color:#a65400}.review{background:#e8f0ff;color:#245eb4}.closed{background:#e9f5ed;color:#267444}.major-tag{background:#fff0ee;color:#c93228}.title{font-size:35rpx;font-weight:700;line-height:1.4;margin:22rpx 0 8rpx}.id,.summary-line,.step-copy{font-size:22rpx;color:#77837c;line-height:1.65}.summary-line{margin-top:6rpx}.timeline-title{font-size:32rpx;font-weight:700;margin:42rpx 0 18rpx}.timeline{padding-left:8rpx}.timeline-row{display:flex;gap:20rpx;position:relative;padding-bottom:34rpx}.timeline-row:not(:last-child)::before{content:'';position:absolute;left:11rpx;top:24rpx;width:2rpx;height:calc(100% - 3rpx);background:#d9e1dd}.dot{width:20rpx;height:20rpx;margin-top:7rpx;border:4rpx solid #b7c3bd;border-radius:50%;background:#f4f7f6;z-index:1}.timeline-row.done .dot{background:#006e55;border-color:#006e55}.step-name{font-size:27rpx;font-weight:650;margin-bottom:4rpx}.action-card{background:#fff;border:1rpx solid #dce6e1;border-radius:24rpx;padding:28rpx;margin-top:18rpx}.card-title{font-size:29rpx;font-weight:700;margin-bottom:18rpx}textarea{width:100%;height:130rpx;background:#f5f8f6;border-radius:14rpx;padding:18rpx;box-sizing:border-box;font-size:25rpx}.upload-row{display:flex;gap:14rpx;flex-wrap:wrap;margin:18rpx 0}.thumb,.add-photo{width:120rpx;height:120rpx;border-radius:14rpx;overflow:hidden}.thumb image{width:100%;height:100%}.add-photo{border:1rpx dashed #9ba9a1;color:#006e55;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:42rpx}.add-photo text{font-size:19rpx}.primary{background:#006e55;color:#fff;border-radius:16rpx;font-size:28rpx;height:90rpx;line-height:90rpx}.primary[disabled]{background:#b5c3bd}.review-note,.executive-note{font-size:23rpx;color:#617069;line-height:1.6;margin-bottom:18rpx}.executive-note{padding:24rpx;background:#eef3f1;border-radius:16rpx;margin-top:18rpx}
</style>
