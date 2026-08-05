<template>
  <view v-if="task" class="page"><view class="summary glass-panel"><text class="status" :class="task.status.toLowerCase()">{{ dutyStatusText(task.status) }}</text><text class="title">{{ task.title }}</text><text class="copy">{{ task.department }} · {{ periodLabel }} · {{ cycleRangeText }}</text></view><view class="form glass-panel"><text class="label">履职说明</text><textarea v-model="form.note" :disabled="!canSubmit" maxlength="1000" placeholder="填写完成的工作内容、检查范围和发现问题" /><text class="label">现场佐证</text><view class="files"><view v-for="file in form.attachments" :key="file.id" class="file">{{ file.name }}</view><view v-if="canSubmit" class="upload" @click="choose">＋<text>照片</text></view></view><text class="hint">当前 Mock 演示支持本地附件元数据校验；生产版将接入私有附件存储。</text><text v-if="task.review?.note" class="review-note">审核意见：{{ task.review.note }}</text></view><button v-if="canSubmit" class="primary" :loading="submitting" :disabled="submitting || !form.note.trim()" @click="save">提交履职记录，进入审核</button><view v-else class="readonly">{{ task.status==='SUBMITTED'?'已提交，等待部门审核。':'本次履职已审核通过，原记录只读保留。' }}</view></view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { chooseEvidenceImages, normalizeEvidenceAttachments } from '../../services/platform'
import { dutyStatusText, listMyDuties, submitDuty } from '../../services/duty'
import { PERIOD_TYPE_LABELS } from '../../domain/duties/periods.mjs'

const id = ref('')
const tasks = ref([])
const form = reactive({ note:'', attachments:[] })
const submitting = ref(false)
const task = computed(() => tasks.value.find((item) => item.id === id.value))
const canSubmit = computed(() => ['PENDING', 'RETURNED'].includes(task.value?.status))
const periodLabel = computed(() => task.value?.periodType ? PERIOD_TYPE_LABELS[task.value.periodType] || task.value.periodType : '')
const cycleRangeText = computed(() => task.value?.cycleStart ? `${task.value.cycleStart} 至 ${task.value.cycleEnd || task.value.dueDate}` : task.value?.dueDate ? `截止 ${task.value.dueDate}` : '')
async function load(){tasks.value=await listMyDuties();const current=task.value;if(current){form.note=current.evidence?.note||'';form.attachments=current.evidence?.attachments||[]}}
async function choose(){try{const result=await chooseEvidenceImages();form.attachments.push(...normalizeEvidenceAttachments(result).slice(0,6-form.attachments.length))}catch{}}
async function save(){if(submitting.value)return;submitting.value=true;try{await submitDuty(id.value,{note:form.note,attachments:form.attachments});uni.showToast({title:'已提交审核',icon:'success'});setTimeout(()=>uni.navigateBack(),450)}catch(err){uni.showToast({title:err.message||'提交失败',icon:'none'})}finally{submitting.value=false}}
onLoad(async(options)=>{id.value=options.id||'';await load()})
</script>

<style lang="scss" scoped>
.page{min-height:100vh;padding:30rpx 28rpx 64rpx;background:transparent}
.summary,.form{padding:27rpx;border-radius:22rpx;background:$xr-glass-bg;border:1rpx solid $xr-line}
.form{margin-top:18rpx}
.status{display:inline-block;padding:6rpx 10rpx;border-radius:8rpx;background:rgba(99,247,255,.1);color:$xr-green-bright;font-size:20rpx;border:1rpx solid rgba(99,247,255,.3)}
.status.submitted{background:rgba(168,240,154,.1);color:$xr-lime;border-color:rgba(168,240,154,.35)}
.status.returned{background:rgba(255,180,171,.12);color:$xr-red;border-color:rgba(255,180,171,.4)}
.title,.copy{display:block}
.title{margin:18rpx 0 8rpx;font-size:35rpx;font-weight:740;color:$xr-text}
.copy,.hint,.readonly{font-size:22rpx;color:$xr-muted;line-height:1.6}
.label{display:block;margin-bottom:12rpx;font-size:26rpx;font-weight:680;color:$xr-text}
.label:not(:first-child){margin-top:28rpx}
textarea{box-sizing:border-box;width:100%;height:170rpx;padding:18rpx;border-radius:14rpx;background:rgba(255,255,255,.04);border:1rpx solid $xr-line;font-size:25rpx;color:$xr-text}
.files{display:flex;flex-wrap:wrap;gap:12rpx}
.file,.upload{min-width:112rpx;height:88rpx;padding:10rpx;box-sizing:border-box;border-radius:12rpx;background:rgba(255,255,255,.05);border:1rpx solid $xr-line;color:$xr-green-bright;font-size:20rpx;display:flex;align-items:center;justify-content:center;text-align:center}
.upload{border:1rpx dashed $xr-line-strong;background:transparent;flex-direction:column;font-size:34rpx}
.upload text{font-size:19rpx}
.hint{display:block;margin-top:14rpx}
.review-note{display:block;margin-top:20rpx;padding:16rpx;border-radius:12rpx;background:rgba(255,180,171,.1);border:1rpx solid rgba(255,180,171,.4);color:$xr-red;font-size:22rpx;line-height:1.55}
.primary{height:92rpx;line-height:92rpx;margin-top:22rpx;border-radius:16rpx;background:$xr-green-bright;color:$xr-text-inverse;font-size:28rpx;font-weight:700;box-shadow:$xr-cyan-glow}
.readonly{margin-top:22rpx;padding:20rpx;border-radius:16rpx;background:rgba(255,255,255,.04);border:1rpx solid $xr-line}
@media (min-width:1200px){.page{max-width:820px;margin:0 auto;padding:36px 32px}.summary,.form{padding:25px}.status,.file,.upload{font-size:12px}.title{font-size:26px}.copy,.hint,.readonly,.review-note{font-size:13px}.label{font-size:16px}textarea{font-size:15px}.primary{height:48px;line-height:48px;font-size:15px}}
</style>
