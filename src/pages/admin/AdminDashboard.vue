<script setup>
import { onMounted, reactive, ref } from 'vue';
import { deleteEvent, getEvents, createEvent, updateEventStatus } from '../../services/api';
import toast from '../../services/toast';

const events = ref([]);
const loading = ref(false);
const creating = ref(false);

const form = reactive({
  title: '',
  cover: '',
  description: '',
  startTime: '',
  endTime: '',
  place: '',
  limit: 50,
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
  imageFile.value = null;
  localImagePreview.value = null;
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

const handleCreate = async () => {
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
  const creatingToastId = toast.info('正在创建活动...', 0); // duration 为 0 表示不自动消失

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

    // 创建活动
    await createEvent(form);
    toast.removeToast(creatingToastId); // 移除"正在创建"的提示
    toast.success('活动已创建');
    resetForm();
    await fetchEvents();
  } catch (err) {
    toast.removeToast(creatingToastId); // 移除"正在创建"的提示
    toast.error(err.response?.data?.message || '创建失败');
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
        <div class="form-field" style="grid-column: 1 / -1">
          <label>封面图片</label>
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
              <p>点击上传封面图片</p>
              <p class="hint">支持 JPG、PNG 格式，建议尺寸 16:9</p>
            </div>
          </div>
        </div>
        <div class="form-field">
          <label>开始日期 *</label>
          <input v-model="form.startTime" type="date" />
        </div>
        <div class="form-field">
          <label>结束日期 *</label>
          <input v-model="form.endTime" type="date" />
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
          <button 
            class="btn-primary" 
            type="button" 
            :disabled="creating" 
            @click="handleCreate"
          >
            {{ creating ? '正在创建...' : '创建活动' }}
          </button>
        </div>
      </div>
    </section>

    <section>
      <h3>我的活动列表</h3>
      <p class="page-desc" style="margin-top: 0.5rem; margin-bottom: 1rem; color: #64748b; font-size: 0.9rem;">
        你只能管理自己创建的活动。活动创建后需要等待审核管理员审核通过，才能对学生可见。
      </p>
      <div v-if="loading" class="empty-state">加载中...</div>
      <div v-else-if="events.length === 0" class="empty-state">暂无活动，创建第一个活动吧！</div>
      <div v-else class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>标题</th>
              <th>时间</th>
              <th>地点</th>
              <th>人数</th>
              <th>审核状态</th>
              <th>上线状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in events" :key="item.id">
              <td>
                {{ item.title }}
                <span v-if="item.creatorName" class="creator-badge">我创建的</span>
              </td>
              <td>{{ formatDate(item.startTime) }} ~ {{ formatDate(item.endTime) }}</td>
              <td>{{ item.place }}</td>
              <td>{{ item.currentCount }}/{{ item.limit }}</td>
              <td>
                <span class="tag" :class="getReviewStatusClass(item.reviewStatus)">
                  {{ getReviewStatusText(item.reviewStatus) }}
                </span>
              </td>
              <td>
                <span class="tag" :class="item.status === 1 ? 'approved' : 'rejected'">
                  {{ item.status === 1 ? '上线' : '下线' }}
                </span>
              </td>
              <td>
                <button 
                  class="btn-outline" 
                  @click="toggleStatus(item)"
                  :disabled="item.reviewStatus !== 'approved'"
                  :title="item.reviewStatus !== 'approved' ? '活动需先通过审核才能上线' : ''"
                >
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

.creator-badge {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.15rem 0.5rem;
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
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

.btn-outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cover-upload-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cover-preview {
  position: relative;
  width: 100%;
  max-width: 500px;
  min-height: 200px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #e2e8f0;
  cursor: pointer;
  transition: border-color 0.2s;
  background: #f8fafc;
}

.cover-preview:hover {
  border-color: #3b82f6;
}

.cover-preview img {
  width: 100%;
  min-height: 200px;
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.cover-preview:hover .cover-overlay {
  opacity: 1;
}

.cover-overlay-text {
  color: white;
  font-size: 1rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  background: rgba(59, 130, 246, 0.9);
  border-radius: 6px;
}

.btn-remove-cover {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.2s;
  z-index: 10;
}

.btn-remove-cover:hover {
  background: rgba(220, 38, 38, 1);
}

.cover-upload-placeholder {
  padding: 2rem;
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  text-align: center;
  background: #f8fafc;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
}

.cover-upload-placeholder:hover {
  border-color: #3b82f6;
  background: #f1f5f9;
}

.cover-upload-placeholder p {
  margin: 0.5rem 0;
  color: #64748b;
  transition: color 0.2s;
}

.cover-upload-placeholder:hover p {
  color: #3b82f6;
}

.cover-upload-placeholder .hint {
  font-size: 0.875rem;
  color: #94a3b8;
}
</style>

