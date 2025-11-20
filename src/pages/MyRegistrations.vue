<script setup>
import { onMounted, ref, watch } from 'vue';
import { getRegistrations } from '../services/api';
import toast from '../services/toast';

const registrations = ref([]);
const loading = ref(false);
const statusFilter = ref('');

// 格式化时间，去掉 T 和 .000Z
const formatTime = (timeStr) => {
  if (!timeStr) return '';
  // 去掉 T 和 .000Z，将 ISO 8601 格式转换为 YYYY-MM-DD HH:mm:ss
  return timeStr.replace('T', ' ').replace(/\.\d{3}Z$/, '');
};

const statusMap = {
  0: { label: '待审核', class: 'pending' },
  1: { label: '已通过', class: 'approved' },
  2: { label: '已拒绝', class: 'rejected' },
};

const fetchData = async () => {
  loading.value = true;
  try {
    const params = {};
    if (statusFilter.value !== '') params.status = statusFilter.value;
    registrations.value = await getRegistrations(params);
  } catch (err) {
    toast.error(err.response?.data?.message || '加载报名记录失败');
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

    <div v-if="loading" class="empty-state">加载中...</div>
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
          <td>{{ formatTime(item.createTime) }}</td>
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

