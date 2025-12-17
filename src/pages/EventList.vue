<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import EventCard from '../components/EventCard.vue';
import { getEvents } from '../services/api';
import toast from '../services/toast';

const router = useRouter();
const events = ref([]);
const loading = ref(false);

const fetchEvents = async () => {
  loading.value = true;
  try {
    // 后端会自动过滤，只返回已审核通过的活动（对于学生和未登录用户）
    // 同时只返回上线的活动（status = 1）
    events.value = await getEvents({ status: 1 });
  } catch (err) {
    console.error('获取活动列表失败:', err);
    toast.error(err.response?.data?.message || '加载活动失败，请稍后再试');
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

    <div v-if="loading" class="empty-state">正在加载活动...</div>
    <div v-else-if="events.length === 0" class="empty-state">暂时没有可报名的活动</div>
    <div v-else class="grid">
      <EventCard v-for="event in events" :key="event.id" :event="event" @view="handleView" />
    </div>
  </div>
</template>

