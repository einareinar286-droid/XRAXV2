<template>
  <view class="detail-page">
    <view v-if="loading" class="state-card glass-panel">正在加载隐患详情…</view>
    <view v-else-if="error" class="state-card error glass-panel"><text>{{ error }}</text><button @click="loadIssue">重新加载</button></view>

    <template v-else-if="issue">
      <view class="detail-workbench">
        <view class="lifecycle-rail"><IssueLifecyclePath :status="issue.status" :deadline="issue.deadline" :is-major="issue.isMajor" /></view>

        <view class="task-main">
          <view class="mock-banner glass-panel"><text class="mock-banner-title">M2 Mock 演示</text><text>身份与数据仅保存在当前演示会话，不代表生产级鉴权或私有云存储。</text></view>

          <view class="issue-summary glass-panel" :class="{ major: issue.isMajor }">
            <view class="summary-topline"><view class="status" :class="statusClass(issue.status)">{{ issueStatusText(issue.status) }}</view><view v-if="issue.isMajor" class="major-tag">重大隐患</view><text class="issue-version">{{ issue.id }} · v{{ issue.version }}</text></view>
            <view class="title">{{ issue.title }}</view>
            <view class="summary-facts">
              <view class="summary-fact"><text class="fact-label">上报人员</text><text class="fact-value">{{ issue.reporter.displayName }}</text><text class="fact-note">{{ issue.reporter.department }}</text></view>
              <view class="summary-fact"><text class="fact-label">责任部门</text><text class="fact-value">{{ issue.assignee?.department || '等待安全监察交办' }}</text><text class="fact-note">{{ issue.assignee?.displayName || '受办人待确定' }}</text></view>
              <view class="summary-fact"><text class="fact-label">整改期限</text><text class="fact-value">{{ issue.deadline || '尚未设置' }}</text><text class="fact-note">{{ issue.deadline ? '请按期处理' : '交办后设定' }}</text></view>
              <view class="summary-fact"><text class="fact-label">现场位置</text><text class="fact-value">{{ issue.location }}</text><text class="fact-note">隐患发现位置</text></view>
            </view>
            <view class="description"><text class="description-label">现场描述</text><text>{{ issue.description }}</text></view>
          </view>

          <view v-if="canAssign" class="action-card glass-panel">
            <view class="card-heading"><text class="card-title">交办整改</text><text class="card-copy">确认责任部门和整改期限后，交办给市场营销部。</text></view>
            <picker mode="date" :value="assignment.deadline" @change="assignment.deadline=$event.detail.value"><view class="picker"><text>整改期限</text><text>{{ assignment.deadline }}</text></view></picker>
            <button class="primary" :loading="submitting" :disabled="submitting" @click="assign">交办市场营销部</button>
          </view>

          <view v-if="canRectify" class="action-card glass-panel">
            <view class="card-heading"><text class="card-title">{{ issue.status === 'REJECTED' ? '重新提交整改佐证' : '提交整改佐证' }}</text><text class="card-copy">填写措施并上传现场照片，提交后进入安全监察复核。</text></view>
            <textarea v-model="rectification.note" maxlength="1000" placeholder="填写整改措施、现场情况和无法完成的原因" />
            <view class="upload-row"><view v-for="item in rectification.attachments" :key="item.id" class="thumb"><image :src="item.previewUrl" mode="aspectFill" /></view><view v-if="rectification.attachments.length < 6" class="add-photo" @click="addPhotos"><view class="add-photo-mark" /><text>上传照片</text></view></view>
            <button class="primary" :loading="submitting" :disabled="submitting || (!rectification.note.trim() && rectification.attachments.length === 0)" @click="submit">提交安监复核</button>
          </view>

          <view v-if="canReview" class="action-card review-card glass-panel">
            <view class="card-heading"><text class="card-title">安监复核</text><text class="card-copy">退回整改必须填写原因；确认隐患消除后可执行闭环。</text></view>
            <textarea v-model="reviewNote" maxlength="1000" placeholder="退回时必须填写原因；闭环说明可选" />
            <view class="button-row"><button class="secondary danger" :disabled="submitting || !reviewNote.trim()" @click="review('REJECT')">退回整改</button><button class="primary compact" :loading="submitting" :disabled="submitting" @click="review('CLOSE')">确认闭环</button></view>
          </view>

          <view v-if="canReopen" class="action-card glass-panel">
            <view class="card-heading"><text class="card-title">管理员留痕重开</text><text class="card-copy">重开后将回到待交办状态，并保留完整审计记录。</text></view>
            <textarea v-model="reviewNote" maxlength="1000" placeholder="必须填写重开原因" />
            <button class="secondary danger full" :loading="submitting" :disabled="submitting || !reviewNote.trim()" @click="review('REOPEN')">重开并返回待交办</button>
          </view>
        </view>

        <view class="evidence-audit">
          <view class="side-card glass-panel">
            <view class="side-card-heading"><text class="side-card-title">证据材料</text><text class="side-card-count">{{ evidenceAttachments.length }} 项</text></view>
            <view v-if="evidenceAttachments.length" class="evidence-grid"><view v-for="item in evidenceAttachments" :key="item.id" class="evidence-item"><image v-if="item.mimeType?.startsWith('image/')" :src="item.previewUrl" mode="aspectFill" /><text v-else>{{ attachmentLabel(item) }}</text></view></view>
            <view v-else class="side-empty">当前隐患尚未附带现场照片</view>
          </view>

          <view class="side-card audit-card glass-panel">
            <view class="side-card-heading"><text class="side-card-title">处理记录</text><text class="side-card-count">追加审计</text></view>
            <view v-if="!events.length" class="side-empty">暂无审计事件</view>
            <view v-else class="timeline"><view v-for="event in events" :key="event.id" class="timeline-row"><view class="dot" /><view class="timeline-copy"><text class="step-name">{{ actionText(event.action) }}</text><text class="step-copy">{{ issueRoleText(event.actorRole) }} · {{ formatTime(event.occurredAt) }}</text><text class="step-copy">{{ statusChangeText(event) }}</text></view></view></view>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import IssueLifecyclePath from '../../components/issues/IssueLifecyclePath.vue'
