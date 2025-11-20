<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createRegistration, getEventDetail } from '../services/api';

const route = useRoute();
const router = useRouter();

const event = ref(null);
const loading = ref(false);
const submitting = ref(false);
const message = ref('');

const form = reactive({
  remark: '',
});

// 格式化日期时间，显示完整的日期和时间
const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '';
  // 如果是日期时间格式（YYYY-MM-DD HH:mm:ss），提取日期和时间
  if (dateTimeStr.includes(' ')) {
    const [date, time] = dateTimeStr.split(' ');
    // 只取时和分（HH:mm）
    const timePart = time ? time.substring(0, 5) : '';
    return `${date} ${timePart}`;
  }
  return dateTimeStr;
};

// 格式化时间范围显示
const formatTimeRange = (startTime, endTime) => {
  if (!startTime || !endTime) return '';
  
  const start = formatDateTime(startTime);
  const end = formatDateTime(endTime);
  
  // 提取日期部分
  const startDate = start.split(' ')[0];
  const startTimePart = start.split(' ')[1] || '';
  const endDate = end.split(' ')[0];
  const endTimePart = end.split(' ')[1] || '';
  
  // 如果开始和结束日期相同，只显示一次日期
  if (startDate === endDate) {
    return `${startDate} ${startTimePart} - ${endTimePart}`;
  }
  
  // 如果日期不同，显示完整的时间范围
  return `${start} - ${end}`;
};

const fetchEvent = async () => {
  loading.value = true;
  try {
    event.value = await getEventDetail(route.params.id);
  } catch (err) {
    message.value = err.response?.data?.message || '无法获取活动信息';
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  submitting.value = true;
  message.value = '';
  try {
    await createRegistration({
      eventId: Number(route.params.id),
      remark: form.remark,
    });
    message.value = '报名成功，等待管理员审核';
    form.remark = '';
  } catch (err) {
    message.value = err.response?.data?.message || '报名失败，请稍后再试';
  } finally {
    submitting.value = false;
  }
};

onMounted(fetchEvent);
</script>

<template>
  <div>
    <button class="btn-outline" @click="router.back()" style="margin-bottom: 1.5rem;">返回上一页</button>
    <h2 class="page-title">活动报名</h2>
    <p class="page-desc">请确认活动信息并填写备注，确保个人资料已完善。</p>

    <div v-if="loading" class="empty-state">活动信息加载中...</div>
    <div v-else-if="!event" class="empty-state">{{ message || '未找到活动' }}</div>

    <div v-else class="register-card">
      <section>
        <h3>{{ event.title }}</h3>
        <p>{{ event.description }}</p>
        <ul>
          <li>时间：{{ formatTimeRange(event.startTime, event.endTime) }}</li>
          <li>地点：{{ event.place }}</li>
          <li>人数：{{ event.currentCount }}/{{ event.limit }} 人</li>
        </ul>
      </section>

      <form class="register-form" @submit.prevent="handleSubmit">
        <div class="form-field">
          <label>备注（可选）</label>
          <textarea v-model="form.remark" placeholder="例如：个人特长 / 参与原因"></textarea>
        </div>
        <button class="btn-primary" type="submit" :disabled="submitting">
          {{ submitting ? '提交中...' : '提交报名' }}
        </button>
        <p v-if="message" class="form-message">{{ message }}</p>
      </form>
    </div>
  </div>
</template>

<style scoped>
.register-card {
  background: #f8fafc;
  border-radius: 20px;
  padding: 1.5rem;
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 1.5rem;
}

.register-card ul {
  list-style: none;
  margin: 0;
  padding: 0;
  color: #475569;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.register-form button {
  width: 100%;
}

.form-message {
  margin-top: 0.75rem;
  color: #0f172a;
}

@media (max-width: 768px) {
  .register-card {
    grid-template-columns: 1fr;
  }
}
</style>

