<template>
  <view class="detail-page">
    <view v-if="loading" class="state-card">正在加载隐患详情…</view>
    <view v-else-if="error" class="state-card error"><text>{{ error }}</text><button @click="loadIssue">重新加载</button></view>
    <template v-else-if="issue">
      <view class="mock-banner">M1 Mock 演示 · 身份与数据仅保存在当前演示会话，不代表生产级鉴权或私有云存储。</view>
      <view class="issue-summary" :class="{ major: issue.isMajor }">
        <view class="topline"><view class="status" :class="statusClass(issue.status)">{{ issueStatusText(issue.status) }}</view><view v-if="issue.isMajor" class="major-tag">重大隐患</view></view>
        <view class="title">{{ issue.title }}</view><view class="id">{{ issue.id }} · v{{ issue.version }}</view>
        <view class="summary-line">上报：{{ issue.reporter.displayName }}（{{ issue.reporter.department }}）</view>
        <view class="summary-line">交办：{{ issue.assignee ? `${issue.assignee.displayName}（${issue.assignee.department}）` : '尚未交办' }}</view>
        <view class="summary-line">期限：{{ issue.deadline || '尚未设置' }}</view>
        <view class="summary-line">位置：{{ issue.location }}</view>
        <view class="description">{{ issue.description }}</view>
        <view v-if="issue.attachments.length" class="evidence-row"><image v-for="item in issue.attachments" :key="item.id" :src="item.previewUrl" mode="aspectFill" /></view>
      </view>

      <view v-if="canAssign" class="action-card">
        <view class="card-title">交办整改</view>
        <view class="action-copy">受办人固定为 Mock 身份“市场整改员”，服务层仍会校验部门与当前操作者。</view>
        <picker mode="date" :value="assignment.deadline" @change="assignment.deadline=$event.detail.value"><view class="picker">整改期限 <text>{{ assignment.deadline }}</text></view></picker>
        <button class="primary" :loading="submitting" :disabled="submitting" @click="assign">交办市场营销部</button>
      </view>

      <view v-if="canRectify" class="action-card">
        <view class="card-title">{{ issue.status==='REJECTED' ? '重新提交整改佐证' : '提交整改佐证' }}</view>
        <textarea v-model="rectification.note" maxlength="1000" placeholder="填写整改措施、现场情况和无法完成的原因" />
        <view class="upload-row"><view v-for="item in rectification.attachments" :key="item.id" class="thumb"><image :src="item.previewUrl" mode="aspectFill" /></view><view v-if="rectification.attachments.length<6" class="add-photo" @click="addPhotos">＋<text>上传照片</text></view></view>
        <button class="primary" :loading="submitting" :disabled="submitting||!rectification.note.trim()" @click="submit">提交安监复核</button>
      </view>

      <view v-if="canReview" class="action-card review-card">
        <view class="card-title">安监复核</view>
        <textarea v-model="reviewNote" maxlength="1000" placeholder="退回时必须填写原因；闭环说明可选" />
        <view class="button-row"><button class="secondary danger" :disabled="submitting||!reviewNote.trim()" @click="review('REJECT')">退回整改</button><button class="primary compact" :loading="submitting" :disabled="submitting" @click="review('CLOSE')">确认闭环</button></view>
      </view>

      <view v-if="canReopen" class="action-card">
        <view class="card-title">管理员留痕重开</view>
        <textarea v-model="reviewNote" maxlength="1000" placeholder="必须填写重开原因" />
        <button class="secondary danger full" :loading="submitting" :disabled="submitting||!reviewNote.trim()" @click="review('REOPEN')">重开并返回待交办</button>
      </view>

      <view v-if="currentUser?.role==='EXECUTIVE_READONLY'" class="readonly-note">高管身份为只读模式，可查看受办范围内的进度，不能调用任何写接口。</view>

      <view class="timeline-title">追加式审计时间线</view>
      <view v-if="!events.length" class="state-card">暂无审计事件</view>
      <view v-else class="timeline"><view v-for="event in events" :key="event.id" class="timeline-row"><view class="dot" /><view><view class="step-name">{{ actionText(event.action) }}</view><view class="step-copy">{{ issueRoleText(event.actorRole) }} · {{ formatTime(event.occurredAt) }}</view><view class="step-copy">{{ statusChangeText(event) }}</view></view></view></view>
    </template>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { assignIssue, createRequestId, getCurrentUser, getIssue, issueRoleText, issueStatusText, listAuditEvents, reviewIssue, submitRectification } from '../../services/issues/index.mjs'