import { assignIssue, createRequestId, getCurrentUser, getIssue, issueRoleText, issueStatusText, listAuditEvents, reviewIssue, submitRectification } from '../../services/issues/index.mjs'
import { chooseEvidenceImages, normalizeEvidenceAttachments } from '../../services/platform'

let issueId = ''
const issue = ref(null), currentUser = ref(null), events = ref([]), loading = ref(true), error = ref(''), submitting = ref(false), reviewNote = ref('')
const assignment = reactive({ deadline: defaultDeadline() })
const rectification = reactive({ note: '', attachments: [] })
const evidenceAttachments = computed(() => [...(issue.value?.attachments || []), ...(issue.value?.rectification?.attachments || [])])
const canAssign = computed(() => ['SAFETY_OFFICER', 'SUPER_ADMIN'].includes(currentUser.value?.role) && issue.value?.status === 'REPORTED')
const canRectify = computed(() => currentUser.value?.role === 'MARKETING_OFFICER' && ['ASSIGNED', 'REJECTED'].includes(issue.value?.status))
const canReview = computed(() => ['SAFETY_OFFICER', 'SUPER_ADMIN'].includes(currentUser.value?.role) && issue.value?.status === 'RECTIFICATION_SUBMITTED')
const canReopen = computed(() => currentUser.value?.role === 'SUPER_ADMIN' && issue.value?.status === 'CLOSED')

