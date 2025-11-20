<script setup>
import { onMounted, ref, watch } from 'vue';
import { getEvents, getRegistrations, updateRegistrationStatus } from '../../services/api';
import toast from '../../services/toast';

const events = ref([]);
const selectedEvent = ref('');
const statusFilter = ref('');
const registrations = ref([]);
const loading = ref(false);

// 格式化时间，去掉 T 和 .000Z
const formatTime = (timeStr) => {
  if (!timeStr) return '';
  // 去掉 T 和 .000Z，将 ISO 8601 格式转换为 YYYY-MM-DD HH:mm:ss
  return timeStr.replace('T', ' ').replace(/\.\d{3}Z$/, '');
};

const statusOptions = [
  { value: '', label: '全部' },
  { value: '0', label: '待审核' },
  { value: '1', label: '已通过' },
  { value: '2', label: '已拒绝' },
];

const statusClass = {
  0: 'pending',
  1: 'approved',
  2: 'rejected',
};

const statusLabel = {
  0: '待审核',
  1: '已通过',
  2: '已拒绝',
};

const fetchEvents = async () => {
  try {
    events.value = await getEvents();
    if (!selectedEvent.value && events.value.length) {
      selectedEvent.value = String(events.value[0].id);
    }
  } catch (err) {
    toast.error(err.response?.data?.message || '无法加载活动列表');
  }
};

const fetchRegistrations = async () => {
  if (!selectedEvent.value) return;
  loading.value = true;
  try {
    const params = { eventId: selectedEvent.value };
    if (statusFilter.value !== '') params.status = statusFilter.value;
    registrations.value = await getRegistrations(params);
  } catch (err) {
    toast.error(err.response?.data?.message || '加载报名列表失败');
  } finally {
    loading.value = false;
  }
};

const setStatus = async (row, status) => {
  try {
    await updateRegistrationStatus(row.id, status);
    toast.success('操作成功');
    await fetchRegistrations();
  } catch (err) {
    toast.error(err.response?.data?.message || '操作失败');
  }
};

watch([selectedEvent, statusFilter], fetchRegistrations);
onMounted(async () => {
  await fetchEvents();
  await fetchRegistrations();
});
</script>

<template>
  <div>
    <h2 class="page-title">报名审核</h2>
    <p class="page-desc">按活动查看报名列表，并快速完成审核操作。</p>

    <div class="form-grid">
      <div class="form-field">
        <label>活动</label>
        <select v-model="selectedEvent">
          <option value="" disabled>请选择活动</option>
          <option v-for="event in events" :key="event.id" :value="String(event.id)">
            {{ event.title }}
          </option>
        </select>
      </div>
      <div class="form-field">
        <label>状态筛选</label>
        <select v-model="statusFilter">
          <option v-for="item in statusOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="empty-state">加载中...</div>
    <div v-else-if="registrations.length === 0" class="empty-state">暂无报名记录</div>

    <table v-else class="table" style="margin-top: 1rem">
      <thead>
        <tr>
          <th>学生</th>
          <th>学号</th>
          <th>学院</th>
          <th>电话</th>
          <th>备注</th>
          <th>提交时间</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in registrations" :key="item.id">
          <td>{{ item.userName }}</td>
          <td>{{ item.studentId }}</td>
          <td>{{ item.major }}</td>
          <td>{{ item.phone }}</td>
          <td>{{ item.remark || '-' }}</td>
          <td>{{ formatTime(item.createTime) }}</td>
          <td>
            <span class="tag" :class="statusClass[item.status]">
              {{ statusLabel[item.status] }}
            </span>
          </td>
          <td>
            <template v-if="item.status === 0">
              <button class="btn-outline" @click="setStatus(item, 1)">通过</button>
              <button class="ghost-btn" style="margin-left: 0.5rem" @click="setStatus(item, 2)">拒绝</button>
            </template>
            <span v-else>-</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