import { chooseEvidenceImages, normalizeEvidenceAttachments } from '../../services/platform'

let issueId=''
const issue=ref(null),currentUser=ref(null),events=ref([]),loading=ref(true),error=ref(''),submitting=ref(false),reviewNote=ref('')
const assignment=reactive({deadline:defaultDeadline()})
const rectification=reactive({note:'',attachments:[]})
const canAssign=computed(()=>['SAFETY_INSPECTOR','SAFETY_ADMIN'].includes(currentUser.value?.role)&&issue.value?.status==='REPORTED')
const canRectify=computed(()=>currentUser.value?.role==='MARKETING_RECTIFIER'&&['ASSIGNED','REJECTED'].includes(issue.value?.status))
const canReview=computed(()=>['SAFETY_INSPECTOR','SAFETY_ADMIN'].includes(currentUser.value?.role)&&issue.value?.status==='RECTIFICATION_SUBMITTED')
const canReopen=computed(()=>currentUser.value?.role==='SAFETY_ADMIN'&&issue.value?.status==='CLOSED')

function defaultDeadline(){const date=new Date();date.setDate(date.getDate()+7);const year=date.getFullYear();const month=String(date.getMonth()+1).padStart(2,'0');const day=String(date.getDate()).padStart(2,'0');return `${year}-${month}-${day}`}
function statusClass(status){return({REPORTED:'reported',ASSIGNED:'todo',RECTIFICATION_SUBMITTED:'review',REJECTED:'rejected',CLOSED:'closed'})[status]}
function actionText(action){return({REPORT:'隐患上报',ASSIGN:'交办整改',SUBMIT_RECTIFICATION:'提交整改',REJECT:'退回整改',CLOSE:'复核闭环',REOPEN:'管理员重开'})[action]||action}
function formatTime(value){return value?String(value).replace('T',' ').replace('.000Z',''):''}
function statusChangeText(event){return event.fromStatus?`${issueStatusText(event.fromStatus)} → ${issueStatusText(event.toStatus)}`:issueStatusText(event.toStatus)}
async function loadIssue(){if(!issueId)return;loading.value=true;error.value='';try{currentUser.value=await getCurrentUser();issue.value=await getIssue(issueId);events.value=await listAuditEvents(issueId)}catch(err){issue.value=null;events.value=[];error.value=err.message||'详情加载失败'}finally{loading.value=false}}
async function addPhotos(){try{const result=await chooseEvidenceImages();rectification.attachments.push(...normalizeEvidenceAttachments(result).slice(0,6-rectification.attachments.length))}catch{}}
async function runWrite(work,successText){if(submitting.value)return;submitting.value=true;try{await work();uni.showToast({title:successText,icon:'success'});rectification.note='';rectification.attachments=[];reviewNote.value='';await loadIssue()}catch(err){if(err.code==='VERSION_CONFLICT')await loadIssue();uni.showToast({title:err.code==='VERSION_CONFLICT'?'数据已更新，请重新操作':(err.message||'操作失败'),icon:'none'})}finally{submitting.value=false}}
function assign(){return runWrite(()=>assignIssue(issueId,{assigneeUid:'marketing-001',assigneeDepartment:'市场营销部',deadline:assignment.deadline,version:issue.value.version,requestId:createRequestId('assign')}),'已交办整改')}
function submit(){return runWrite(()=>submitRectification(issueId,{note:rectification.note,attachments:rectification.attachments,version:issue.value.version,requestId:createRequestId('rectify')}),'整改已提交')}
function review(decision){const title=decision==='CLOSE'?'隐患已闭环':decision==='REJECT'?'已退回整改':'隐患已重开';return runWrite(()=>reviewIssue(issueId,{decision,note:reviewNote.value,version:issue.value.version,requestId:createRequestId(decision.toLowerCase())}),title)}
onLoad((options)=>{issueId=options.id||''})
onShow(loadIssue)
</script>

