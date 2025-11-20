<script setup>
import { onMounted, ref, watch } from 'vue';
import { getRegistrations } from '../services/api';

const registrations = ref([]);
const loading = ref(false);
const message = ref('');
const statusFilter = ref('');

const statusMap = {
  0: { label: '待审核', class: 'pending' },
  1: { label: '已通过', class: 'approved' },
  2: { label: '已拒绝', class: 'rejected' },
};

const fetchData = async () => {
  loading.value = true;
  message.value = '';
  try {
    const params = {};
    if (statusFilter.value !== '') params.status = statusFilter.value;
    registrations.value = await getRegistrations(params);
  } catch (err) {
    message.value = err.response?.data?.message || '加载报名记录失败';
  } finally {
    loading.value = false;
  }
};

watch(statusFilter, fetchData);
onMounted(fetchData);
</script>

<template>
  <div>
    <h2 class="page-title">我的报名记录</h2>
    <p class="page-desc">随时追踪每一次报名的审核状态。</p>

    <div class="form-field" style="max-width: 240px">
      <label>筛选状态</label>
      <select v-model="statusFilter">
        <option value="">全部</option>
        <option value="0">待审核</option>
        <option value="1">已通过</option>
        <option value="2">已拒绝</option>
      </select>
    </div>

    <div v-if="message" class="empty-state">{{ message }}</div>
    <div v-else-if="loading" class="empty-state">加载中...</div>
    <div v-else-if="registrations.length === 0" class="empty-state">暂无报名记录</div>
    <table v-else class="table">
      <thead>
        <tr>
          <th>活动名称</th>
          <th>报名时间</th>
          <th>备注</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in registrations" :key="item.id">
          <td>{{ item.eventTitle }}</td>
          <td>{{ item.createTime }}</td>
          <td>{{ item.remark || '-' }}</td>
          <td>
            <span class="tag" :class="statusMap[item.status].class">
              {{ statusMap[item.status].label }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

