<script setup>
import { onMounted, reactive, ref } from 'vue';
import { deleteEvent, getEvents, createEvent, updateEvent, updateEventStatus } from '../../services/api';
import toast from '../../services/toast';

const events = ref([]);
const loading = ref(false);
const creating = ref(false);
const editingId = ref(null);

const form = reactive({
  title: '',
  cover: '',
  description: '',
  startTime: '',
  endTime: '',
  place: '',
  limit: 50,
  allowedColleges: '',
  allowedGrades: '',
});

// 图片上传相关状态
const imageFile = ref(null);
const fileInput = ref(null);
const localImagePreview = ref(null); // 本地预览图片（上传前显示）

// 格式化日期时间，只显示年月日（YYYY-MM-DD）
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

const resetForm = () => {
  form.title = '';
  form.cover = '';
  form.description = '';
  form.startTime = '';
  form.endTime = '';
  form.place = '';
  form.limit = 50;
  form.allowedColleges = '';
  form.allowedGrades = '';
  imageFile.value = null;
  localImagePreview.value = null;
  editingId.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// 处理文件选择
const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    toast.warning('请选择图片文件');
    return;
  }

  // 验证文件大小（限制为 10MB）
  if (file.size > 10 * 1024 * 1024) {
    toast.warning('图片大小不能超过 10MB');
    return;
  }

  // 保存文件对象供后续上传使用
  imageFile.value = file;
  
  // 读取文件并显示预览
  const reader = new FileReader();
  reader.onload = (e) => {
    localImagePreview.value = e.target.result;
  };
  reader.onerror = () => {
    toast.error('文件读取失败，请重试');
  };
  reader.readAsDataURL(file);
};

// 上传图片到 Cloudinary（支持 File 对象）
const uploadToCloudinary = async (file) => {
  const cloudName = 'dnmipkk8z';
  const uploadPreset = 'campus_event_images';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const res = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error('上传失败');
  }

  const data = await res.json();
  return data.secure_url;
};

// 触发文件选择
const triggerFileSelect = () => {
  fileInput.value?.click();
};

// 图片加载错误处理
const handleImageError = (event) => {
  console.error('图片加载失败:', form.cover);
  toast.error('图片加载失败，请重新上传');
  event.target.style.display = 'none';
};

// 图片加载成功处理
const handleImageLoad = () => {
  console.log('图片加载成功');
};

