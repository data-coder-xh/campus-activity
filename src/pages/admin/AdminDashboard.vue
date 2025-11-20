<script setup>
import { onMounted, reactive, ref } from 'vue';
import { deleteEvent, getEvents, createEvent, updateEventStatus } from '../../services/api';

const events = ref([]);
const loading = ref(false);
const message = ref('');

const form = reactive({
  title: '',
  cover: '',
  description: '',
  startTime: '',
  endTime: '',
  place: '',
  limit: 50,
});

const resetForm = () => {
  form.title = '';
  form.cover = '';
  form.description = '';
  form.startTime = '';
  form.endTime = '';
  form.place = '';
  form.limit = 50;
};

const fetchEvents = async () => {
  loading.value = true;
  try {
    events.value = await getEvents();
  } catch (err) {
    message.value = err.response?.data?.message || '加载活动列表失败';
  } finally {
    loading.value = false;
  }
};

const handleCreate = async () => {
  if (!form.title || !form.startTime || !form.endTime || !form.place || !form.limit) {
    message.value = '请补全活动信息';
    return;
  }
  try {
    await createEvent(form);
    message.value = '活动已创建';
    resetForm();
    await fetchEvents();
  } catch (err) {
    message.value = err.response?.data?.message || '创建失败';
  }
};

const toggleStatus = async (event) => {
  try {
    await updateEventStatus(event.id, event.status === 1 ? 0 : 1);
    await fetchEvents();
  } catch (err) {
    message.value = err.response?.data?.message || '更新状态失败';
  }
};

const removeEvent = async (event) => {
  if (!confirm(`确认删除活动「${event.title}」？`)) return;
  try {
    await deleteEvent(event.id);
    await fetchEvents();
  } catch (err) {
    message.value = err.response?.data?.message || '删除失败';
  }
};

onMounted(fetchEvents);
</script>

<template>
  <div>
    <h2 class="page-title">活动管理</h2>
    <p class="page-desc">快速创建或下线活动，实时掌握报名进度。</p>

    <section class="admin-form">
      <h3>创建新活动</h3>
      <div class="form-grid">
        <div class="form-field">
          <label>标题 *</label>
          <input v-model="form.title" placeholder="活动标题" />
        </div>
        <div class="form-field">
          <label>封面地址</label>
          <input v-model="form.cover" placeholder="https://example.com/cover.jpg" />
        </div>
        <div class="form-field">
          <label>开始时间 *</label>
          <input v-model="form.startTime" type="datetime-local" />
        </div>
        <div class="form-field">
          <label>结束时间 *</label>
          <input v-model="form.endTime" type="datetime-local" />
        </div>
        <div class="form-field">
          <label>地点 *</label>
          <input v-model="form.place" placeholder="信息楼 301" />
        </div>
        <div class="form-field">
          <label>人数上限 *</label>
          <input v-model.number="form.limit" type="number" min="1" />
        </div>
        <div class="form-field" style="grid-column: 1 / -1">
          <label>活动详情</label>
          <textarea v-model="form.description" rows="4" placeholder="补充活动内容、亮点等"></textarea>
        </div>
        <div class="form-field" style="grid-column: 1 / -1">
          <button class="btn-primary" type="button" @click="handleCreate">创建活动</button>
        </div>
      </div>
      <p v-if="message" style="margin-top: 0.5rem">{{ message }}</p>
    </section>

    <section>
      <h3>活动列表</h3>
      <div v-if="loading" class="empty-state">加载中...</div>
      <div v-else-if="events.length === 0" class="empty-state">暂无活动</div>
      <div v-else class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>标题</th>
              <th>时间</th>
              <th>地点</th>
              <th>人数</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in events" :key="item.id">
              <td>{{ item.title }}</td>
              <td>{{ item.startTime }} ~ {{ item.endTime }}</td>
              <td>{{ item.place }}</td>
              <td>{{ item.currentCount }}/{{ item.limit }}</td>
              <td>
                <span class="tag" :class="item.status === 1 ? 'approved' : 'rejected'">
                  {{ item.status === 1 ? '上线' : '下线' }}
                </span>
              </td>
              <td>
                <button class="btn-outline" @click="toggleStatus(item)">
                  {{ item.status === 1 ? '下线' : '上线' }}
                </button>
                <button class="ghost-btn" style="margin-left: 0.5rem" @click="removeEvent(item)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.admin-form {
  margin-bottom: 2rem;
  background: #f8fafc;
  border-radius: 20px;
  padding: 1.5rem;
}

.table-wrapper {
  overflow-x: auto;
}
</style>

