<script setup>
import { onMounted, ref } from 'vue';
import { getEvents, reviewEvent } from '../../services/api';
import toast from '../../services/toast';

const events = ref([]);
const loading = ref(false);
const filterStatus = ref('pending'); // pending, approved, rejected

const fetchEvents = async () => {
  loading.value = true;
  try {
    const params = {};
    if (filterStatus.value) {
      params.reviewStatus = filterStatus.value;
    }
    events.value = await getEvents(params);
  } catch (err) {
    toast.error(err.response?.data?.message || '加载活动列表失败');
  } finally {
    loading.value = false;
  }
};

const handleReview = async (event, reviewStatus) => {
  const action = reviewStatus === 'approved' ? '通过' : '拒绝';
  if (!confirm(`确认${action}活动「${event.title}」？`)) return;
  
  try {
    await reviewEvent(event.id, reviewStatus);
    toast.success(`活动已${action}`);
    await fetchEvents();
  } catch (err) {
    toast.error(err.response?.data?.message || `${action}失败`);
  }
};

const getReviewStatusText = (status) => {
  const map = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
  };
  return map[status] || status;
};

const getReviewStatusClass = (status) => {
  const map = {
    pending: 'warning',
    approved: 'approved',
    rejected: 'rejected',
  };
  return map[status] || '';
};

const formatDate = (dateTimeStr) => {
  if (!dateTimeStr) return '';
  if (dateTimeStr.includes(' ')) {
    return dateTimeStr.split(' ')[0];
  }
  if (dateTimeStr.includes('T')) {
    return dateTimeStr.split('T')[0];
  }
  return dateTimeStr;
};

onMounted(fetchEvents);
</script>

<template>
  <div>
    <h2 class="page-title">活动审核</h2>
    <p class="page-desc">审核活动发布者提交的活动，通过后活动将对学生可见。</p>

    <div class="filter-tabs">
      <button
        class="filter-tab"
        :class="{ active: filterStatus === 'pending' }"
        @click="filterStatus = 'pending'; fetchEvents()"
      >
        待审核
      </button>
      <button
        class="filter-tab"
        :class="{ active: filterStatus === 'approved' }"
        @click="filterStatus = 'approved'; fetchEvents()"
      >
        已通过
      </button>
      <button
        class="filter-tab"
        :class="{ active: filterStatus === 'rejected' }"
        @click="filterStatus = 'rejected'; fetchEvents()"
      >
        已拒绝
      </button>
    </div>

    <div v-if="loading" class="empty-state">加载中...</div>
    <div v-else-if="events.length === 0" class="empty-state">
      {{ filterStatus === 'pending' ? '暂无待审核活动' : '暂无活动' }}
    </div>
    <div v-else class="review-list">
      <div v-for="event in events" :key="event.id" class="review-card">
        <div class="review-card-header">
          <h3>{{ event.title }}</h3>
          <span class="tag" :class="getReviewStatusClass(event.reviewStatus)">
            {{ getReviewStatusText(event.reviewStatus) }}
          </span>
        </div>
        <div class="review-card-body">
          <div class="info-row">
            <span class="label">发布者：</span>
            <span>{{ event.creatorName || '未知' }}</span>
          </div>
          <div class="info-row">
            <span class="label">时间：</span>
            <span>{{ formatDate(event.startTime) }} ~ {{ formatDate(event.endTime) }}</span>
          </div>
          <div class="info-row">
            <span class="label">地点：</span>
            <span>{{ event.place }}</span>
          </div>
          <div class="info-row">
            <span class="label">人数上限：</span>
            <span>{{ event.limit }}人</span>
          </div>
          <div v-if="event.description" class="info-row">
            <span class="label">详情：</span>
            <span>{{ event.description }}</span>
          </div>
          <div v-if="event.reviewTime" class="info-row">
            <span class="label">审核时间：</span>
            <span>{{ event.reviewTime }}</span>
          </div>
          <div v-if="event.reviewerName" class="info-row">
            <span class="label">审核人：</span>
            <span>{{ event.reviewerName }}</span>
          </div>
        </div>
        <div v-if="event.reviewStatus === 'pending'" class="review-card-actions">
          <button class="btn-primary" @click="handleReview(event, 'approved')">
            通过
          </button>
          <button class="btn-danger" @click="handleReview(event, 'rejected')">
            拒绝
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filter-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e2e8f0;
}

.filter-tab {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 1rem;
  color: #64748b;
  transition: all 0.2s;
  margin-bottom: -2px;
}

.filter-tab:hover {
  color: #3b82f6;
}

.filter-tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  font-weight: 500;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.review-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.review-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.review-card-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #1e293b;
}

.review-card-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.info-row {
  display: flex;
  gap: 0.5rem;
}

.info-row .label {
  font-weight: 500;
  color: #64748b;
  min-width: 80px;
}

.review-card-actions {
  display: flex;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.btn-danger {
  padding: 0.5rem 1.5rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.2s;
}

.btn-danger:hover {
  background: #dc2626;
}

.tag.warning {
  background: rgba(251, 191, 36, 0.1);
  color: #d97706;
}

.tag.approved {
  background: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}

.tag.rejected {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}
</style>