// 移除图片
const handleRemoveImage = () => {
  form.cover = '';
  localImagePreview.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const fetchEvents = async () => {
  loading.value = true;
  try {
    events.value = await getEvents();
  } catch (err) {
    toast.error(err.response?.data?.message || '加载活动列表失败');
  } finally {
    loading.value = false;
  }
};

const applyEventToForm = (item) => {
  form.title = item.title || '';
  form.cover = item.cover || '';
  form.description = item.description || '';
  form.startTime = formatDate(item.startTime);
  form.endTime = formatDate(item.endTime);
  form.place = item.place || '';
  form.limit = item.limit || 0;
  form.allowedColleges = item.allowedColleges || '';
  form.allowedGrades = item.allowedGrades || '';
  imageFile.value = null;
  localImagePreview.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const startEdit = (item) => {
  editingId.value = item.id;
  applyEventToForm(item);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleSubmit = async () => {
  // 字段名称映射
  const fieldNames = {
    title: '标题',
    startTime: '开始日期',
    endTime: '结束日期',
    place: '地点',
    limit: '人数上限',
  };

  // 收集缺失的必填字段
  const missingFields = [];
  
  if (!form.title || form.title.trim() === '') {
    missingFields.push(fieldNames.title);
  }
  
  if (!form.startTime) {
    missingFields.push(fieldNames.startTime);
  }
  
  if (!form.endTime) {
    missingFields.push(fieldNames.endTime);
  }
  
  if (!form.place || form.place.trim() === '') {
    missingFields.push(fieldNames.place);
  }
  
  if (!form.limit || form.limit <= 0) {
    missingFields.push(fieldNames.limit);
  }

  // 如果有缺失字段，显示详细提示
  if (missingFields.length > 0) {
    if (missingFields.length === 1) {
      toast.warning(`请填写：${missingFields[0]}`);
    } else {
      toast.warning(`请填写以下必填项：${missingFields.join('、')}`);
    }
    return;
  }

  // 验证日期逻辑：结束日期不能早于开始日期
  if (form.startTime && form.endTime) {
    const startDate = new Date(form.startTime);
    const endDate = new Date(form.endTime);
    if (endDate < startDate) {
      toast.warning('结束日期不能早于开始日期');
      return;
    }
  }

  // 验证人数上限
  if (form.limit <= 0) {
    toast.warning('人数上限必须大于 0');
    return;
  }

  // 所有验证通过，开始创建活动
  creating.value = true;
  const creatingToastId = toast.info(editingId.value ? '正在更新活动...' : '正在创建活动...', 0); // duration 为 0 表示不自动消失

  try {
    // 如果有选择的图片文件，先上传图片
    if (imageFile.value) {
      try {
        const imageUrl = await uploadToCloudinary(imageFile.value);
        console.log('图片上传成功，返回的 URL:', imageUrl);
        form.cover = imageUrl;
      } catch (err) {
        toast.removeToast(creatingToastId);
        toast.error('图片上传失败，请重试');
        console.error('图片上传错误:', err);
        creating.value = false;
        return;
      }
    }

    if (editingId.value) {
      await updateEvent(editingId.value, form);
    } else {
      await createEvent(form);
    }
    toast.removeToast(creatingToastId); // 移除"正在创建"的提示
    toast.success(editingId.value ? '活动已更新' : '活动已创建');
    resetForm();
    await fetchEvents();
  } catch (err) {
    toast.removeToast(creatingToastId); // 移除"正在创建"的提示
    toast.error(err.response?.data?.message || (editingId.value ? '更新失败' : '创建失败'));
  } finally {
    creating.value = false;
  }
};

const toggleStatus = async (event) => {
  try {
    await updateEventStatus(event.id, event.status === 1 ? 0 : 1);
    toast.success('状态更新成功');
    await fetchEvents();
  } catch (err) {
    toast.error(err.response?.data?.message || '更新状态失败');
  }
};

const removeEvent = async (event) => {
  if (!confirm(`确认删除活动「${event.title}」？`)) return;
  try {
    await deleteEvent(event.id);
    toast.success('活动已删除');
    await fetchEvents();
  } catch (err) {
    toast.error(err.response?.data?.message || '删除失败');
  }
};

const cancelEdit = () => {
  resetForm();
};

onMounted(fetchEvents);
</script>

<template>
  <div class="admin-dashboard">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">🎯 活动管理中心</h1>
        <p class="page-desc">高效管理校园活动，实时掌握报名数据，创造精彩校园生活</p>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-content">
          <div class="stat-number">{{ events.length }}</div>
          <div class="stat-label">总活动数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-number">{{ events.filter(e => e.status === 1).length }}</div>
          <div class="stat-label">进行中</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <div class="stat-number">{{ events.reduce((sum, e) => sum + e.currentCount, 0) }}</div>
          <div class="stat-label">总报名人数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🎪</div>
        <div class="stat-content">
          <div class="stat-number">{{ events.filter(e => new Date(e.endTime) >= new Date()).length }}</div>
          <div class="stat-label">即将开始</div>
        </div>
      </div>
    </div>

    <!-- 创建活动表单 -->
    <div class="content-section">
      <div class="section-header">
        <h2 class="section-title">✨ {{ editingId ? '编辑活动' : '创建新活动' }}</h2>
        <p class="section-desc">
          {{ editingId ? '更新活动信息与报名限制' : '发布精彩活动，吸引更多同学参与' }}
        </p>
      </div>

      <div class="form-card">
        <div class="form-grid">
          <div class="form-field">
            <label class="form-label required">活动标题</label>
            <input v-model="form.title" class="form-input" placeholder="输入富有吸引力的活动标题" />
          </div>
          <div class="form-field">
            <label class="form-label required">活动地点</label>
            <input v-model="form.place" class="form-input" placeholder="如：信息楼 301" />
          </div>
          <div class="form-field">
            <label class="form-label required">开始日期</label>
            <input v-model="form.startTime" class="form-input" type="date" />
          </div>
          <div class="form-field">
            <label class="form-label required">结束日期</label>
            <input v-model="form.endTime" class="form-input" type="date" />
          </div>
          <div class="form-field">
            <label class="form-label required">人数上限</label>
            <input v-model.number="form.limit" class="form-input" type="number" min="1" placeholder="50" />
          </div>
          <div class="form-field">
            <label class="form-label">限制学院</label>
            <input
              v-model="form.allowedColleges"
              class="form-input"
              placeholder="例如：计算机学院,机械学院"
            />
          </div>
          <div class="form-field">
            <label class="form-label">限制年级</label>
            <input
              v-model="form.allowedGrades"
              class="form-input"
              placeholder="例如：2022,2023"
            />
          </div>
          <div class="form-field full-width">
            <label class="form-label">活动详情</label>
            <textarea v-model="form.description" class="form-textarea" rows="4" placeholder="详细描述活动的亮点、内容安排、注意事项等，让同学更清楚活动详情"></textarea>
          </div>
          <div class="form-field full-width">
            <label class="form-label">封面图片</label>
            <div class="cover-upload-container">
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                style="display: none"
                @change="handleFileSelect"
              />
              <div v-if="form.cover || localImagePreview" class="cover-preview" @click="triggerFileSelect">
                <img
                  :src="form.cover || localImagePreview"
                  alt="封面预览"
                  @error="handleImageError"
                  @load="handleImageLoad"
                />
                <div class="cover-overlay">
                  <span class="cover-overlay-text">点击更换图片</span>
                </div>
                <button type="button" class="btn-remove-cover" @click.stop="handleRemoveImage">移除</button>
              </div>
              <div v-else class="cover-upload-placeholder" @click="triggerFileSelect">
                <div class="upload-icon">📷</div>
                <p class="upload-title">点击上传封面图片</p>
                <p class="upload-hint">支持 JPG、PNG 格式，建议尺寸 16:9</p>
              </div>
            </div>
          </div>
          <div class="form-field full-width">
            <div class="form-actions">
              <button
                class="btn-primary"
                type="button"
                :disabled="creating"
                @click="handleSubmit"
              >
                <span v-if="creating" class="btn-loading">⏳</span>
                {{ creating ? (editingId ? '正在更新活动...' : '正在创建活动...') : (editingId ? '✅ 保存修改' : '🚀 发布活动') }}
              </button>
              <button
                v-if="editingId"
                class="btn-ghost"
                type="button"
                :disabled="creating"
                @click="cancelEdit"
              >
                取消编辑
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 活动列表 -->
    <div class="content-section">
      <div class="section-header">
        <h2 class="section-title">📋 活动列表</h2>
        <p class="section-desc">管理你创建的所有活动，实时查看报名情况</p>
      </div>

      <div v-if="loading" class="loading-card">
        <div class="loading-spinner"></div>
        <p>正在加载活动数据...</p>
      </div>

      <div v-else-if="events.length === 0" class="empty-card">
        <div class="empty-icon">🎭</div>
        <h3>还没有活动</h3>
        <p>创建你的第一个精彩活动吧！</p>
        <div class="empty-action">
          <button class="btn-primary" @click="$el.scrollIntoView({ behavior: 'smooth' })">
            创建活动
          </button>
        </div>
      </div>

      <div v-else class="events-table-container">
        <div class="table-header">
          <div class="table-info">
            <span class="table-count">共 {{ events.length }} 个活动</span>
          </div>
        </div>

        <div class="events-grid">
          <div v-for="item in events" :key="item.id" class="event-card">
            <div class="event-header">
              <div class="event-title-section">
                <h3 class="event-title">{{ item.title }}</h3>
                <span class="creator-badge">我创建的</span>
              </div>
              <div class="event-status">
                <span class="status-badge" :class="item.status === 1 ? 'active' : 'inactive'">
                  {{ item.status === 1 ? '🟢 上线中' : '🔴 已下线' }}
                </span>
              </div>
            </div>

            <div class="event-meta">
              <div class="meta-item">
                <span class="meta-icon">📅</span>
                <span class="meta-text">{{ formatDate(item.startTime) }} ~ {{ formatDate(item.endTime) }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-icon">📍</span>
                <span class="meta-text">{{ item.place }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-icon">👥</span>
                <span class="meta-text">{{ item.currentCount }}/{{ item.limit }} 人</span>
              </div>
            </div>

            <div class="event-actions">
              <button class="btn-outline" @click="startEdit(item)">
                编辑活动
              </button>
              <button
                class="btn-outline"
                :class="item.status === 1 ? 'btn-danger' : 'btn-success'"
                @click="toggleStatus(item)"
              >
                {{ item.status === 1 ? '下线活动' : '上线活动' }}
              </button>
              <button class="btn-ghost" @click="removeEvent(item)">
                删除活动
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-dashboard {
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

/* 表单卡片 */
.form-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(226, 232, 240, 0.5);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field.full-width {
  grid-column: 1 / -1;
}

.form-label {
  font-weight: 600;
  color: #334155;
  font-size: 0.95rem;
}

.form-label.required::after {
  content: ' *';
  color: #ef4444;
}

.form-input,
.form-textarea {
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.875rem 1rem;
  font: inherit;
  background: #fafbfc;
  transition: all 0.2s ease;
  font-size: 0.95rem;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background: #ffffff;
}

.form-textarea {
  min-height: 120px;
  resize: vertical;
  line-height: 1.6;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-primary {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  padding: 0.875rem 2rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.25);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-loading {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 图片上传 */
.cover-upload-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cover-preview {
  position: relative;
  width: 100%;
  max-width: 600px;
  min-height: 250px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #f8fafc;
}

.cover-preview:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.1);
}

.cover-preview img {
  width: 100%;
  min-height: 250px;
  height: auto;
  display: block;
  object-fit: cover;
  background: #f8fafc;
}

.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.cover-preview:hover .cover-overlay {
  opacity: 1;
}

.cover-overlay-text {
  color: white;
  font-size: 1rem;
  font-weight: 500;
  padding: 0.75rem 1.5rem;
  background: rgba(59, 130, 246, 0.9);
  border-radius: 8px;
  backdrop-filter: blur(4px);
}

.btn-remove-cover {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  padding: 0.5rem 1rem;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  z-index: 10;
  backdrop-filter: blur(4px);
}

.btn-remove-cover:hover {
  background: rgba(220, 38, 38, 1);
  transform: translateY(-1px);
}

.cover-upload-placeholder {
  padding: 3rem 2rem;
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  text-align: center;
  background: linear-gradient(135deg, #fafbfc 0%, #f1f5f9 100%);
  cursor: pointer;
  transition: all 0.2s ease;
}

.cover-upload-placeholder:hover {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.upload-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 0.5rem 0;
}

.upload-hint {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
}

/* 活动列表 */
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

.events-table-container {
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
}

.table-count {
  color: #64748b;
  font-size: 0.9rem;
}

.events-grid {
  padding: 1rem;
}

.event-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  transition: all 0.2s ease;
}

.event-card:hover {
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
  border-color: #cbd5e1;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.event-title-section {
  flex: 1;
}

.event-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.creator-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  color: #2563eb;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.event-status {
  flex-shrink: 0;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-badge.active {
  background: rgba(34, 197, 94, 0.1);
  color: #15803d;
}

.status-badge.inactive {
  background: rgba(239, 68, 68, 0.1);
  color: #b91c1c;
}

.event-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.9rem;
}

.meta-icon {
  font-size: 1rem;
}

.event-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-outline {
  border: 1.5px solid;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
}

.btn-outline.btn-success {
  border-color: #22c55e;
  color: #15803d;
}

.btn-outline.btn-success:hover {
  background: #22c55e;
  color: white;
}

.btn-outline.btn-danger {
  border-color: #ef4444;
  color: #b91c1c;
}

.btn-outline.btn-danger:hover {
  background: #ef4444;
  color: white;
}

.btn-ghost {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-ghost:hover {
  background: #f1f5f9;
  color: #0f172a;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .admin-dashboard {
    padding: 0 0.5rem;
  }

  .page-title {
    font-size: 2rem;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .form-card {
    padding: 1.5rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .event-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .event-actions {
    width: 100%;
  }

  .btn-outline,
  .btn-ghost {
    flex: 1;
    min-width: 120px;
  }
}
</style>
