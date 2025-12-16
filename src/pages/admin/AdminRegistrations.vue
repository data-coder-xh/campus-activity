<script setup>
import { onMounted, ref, watch, computed } from 'vue';
import { getEvents, getRegistrations, updateRegistrationStatus } from '../../services/api';
import toast from '../../services/toast';

const events = ref([]);
const selectedEvent = ref('');
const statusFilter = ref('');
const registrations = ref([]);
const loading = ref(false);

// 格式化日期，只显示年月日
const formatDate = (dateTimeStr) => {
  if (!dateTimeStr) return '';

  // 如果是日期时间格式（YYYY-MM-DD HH:mm:ss 或 YYYY-MM-DDTHH:mm:ss），只取日期部分
  if (dateTimeStr.includes(' ')) {
    return dateTimeStr.split(' ')[0];
  }
  if (dateTimeStr.includes('T')) {
    return dateTimeStr.split('T')[0];
  }
  // 如果已经是日期格式（YYYY-MM-DD），直接返回
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateTimeStr)) {
    return dateTimeStr;
  }
  // 尝试解析为 Date 对象并格式化
  try {
    const date = new Date(dateTimeStr);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (e) {
    // 解析失败，返回原值
  }
  return dateTimeStr;
};

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

// 计算统计数据
const stats = computed(() => {
  const total = registrations.value.length;
  const pending = registrations.value.filter(r => r.status === 0).length;
  const approved = registrations.value.filter(r => r.status === 1).length;
  const rejected = registrations.value.filter(r => r.status === 2).length;

  return { total, pending, approved, rejected };
});

// 获取当前选中的活动信息
const currentEvent = computed(() => {
  return events.value.find(e => String(e.id) === selectedEvent.value) || null;
});

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
  <div class="admin-registrations">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">📝 报名审核中心</h1>
        <p class="page-desc">高效管理活动报名申请，快速审核并反馈结果</p>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div v-if="currentEvent" class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.total }}</div>
          <div class="stat-label">总报名数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⏳</div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.pending }}</div>
          <div class="stat-label">待审核</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.approved }}</div>
          <div class="stat-label">已通过</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">❌</div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.rejected }}</div>
          <div class="stat-label">已拒绝</div>
        </div>
      </div>
    </div>

    <!-- 筛选条件 -->
    <div class="content-section">
      <div class="section-header">
        <h2 class="section-title">🔍 筛选条件</h2>
        <p class="section-desc">选择活动和状态来筛选报名记录</p>
      </div>

      <div class="filters-card">
        <div class="filters-grid">
          <div class="filter-field">
            <label class="filter-label">活动选择</label>
            <select v-model="selectedEvent" class="filter-select">
              <option value="" disabled>请选择活动</option>
              <option v-for="event in events" :key="event.id" :value="String(event.id)">
                {{ event.title }}
              </option>
            </select>
          </div>
          <div class="filter-field">
            <label class="filter-label">审核状态</label>
            <select v-model="statusFilter" class="filter-select">
              <option v-for="item in statusOptions" :key="item.value" :value="item.value">
                {{ item.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- 当前活动信息 -->
        <div v-if="currentEvent" class="current-event-info">
          <div class="event-info-header">
            <h3>{{ currentEvent.title }}</h3>
            <span class="event-status" :class="currentEvent.status === 1 ? 'active' : 'inactive'">
              {{ currentEvent.status === 1 ? '进行中' : '已结束' }}
            </span>
          </div>
          <div class="event-info-meta">
            <span>📅 {{ formatDate(currentEvent.startTime) }} ~ {{ formatDate(currentEvent.endTime) }}</span>
            <span>📍 {{ currentEvent.place }}</span>
            <span>👥 {{ currentEvent.currentCount }}/{{ currentEvent.limit }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 报名列表 -->
    <div class="content-section">
      <div class="section-header">
        <h2 class="section-title">📋 报名列表</h2>
        <p class="section-desc">审核和管理活动报名申请</p>
      </div>

      <div v-if="loading" class="loading-card">
        <div class="loading-spinner"></div>
        <p>正在加载报名数据...</p>
      </div>

      <div v-else-if="registrations.length === 0" class="empty-card">
        <div class="empty-icon">📝</div>
        <h3>暂无报名记录</h3>
        <p>{{ statusFilter ? '当前筛选条件下没有找到报名记录' : '这个活动还没有人报名' }}</p>
        <div v-if="statusFilter" class="empty-action">
          <button class="btn-primary" @click="statusFilter = ''">
            查看全部报名
          </button>
        </div>
      </div>

      <div v-else class="table-container">
        <div class="table-header">
          <div class="table-info">
            <span class="table-count">共 {{ registrations.length }} 条报名记录</span>
            <span v-if="stats.pending > 0" class="pending-count">
              ⚠️ {{ stats.pending }} 条待审核
            </span>
          </div>
        </div>

        <div class="responsive-table">
          <table class="table">
            <thead>
              <tr>
                <th>学生信息</th>
                <th>联系方式</th>
                <th>备注</th>
                <th>提交时间</th>
                <th>审核状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in registrations" :key="item.id" class="registration-row">
                <td>
                  <div class="student-info">
                    <div class="student-name">{{ item.userName }}</div>
                    <div class="student-details">
                      <span class="student-id">学号：{{ item.studentId }}</span>
                      <span class="student-major">{{ item.major }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="contact-info">
                    <div class="phone">📞 {{ item.phone }}</div>
                  </div>
                </td>
                <td>
                  <div class="remark">
                    {{ item.remark || '无备注' }}
                  </div>
                </td>
                <td>
                  <div class="submit-time">
                    {{ formatTime(item.createTime) }}
                  </div>
                </td>
                <td>
                  <span class="status-badge" :class="statusClass[item.status]">
                    {{ statusLabel[item.status] }}
                  </span>
                </td>
                <td>
                  <div class="actions">
                    <template v-if="item.status === 0">
                      <button class="btn-approve" @click="setStatus(item, 1)">
                        ✅ 通过
                      </button>
                      <button class="btn-reject" @click="setStatus(item, 2)">
                        ❌ 拒绝
                      </button>
                    </template>
                    <span v-else class="no-action">已处理</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-registrations {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* 页面头部 */
.page-header {
  margin-bottom: 2rem;
}

.header-content {
  text-align: center;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-desc {
  font-size: 1.1rem;
  color: #64748b;
  margin: 0;
  max-width: 600px;
  margin: 0 auto;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.stat-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(226, 232, 240, 0.5);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 48px rgba(15, 23, 42, 0.12);
}

.stat-icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border-radius: 12px;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1;
}

.stat-label {
  font-size: 0.9rem;
  color: #64748b;
  margin-top: 0.25rem;
}

/* 内容区块 */
.content-section {
  margin-bottom: 2.5rem;
}

.section-header {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 0.5rem 0;
}

.section-desc {
  color: #64748b;
  margin: 0;
  font-size: 0.95rem;
}

/* 筛选卡片 */
.filters-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(226, 232, 240, 0.5);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-weight: 600;
  color: #334155;
  font-size: 0.95rem;
}

.filter-select {
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.875rem 1rem;
  font: inherit;
  background: #fafbfc;
  transition: all 0.2s ease;
  font-size: 0.95rem;
}

.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background: #ffffff;
}

/* 当前活动信息 */
.current-event-info {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.event-info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}

.event-info-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #0f172a;
}

.event-status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.event-status.active {
  background: rgba(34, 197, 94, 0.1);
  color: #15803d;
}

.event-status.inactive {
  background: rgba(239, 68, 68, 0.1);
  color: #b91c1c;
}

.event-info-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  color: #64748b;
  font-size: 0.9rem;
}

/* 表格容器 */
.loading-card,
.empty-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(226, 232, 240, 0.5);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-card h3 {
  color: #0f172a;
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
}

.empty-card p {
  color: #64748b;
  margin: 0 0 1.5rem 0;
}

.empty-action {
  margin-top: 1rem;
}

.btn-primary {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.25);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.3);
}