function defaultDeadline(){const date=new Date();date.setDate(date.getDate()+7);const year=date.getFullYear();const month=String(date.getMonth()+1).padStart(2,'0');const day=String(date.getDate()).padStart(2,'0');return `${year}-${month}-${day}`}
function statusClass(status){return({REPORTED:'reported',ASSIGNED:'todo',RECTIFICATION_SUBMITTED:'review',REJECTED:'rejected',CLOSED:'closed'})[status]}
function actionText(action){return({REPORT:'隐患上报',ASSIGN:'交办整改',SUBMIT_RECTIFICATION:'提交整改',REJECT:'退回整改',CLOSE:'复核闭环',REOPEN:'管理员重开'})[action]||action}
function attachmentLabel(item){return String(item.name||'附件').split('.').pop()?.toUpperCase()||'附件'}
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
.detail-page{padding:28rpx 28rpx 64rpx;background:transparent;min-height:100vh}
.detail-workbench{display:grid;gap:18rpx}
.lifecycle-rail,.task-main,.evidence-audit{min-width:0}
.task-main,.evidence-audit{display:flex;flex-direction:column;gap:18rpx}
.mock-banner{padding:20rpx 22rpx;border:1rpx solid rgba(255,210,138,.35);border-radius:18rpx;background:rgba(255,210,138,.08);color:$xr-amber;font-size:22rpx;line-height:1.6}
.mock-banner-title{display:block;font-size:24rpx;font-weight:700;margin-bottom:2rpx}
.issue-summary,.action-card,.side-card{border-radius:24rpx;padding:28rpx;box-sizing:border-box}
.issue-summary.major{border-color:rgba(255,180,171,.5);box-shadow:$xr-red-glow}
.summary-topline{display:flex;gap:12rpx;align-items:center}
.status,.major-tag{font-size:21rpx;padding:7rpx 12rpx;border-radius:9rpx}
.reported{background:rgba(255,172,232,.12);color:$xr-magenta}
.todo{background:rgba(255,210,138,.12);color:$xr-amber}
.review{background:rgba(99,247,255,.12);color:$xr-green-bright}
.rejected{background:rgba(255,180,171,.14);color:$xr-red}
.closed{background:rgba(168,240,154,.12);color:$xr-lime}
.major-tag{background:rgba(255,180,171,.14);color:$xr-red;font-weight:700}
.issue-version{margin-left:auto;color:$xr-muted;font-size:20rpx}
.title{font-size:38rpx;line-height:1.4;font-weight:750;color:$xr-text;margin:22rpx 0}
.summary-facts{display:grid;grid-template-columns:1fr 1fr;border-top:1rpx solid $xr-line;border-left:1rpx solid $xr-line}
.summary-fact{padding:18rpx;border-right:1rpx solid $xr-line;border-bottom:1rpx solid $xr-line;min-width:0}
.fact-label,.fact-note{display:block;font-size:20rpx;color:$xr-muted;line-height:1.45}
.fact-value{display:block;margin:5rpx 0;font-size:24rpx;line-height:1.4;font-weight:650;color:$xr-text;word-break:break-word}
.description{margin-top:22rpx;padding-top:20rpx;border-top:1rpx solid $xr-line;font-size:25rpx;line-height:1.75;color:$xr-text}
.description-label{display:block;margin-bottom:8rpx;font-size:21rpx;color:$xr-muted}
.card-heading{margin-bottom:18rpx}
.card-title{display:block;font-size:30rpx;font-weight:700;color:$xr-text}
.card-copy{display:block;margin-top:6rpx;font-size:22rpx;line-height:1.6;color:$xr-muted}
.picker{display:flex;justify-content:space-between;padding:20rpx;border-radius:14rpx;background:rgba(255,255,255,.04);border:1rpx solid $xr-line;font-size:24rpx;color:$xr-text}
textarea{width:100%;height:142rpx;padding:18rpx;box-sizing:border-box;border-radius:14rpx;background:rgba(255,255,255,.04);border:1rpx solid $xr-line;font-size:25rpx;color:$xr-text}
.upload-row{display:flex;flex-wrap:wrap;gap:14rpx;margin-top:16rpx}
.thumb,.add-photo{width:120rpx;height:120rpx;border-radius:14rpx;overflow:hidden}
.thumb image{width:100%;height:100%}
.add-photo{display:flex;flex-direction:column;align-items:center;justify-content:center;border:1rpx dashed $xr-line-strong;color:$xr-green-bright;font-size:20rpx;background:rgba(255,255,255,.02)}
.add-photo-mark{width:28rpx;height:28rpx;border:3rpx solid currentColor;border-radius:8rpx;position:relative;margin-bottom:8rpx}
.add-photo-mark::after,.add-photo-mark::before{content:'';position:absolute;left:50%;top:50%;background:currentColor;transform:translate(-50%,-50%)}
.add-photo-mark::after{width:14rpx;height:3rpx}
.add-photo-mark::before{width:3rpx;height:14rpx}
.primary,.secondary{height:88rpx;line-height:88rpx;margin-top:18rpx;border-radius:16rpx;font-size:27rpx}
.primary{background:$xr-green-bright;color:$xr-text-inverse;font-weight:700;box-shadow:$xr-cyan-glow}
.primary[disabled],.secondary[disabled]{opacity:.4;box-shadow:none}
.secondary{background:rgba(255,255,255,.04);border:1rpx solid $xr-line-strong;color:$xr-text}
.secondary.danger{border-color:rgba(255,180,171,.5);color:$xr-red}
.secondary.full{width:100%}
.button-row{display:grid;grid-template-columns:1fr 1fr;gap:16rpx}
.button-row button{width:100%}
.side-card-heading{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:18rpx}
.side-card-title{font-size:29rpx;font-weight:700;color:$xr-text}
.side-card-count{font-size:21rpx;color:$xr-muted}
.evidence-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10rpx}
.evidence-grid image{width:100%;aspect-ratio:1;border-radius:12rpx;background:rgba(255,255,255,.04)}
.side-empty{padding:32rpx 10rpx;text-align:center;color:$xr-muted;font-size:22rpx}
.timeline-row{display:flex;gap:16rpx;position:relative;padding-bottom:26rpx}
.timeline-row:not(:last-child)::before{content:'';position:absolute;left:9rpx;top:24rpx;width:2rpx;height:calc(100% - 2rpx);background:$xr-line}
.dot{flex:0 0 auto;width:18rpx;height:18rpx;margin-top:7rpx;border-radius:50%;background:$xr-green-bright;box-shadow:0 0 0 5rpx rgba(99,247,255,.15)}
.timeline-copy{min-width:0}
.step-name{display:block;font-size:25rpx;font-weight:700;color:$xr-text}
.step-copy{display:block;margin-top:4rpx;font-size:21rpx;line-height:1.5;color:$xr-muted}
.state-card{text-align:center;padding:80rpx 28rpx;color:$xr-muted;border-radius:20rpx}
.state-card.error{color:$xr-red}
.state-card button{margin-top:18rpx;background:rgba(99,247,255,.12);color:$xr-green-bright;font-size:24rpx;border:1rpx solid rgba(99,247,255,.35)}
.evidence-item{width:100%;aspect-ratio:1;border-radius:12rpx;background:rgba(255,255,255,.04);overflow:hidden;display:flex;align-items:center;justify-content:center;color:$xr-green-bright;font-size:20rpx;font-weight:700}
.evidence-item image{width:100%;height:100%}
@media (min-width:1200px){.detail-page{padding:32px;min-height:100vh;background:transparent}.detail-workbench{grid-template-columns:240px minmax(0,1fr) 340px;gap:18px;max-width:1520px;margin:0 auto}.lifecycle-rail{position:sticky;top:24px;align-self:start}.mock-banner{padding:16px 18px;font-size:13px;background:rgba(255,210,138,.08);border-color:rgba(255,210,138,.35);color:$xr-amber}.mock-banner-title{font-size:14px}.issue-summary,.action-card,.side-card{padding:24px}.title,.card-title,.side-card-title,.fact-value,.description,.step-name{color:$xr-text}.issue-version,.fact-label,.fact-note,.description-label,.card-copy,.side-card-count,.side-empty,.step-copy{color:$xr-muted}.summary-facts,.summary-fact{border-color:$xr-line}.picker,textarea{background:rgba(255,255,255,.04);color:$xr-text;border-color:$xr-line}.primary{background:$xr-green-bright}.secondary{background:rgba(255,255,255,.04);border-color:$xr-line-strong;color:$xr-text}.evidence-grid image{background:rgba(255,255,255,.04)}.timeline-row:not(:last-child)::before{background:$xr-line}.dot{box-shadow:0 0 0 5px rgba(99,247,255,.15)}.status,.major-tag{font-size:12px}.issue-version{font-size:12px}.title{font-size:30px}.summary-fact{padding:14px}.fact-label,.fact-note,.description-label{font-size:12px}.fact-value{font-size:15px}.description{font-size:15px}.card-title,.side-card-title{font-size:18px}.card-copy,.side-card-count,.side-empty,.step-copy{font-size:13px}.picker{padding:14px;font-size:14px}.primary,.secondary{height:46px;line-height:46px;font-size:15px}.timeline-row{gap:14px}.step-name{font-size:15px}.dot{width:14px;height:14px}.evidence-audit{position:sticky;top:24px;align-self:start}.issue-summary.major{border-color:rgba(255,180,171,.5)}}
@media (prefers-reduced-motion:no-preference){.issue-summary,.action-card,.side-card{animation:panel-in 220ms ease-out both}@keyframes panel-in{from{opacity:.7;transform:translateY(8rpx)}to{opacity:1;transform:translateY(0)}}}
@media (prefers-reduced-motion:reduce){.issue-summary,.action-card,.side-card{animation:none}}
</style>
