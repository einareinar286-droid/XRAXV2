<template>
  <view class="page">
    <view class="header"><view class="eyebrow">安全监察部 · 管理员</view><view class="title">安全履职总览</view><view class="copy">按状态、部门、分类筛选；普通员工无法进入本页。</view></view>
    <scroll-view scroll-x class="filters"><view v-for="x in statusOptions" :key="x.value" class="chip" :class="{active:status===x.value}" @click="change('status',x.value)">{{ x.label }}</view></scroll-view>
    <scroll-view scroll-x class="filters"><view v-for="x in categoryOptions" :key="x.value" class="chip" :class="{active:category===x.value}" @click="change('category',x.value)">{{ x.label }}</view></scroll-view>
    <view class="filters two"><view v-for="x in departmentOptions" :key="x" class="chip" :class="{active:department===x}" @click="change('department',x)">{{ x }}</view></view>
    <view class="summary"><view><text>{{ total }}</text><span>匹配记录</span></view><view><text>{{ done }}</text><span>本页已完成</span></view><view><text>{{ overdue }}</text><span>本页已逾期</span></view></view>
    <view v-for="row in rows" :key="row.id" class="row"><view class="top"><view class="name">{{ row.ownerName }}</view><view class="status" :class="row.status.toLowerCase()">{{ dutyStatusText(row.status) }}</view></view><view class="action">{{ row.actionName }}</view><view class="meta">{{ row.department }} · {{ row.category }} · 截止 {{ row.dueDate }}</view><view class="cycle">周期 {{ row.periodStart }} 至 {{ row.periodEnd }}</view></view>
    <button v-if="rows.length<total" class="more" @click="load(false)">加载更多（已显示 {{ rows.length }}/{{ total }}）</button>
    <view v-if="!rows.length" class="empty">当前筛选没有履职记录</view>
  </view>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { dutyStatusText,listAllDuties } from '../../services/duty'
const rows=ref([]), total=ref(0), page=ref(1), status=ref(''), category=ref(''), department=ref('')
const statusOptions=[{label:'全部状态',value:''},{label:'待填写',value:'PENDING'},{label:'已逾期',value:'OVERDUE'},{label:'已完成',value:'DONE'}]
const categoryOptions=[{label:'全部分类',value:''},{label:'安全检查',value:'安全检查'},{label:'安全活动',value:'安全活动'},{label:'线下抽查',value:'线下抽查'},{label:'安全宣教',value:'安全宣教'}]
const departmentOptions=['全部部门','安全监察部','市场营销部','财务管理部','综合管理部','生产运营部']
const done=computed(()=>rows.value.filter(x=>x.status==='DONE').length),overdue=computed(()=>rows.value.filter(x=>x.status==='OVERDUE').length)
async function load(reset=true){if(reset){page.value=1;rows.value=[]}const result=await listAllDuties({status:status.value,category:category.value,department:department.value==='全部部门'?'':department.value,page:page.value,pageSize:100});rows.value.push(...result.data);total.value=result.total;page.value+=1}
function change(key,value){if(key==='status')status.value=value;if(key==='category')category.value=value;if(key==='department')department.value=value;load()}
onMounted(load)
</script>
<style lang="scss" scoped>.page{padding:28rpx}.header{margin:12rpx 0 22rpx}.eyebrow{font-size:20rpx;letter-spacing:3rpx;color:#006e55}.title{font-size:42rpx;font-weight:750;margin:6rpx 0}.copy,.meta,.cycle{font-size:21rpx;color:#748079;line-height:1.6}.filters{white-space:nowrap;margin:16rpx 0}.filters.two{white-space:normal;display:flex;gap:10rpx;flex-wrap:wrap}.chip{display:inline-block;background:#eaf0ed;color:#64716a;padding:11rpx 17rpx;margin-right:12rpx;border-radius:99rpx;font-size:22rpx}.two .chip{margin:0}.chip.active{background:#006e55;color:#fff}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:14rpx;margin:22rpx 0}.summary view{background:#fff;border:1rpx solid #e0e8e3;border-radius:16rpx;padding:20rpx}.summary text{display:block;font-size:41rpx;font-weight:700}.summary span{font-size:21rpx;color:#718078}.row{background:#fff;border:1rpx solid #e0e8e3;border-radius:18rpx;padding:22rpx;margin-bottom:14rpx}.top{display:flex;justify-content:space-between}.name{font-size:27rpx;font-weight:650}.status{font-size:20rpx;padding:4rpx 10rpx;border-radius:7rpx;background:#e7f2ed;color:#006e55}.status.overdue{background:#fff0ee;color:#c73128}.action{font-size:27rpx;margin:16rpx 0 6rpx}.cycle{margin-top:9rpx}.more{margin:24rpx 0;background:#e7f2ed;color:#006e55;font-size:25rpx}.empty{text-align:center;color:#87938d;padding:90rpx 0}</style>