<style lang="scss" scoped>
.detail-page{padding:28rpx 28rpx 64rpx}.mock-banner,.readonly-note{padding:22rpx 24rpx;border-radius:16rpx;background:#fff8df;color:#765d14;font-size:22rpx;line-height:1.6;margin-bottom:18rpx}.issue-summary{background:#fff;border:1rpx solid #e0e8e3;border-radius:24rpx;padding:28rpx}.issue-summary.major{border-color:#f0beb9;box-shadow:inset 8rpx 0 #d83a2e}.topline{display:flex;gap:12rpx;align-items:center}.status,.major-tag{font-size:21rpx;padding:7rpx 12rpx;border-radius:8rpx}.reported{background:#f1edff;color:#6550a4}.todo{background:#fff2e9;color:#a65400}.review{background:#e8f0ff;color:#245eb4}.rejected{background:#fff0ee;color:#c93228}.closed{background:#e9f5ed;color:#267444}.major-tag{background:#fff0ee;color:#c93228}.title{font-size:35rpx;font-weight:700;line-height:1.4;margin:22rpx 0 8rpx}.id,.summary-line,.step-copy,.action-copy{font-size:22rpx;color:#77837c;line-height:1.65}.summary-line{margin-top:6rpx}.description{font-size:25rpx;line-height:1.75;margin-top:20rpx;padding-top:18rpx;border-top:1rpx solid #edf1ef}.evidence-row,.upload-row{display:flex;gap:14rpx;flex-wrap:wrap;margin-top:18rpx}.evidence-row image,.thumb,.add-photo{width:120rpx;height:120rpx;border-radius:14rpx;overflow:hidden}.thumb image{width:100%;height:100%}.action-card{background:#fff;border:1rpx solid #dce6e1;border-radius:24rpx;padding:28rpx;margin-top:18rpx}.card-title{font-size:29rpx;font-weight:700;margin-bottom:16rpx}.action-copy{margin-bottom:16rpx}.picker{display:flex;justify-content:space-between;background:#f5f8f6;padding:20rpx;border-radius:14rpx;margin-bottom:18rpx;font-size:24rpx}textarea{width:100%;height:130rpx;background:#f5f8f6;border-radius:14rpx;padding:18rpx;box-sizing:border-box;font-size:25rpx}.add-photo{border:1rpx dashed #9ba9a1;color:#006e55;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:42rpx}.add-photo text{font-size:19rpx}.primary,.secondary{border-radius:16rpx;font-size:27rpx;height:88rpx;line-height:88rpx;margin-top:18rpx}.primary{background:#006e55;color:#fff}.primary[disabled],.secondary[disabled]{opacity:.45}.secondary{background:#fff;border:1rpx solid #cfd9d4;color:#405047}.secondary.danger{border-color:#e3b0ac;color:#b8322a}.secondary.full{width:100%}.button-row{display:grid;grid-template-columns:1fr 1fr;gap:16rpx}.button-row button{width:100%}.timeline-title{font-size:32rpx;font-weight:700;margin:42rpx 0 18rpx}.timeline{padding-left:8rpx}.timeline-row{display:flex;gap:20rpx;position:relative;padding-bottom:34rpx}.timeline-row:not(:last-child)::before{content:'';position:absolute;left:11rpx;top:24rpx;width:2rpx;height:calc(100% - 3rpx);background:#d9e1dd}.dot{width:20rpx;height:20rpx;margin-top:7rpx;border:4rpx solid #006e55;border-radius:50%;background:#006e55;z-index:1}.step-name{font-size:27rpx;font-weight:650;margin-bottom:4rpx}.readonly-note{background:#eef3f1;color:#52625a;margin:18rpx 0 0}.state-card{text-align:center;padding:80rpx 28rpx;color:#7d8983;background:#fff;border-radius:20rpx}.state-card.error{color:#a7372f}.state-card button{margin-top:18rpx;background:#e7f2ed;color:#006e55;font-size:24rpx}
</style>
