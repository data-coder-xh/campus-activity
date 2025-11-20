<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import EventCard from '../components/EventCard.vue';
import { getEvents } from '../services/api';

const router = useRouter();
const events = ref([]);
const loading = ref(false);
const error = ref('');

const fetchEvents = async () => {
  loading.value = true;
  error.value = '';
  try {
    events.value = await getEvents({ status: 1 });
  } catch (err) {
    error.value = err.response?.data?.message || '加载活动失败，请稍后再试';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchEvents);

const handleView = (id) => {
  router.push({ name: 'EventDetail', params: { id } });
};
</script>

<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">本周推荐活动</h2>
      <p class="page-desc">探索校园精品活动，点击卡片查看详情并完成报名。</p>
    </div>

    <div v-if="error" class="empty-state">{{ error }}</div>
    <div v-else-if="loading" class="empty-state">正在加载活动...</div>
    <div v-else-if="events.length === 0" class="empty-state">暂时没有可报名的活动</div>
    <div v-else class="grid">
      <EventCard v-for="event in events" :key="event.id" :event="event" @view="handleView" />
    </div>
  </div>
</template>

