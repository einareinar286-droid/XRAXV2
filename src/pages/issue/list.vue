<template>
  <AppFrame active="issues">
    <view class="xr-content issue-list-page">
      <view class="list-heading"><view><view class="xr-page-title">隐患管理</view><view class="xr-page-copy">按风险、状态和责任部门查看交办与整改进度。</view></view><button v-if="demoStore.can('issue-create')" class="xr-btn xr-btn-secondary" @click="create">＋ 新建隐患</button></view>
      <view v-if="!allowed" class="xr-card xr-denied"><view class="xr-section-title">无整改单处理权限</view><view class="xr-caption denied-copy">你可以上报隐患、填写本人履职，并在授权范围内只读查看公开进度。</view><button class="xr-btn xr-btn-primary" @click="back">返回工作台</button></view>
      <template v-else>
        <view class="filter-board xr-card"><view class="xr-filter-row"><view v-for="item in filters" :key="item.value" class="xr-filter" :class="{active:status===item.value}" @click="status=item.value">{{ item.label }}</view></view><view class="search-row"><input v-model="keyword" class="xr-input" placeholder="搜索隐患编号、描述或责任人"/><text class="clear" v-if="keyword" @click="keyword=''">清除</text></view></view>
        <view class="xr-card issue-table"><view class="table-row table-head"><text>隐患编号</text><text>隐患说明</text><text>风险</text><text>状态</text><text>责任部门</text><text>期限</text><text>操作</text></view><view v-for="issue in rows" :key="issue.id" class="table-row" :class="{major:issue.major}" @click="open(issue.id)"><text class="issue-id">{{ issue.id }}</text><view class="issue-copy"><text>{{ issue.title }}</text><text>{{ issue.location }}</text></view><view><view class="xr-status" :class="issue.major?'xr-status-major':'xr-status-warning'">{{ issue.major ? '重大' : '一般' }}</view></view><view><view class="xr-status" :class="statusClass(issue.status)">{{ issue.status }}</view></view><text>{{ issue.assigneeDept || '待交办' }}</text><text :class="{overdue:issue.status==='已逾期'}">{{ issue.deadline }}</text><button class="table-action" @click.stop="open(issue.id)">查看</button></view><view v-if="!rows.length" class="xr-empty">当前筛选没有隐患记录</view></view>
      </template>
    </view>
  </AppFrame>
</template>

<script setup>
import { computed, ref } from 'vue'
import AppFrame from '../../components/AppFrame.vue'
import { demoStore } from '../../stores/demo'
const status=ref(''), keyword=ref('')
const allowed=computed(()=>demoStore.can('issue-list'))
const filters=[{label:'全部状态',value:''},{label:'待交办',value:'待交办'},{label:'待整改',value:'待整改'},{label:'待复核',value:'待复核'},{label:'已逾期',value:'已逾期'},{label:'已闭环',value:'已闭环'}]
const rows=computed(()=>demoStore.visibleIssues({includeClosed:true}).filter((item)=>{const target=`${item.id}${item.title}${item.assignee}${item.assigneeDept}`.toLowerCase();return (!status.value||item.status===status.value)&&(!keyword.value||target.includes(keyword.value.toLowerCase()))}))
function statusClass(value){return ({'待交办':'xr-status-muted','待整改':'xr-status-warning','待复核':'xr-status-review','已逾期':'xr-status-major','已闭环':'xr-status-closed'})[value]||'xr-status-info'}
function open(id){uni.navigateTo({url:`/pages/issue/detail?id=${id}`})} function create(){uni.switchTab({url:'/pages/issue/create'})} function back(){uni.switchTab({url:'/pages/index/index'})}
</script>

<style lang="scss" scoped>
.list-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:16rpx;margin:5rpx 0 24rpx}.filter-board{padding:16rpx;margin-bottom:16rpx}.search-row{position:relative}.search-row .xr-input{padding-right:70rpx}.clear{position:absolute;right:17rpx;top:21rpx;color:#003c90;font-size:19rpx}.issue-table{overflow:hidden}.table-row{display:grid;grid-template-columns:1fr;gap:9rpx;padding:18rpx;border-bottom:1rpx solid #eef1f4}.table-row.major{box-shadow:inset 5rpx 0 #ef4444}.table-head{display:none}.issue-id{font-size:18rpx;color:#78818e}.issue-copy text:first-child{display:block;color:#222934;font-size:24rpx;font-weight:680}.issue-copy text:last-child{display:block;margin-top:4rpx;color:#8b939e;font-size:18rpx;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.table-row>text:not(.issue-id),.table-row>view:not(.issue-copy){font-size:19rpx;color:#66707d}.table-action{padding:0;color:#003c90;text-align:left;font-size:20rpx;font-weight:700}.overdue{color:#d43838!important}.denied-copy{margin:12rpx 0 20rpx}.xr-denied .xr-btn{margin-top:6rpx}@media(min-width:900px){.list-heading{margin:0 0 18px}.filter-board{padding:14px;margin-bottom:14px}.search-row{width:300px}.search-row .xr-input{padding-right:55px}.clear{right:12px;top:11px;font-size:10px}.table-row{grid-template-columns:1.1fr 2.25fr .65fr .85fr 1fr .75fr .45fr;align-items:center;gap:12px;padding:13px 16px}.table-head{display:grid;background:#f7f9fb;color:#818a96;font-size:10px}.table-head text{font-size:10px!important}.issue-id{font-size:10px}.issue-copy text:first-child{font-size:12px}.issue-copy text:last-child{font-size:10px}.table-row>text:not(.issue-id),.table-row>view:not(.issue-copy){font-size:11px}.table-action{text-align:center;font-size:10px}.denied-copy{margin:8px 0 14px}}
</style>
