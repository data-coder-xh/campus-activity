<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getEventDetail } from '../services/api';

const route = useRoute();
const router = useRouter();

const event = ref(null);
const loading = ref(false);
const error = ref('');

const canRegister = computed(() => {
  if (!event.value) return false;
  if (event.value.status === 0) return false;
  if (!event.value.limit) return true;
  return event.value.currentCount < event.value.limit;
});

const fetchEvent = async () => {
  loading.value = true;
  error.value = '';
  try {
    event.value = await getEventDetail(route.params.id);
  } catch (err) {
    error.value = err.response?.data?.message || '未能获取活动详情';
  } finally {
    loading.value = false;
  }
};

const goRegister = () => {
  router.push({ name: 'RegisterForm', params: { id: route.params.id } });
};

onMounted(fetchEvent);
</script>

<template>
  <div>
    <button class="btn-outline" @click="$router.back()">返回上一页</button>

    <div v-if="error" class="empty-state">{{ error }}</div>
    <div v-else-if="loading" class="empty-state">加载中...</div>

    <article v-else-if="event" class="event-detail">
      <img class="event-detail__cover" :src="event.cover || 'https://picsum.photos/seed/detail/960/480'" :alt="event.title" />
      <div class="event-detail__content">
        <h2>{{ event.title }}</h2>
        <p>{{ event.description }}</p>
        <ul>
          <li>时间：{{ event.startTime }} - {{ event.endTime }}</li>
          <li>地点：{{ event.place }}</li>
          <li>人数：{{ event.currentCount }}/{{ event.limit }} 人</li>
        </ul>
        <div class="event-detail__actions">
          <button class="btn-primary" :disabled="!canRegister" @click="goRegister">
            {{ canRegister ? '立即报名' : '不可报名' }}
          </button>
        </div>
      </div>
    </article>
  </div>
</template>

<style scoped>
.event-detail {
  margin-top: 1.5rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1.5rem;
}

.event-detail__cover {
  width: 100%;
  border-radius: 20px;
  object-fit: cover;
  max-height: 360px;
}

.event-detail__content {
  background: #f8fafc;
  border-radius: 20px;
  padding: 1.5rem;
}

.event-detail__content ul {
  list-style: none;
  padding: 0;
  margin: 1rem 0;
  color: #475569;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.event-detail__actions {
  margin-top: 1rem;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

@media (max-width: 768px) {
  .event-detail {
    grid-template-columns: 1fr;
  }

  .event-detail__cover {
    max-height: 240px;
  }
}
</style>

