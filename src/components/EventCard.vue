<script setup>
import { computed } from 'vue';

const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['view']);

const statusText = computed(() => {
  if (props.event.status === 0) return '已下线';
  if (props.event.status === 1 && props.event.currentCount >= props.event.limit) return '已满额';
  return '报名中';
});

const statusClass = computed(() => {
  if (props.event.status === 0) return 'is-offline';
  if (props.event.currentCount >= props.event.limit) return 'is-full';
  return 'is-online';
});

const progress = computed(() => {
  if (!props.event.limit) return 0;
  return Math.min(100, Math.round((props.event.currentCount / props.event.limit) * 100));
});
</script>

<template>
  <article class="event-card" @click="emit('view', event.id)">
    <img class="event-card__cover" :src="event.cover || 'https://picsum.photos/seed/activity/640/360'" :alt="event.title" />
    <div class="event-card__body">
      <div class="event-card__header">
        <h3>{{ event.title }}</h3>
        <span class="event-card__status" :class="statusClass">{{ statusText }}</span>
      </div>
      <p class="event-card__desc">
        {{ event.description?.slice(0, 80) }}<span v-if="event.description?.length > 80">...</span>
      </p>
      <ul class="event-card__meta">
        <li>时间：{{ event.startTime }} - {{ event.endTime }}</li>
        <li>地点：{{ event.place }}</li>
        <li>限额：{{ event.limit }} 人 · 已报名 {{ event.currentCount }} 人</li>
      </ul>
      <div class="event-card__progress" v-if="event.limit">
        <div class="event-card__progress-bar" :style="{ width: `${progress}%` }"></div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.event-card {
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  cursor: pointer;
  transition: transform 200ms ease, box-shadow 200ms ease;
  display: flex;
  flex-direction: column;
}

.event-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 35px rgba(15, 23, 42, 0.12);
}

.event-card__cover {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.event-card__body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.event-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.event-card__header h3 {
  font-size: 1.1rem;
  margin: 0;
  color: #0f172a;
}

.event-card__status {
  font-size: 0.85rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-weight: 600;
}

.is-online {
  background: rgba(34, 197, 94, 0.15);
  color: #15803d;
}

.is-full {
  background: rgba(234, 179, 8, 0.2);
  color: #b45309;
}

.is-offline {
  background: rgba(248, 113, 113, 0.2);
  color: #b91c1c;
}

.event-card__desc {
  margin: 0;
  color: #475569;
  line-height: 1.5;
}

.event-card__meta {
  list-style: none;
  margin: 0;
  padding: 0;
  color: #475569;
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.event-card__progress {
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.event-card__progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #22d3ee, #3b82f6);
}
</style>