.table-container {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(226, 232, 240, 0.5);
  overflow: hidden;
}

.table-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e2e8f0;
  background: #fafbfc;
}

.table-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.table-count {
  color: #64748b;
  font-size: 0.9rem;
}

.pending-count {
  background: rgba(234, 179, 8, 0.1);
  color: #92400e;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.responsive-table {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.table th,
.table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.table th {
  background: #fafbfc;
  color: #475569;
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 1rem;
}

.registration-row {
  transition: background-color 0.2s ease;
}

.registration-row:hover {
  background: #fafbfc;
}

/* 学生信息 */
.student-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.student-name {
  font-weight: 600;
  color: #0f172a;
  font-size: 1rem;
}

.student-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  color: #64748b;
  font-size: 0.85rem;
}

.student-id,
.student-major {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.student-id::before {
  content: "🎓";
}

.student-major::before {
  content: "🏫";
}

/* 联系信息 */
.contact-info {
  color: #0f172a;
  font-weight: 500;
}

.phone {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* 备注 */
.remark {
  max-width: 200px;
  color: #64748b;
  line-height: 1.4;
}

/* 提交时间 */
.submit-time {
  color: #64748b;
  font-size: 0.9rem;
}

/* 状态徽章 */
.status-badge {
  padding: 0.375rem 0.875rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-align: center;
  display: inline-block;
}

.status-badge.pending {
  background: rgba(234, 179, 8, 0.1);
  color: #92400e;
}

.status-badge.approved {
  background: rgba(34, 197, 94, 0.1);
  color: #15803d;
}

.status-badge.rejected {
  background: rgba(239, 68, 68, 0.1);
  color: #b91c1c;
}

/* 操作按钮 */
.actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-approve,
.btn-reject {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.btn-approve {
  background: #22c55e;
  color: white;
}

.btn-approve:hover {
  background: #16a34a;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.btn-reject {
  background: #ef4444;
  color: white;
}

.btn-reject:hover {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.no-action {
  color: #94a3b8;
  font-size: 0.85rem;
  font-style: italic;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .admin-registrations {
    padding: 0 0.5rem;
  }

  .page-title {
    font-size: 2rem;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .filters-card {
    padding: 1.5rem;
  }

  .filters-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .event-info-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .table-info {
    flex-direction: column;
    align-items: flex-start;
  }

  .responsive-table {
    font-size: 0.85rem;
  }

  .table th,
  .table td {
    padding: 0.75rem 0.5rem;
  }

  .actions {
    flex-direction: column;
    width: 100%;
  }

  .btn-approve,
  .btn-reject {
    flex: 1;
    justify-content: center;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

