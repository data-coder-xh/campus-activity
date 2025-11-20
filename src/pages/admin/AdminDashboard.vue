<script setup>
import { onMounted, reactive, ref, nextTick } from 'vue';
import { deleteEvent, getEvents, createEvent, updateEventStatus } from '../../services/api';
import Cropper from 'cropperjs';
import toast from '../../services/toast';

const events = ref([]);
const loading = ref(false);

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
const showCropperModal = ref(false);
const imageFile = ref(null);
const imagePreview = ref(null);
const cropperInstance = ref(null);
const uploading = ref(false);
const fileInput = ref(null);
const cropperImage = ref(null);
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
  imagePreview.value = null;
  localImagePreview.value = null;
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

  imageFile.value = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    imagePreview.value = dataUrl;
    // 立即显示本地预览
    localImagePreview.value = dataUrl;
    showCropperModal.value = true;
    nextTick(() => {
      initCropper();
    });
  };
  reader.readAsDataURL(file);
};

// 初始化裁剪器
const initCropper = () => {
  if (!cropperImage.value) return;

  if (cropperInstance.value) {
    cropperInstance.value.destroy();
  }

  cropperInstance.value = new Cropper(cropperImage.value, {
    aspectRatio: 16 / 9,
    viewMode: 1,
    dragMode: 'move',
    autoCropArea: 0.8,
    restore: false,
    guides: true,
    center: true,
    highlight: false,
    cropBoxMovable: true,
    cropBoxResizable: true,
    toggleDragModeOnDblclick: false,
  });
};

// 上传图片到 Cloudinary
const uploadToCloudinary = async (blob) => {
  const cloudName = 'dnmipkk8z';
  const uploadPreset = 'campus_event_images';

  const formData = new FormData();
  formData.append('file', blob);
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

// 确认裁剪并上传
const confirmCrop = async () => {
  if (!cropperInstance.value) return;

  uploading.value = true;

  try {
    // 获取裁剪后的 canvas
    const canvas = cropperInstance.value.getCroppedCanvas({
      width: 1280,
      height: 720,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    });

    // 将 canvas 转换为 blob
    canvas.toBlob(async (blob) => {
      if (!blob) {
        toast.error('图片处理失败，请重试');
        uploading.value = false;
        return;
      }
      try {
        const imageUrl = await uploadToCloudinary(blob);
        console.log('上传成功，图片 URL:', imageUrl);
        form.cover = imageUrl;
        toast.success('图片上传成功');
        closeCropperModal();
      } catch (err) {
        toast.error('图片上传失败，请重试');
        console.error('Upload error:', err);
      } finally {
        uploading.value = false;
      }
    }, 'image/jpeg', 0.9);
  } catch (err) {
    toast.error('图片处理失败，请重试');
    console.error('Crop error:', err);
    uploading.value = false;
  }
};

// 关闭裁剪模态框
const closeCropperModal = () => {
  if (cropperInstance.value) {
    cropperInstance.value.destroy();
    cropperInstance.value = null;
  }
  showCropperModal.value = false;
  imagePreview.value = null;
  imageFile.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
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

  // 所有验证通过，创建活动
  try {
    await createEvent(form);
    toast.success('活动已创建');
    resetForm();
    await fetchEvents();
  } catch (err) {
    toast.error(err.response?.data?.message || '创建失败');
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
          <button class="btn-primary" type="button" @click="handleCreate">创建活动</button>
        </div>
      </div>
    </section>

    <section>
      <h3>我的活动列表</h3>
      <p class="page-desc" style="margin-top: 0.5rem; margin-bottom: 1rem; color: #64748b; font-size: 0.9rem;">
        你只能管理自己创建的活动
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
              <th>状态</th>
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

    <!-- 图片裁剪模态框 -->
    <div v-if="showCropperModal" class="cropper-modal" @click.self="closeCropperModal">
      <div class="cropper-modal-content">
        <div class="cropper-modal-header">
          <h3>裁剪图片</h3>
          <button type="button" class="btn-close" @click="closeCropperModal">×</button>
        </div>
        <div class="cropper-modal-body">
          <img ref="cropperImage" :src="imagePreview" alt="裁剪图片" />
        </div>
        <div class="cropper-modal-footer">
          <button type="button" class="btn-outline" @click="closeCropperModal">取消</button>
          <button type="button" class="btn-primary" @click="confirmCrop" :disabled="uploading">
            {{ uploading ? '上传中...' : '确认并上传' }}
          </button>
        </div>
      </div>
    </div>
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

.cropper-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.cropper-modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cropper-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.cropper-modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #0f172a;
}

.btn-close {
  background: none;
  border: none;
  font-size: 2rem;
  color: #64748b;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
}

.btn-close:hover {
  background: #f1f5f9;
}

.cropper-modal-body {
  padding: 1.5rem;
  overflow: auto;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
}

.cropper-modal-body img {
  max-width: 100%;
  max-height: 60vh;
  display: block;
}

.cropper-modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.cropper-modal-footer .btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Cropper.js 样式 */
.cropper-container {
  direction: ltr;
  font-size: 0;
  line-height: 0;
  position: relative;
  touch-action: none;
  user-select: none;
}

.cropper-container img {
  display: block;
  height: 100%;
  image-orientation: 0deg;
  max-height: none !important;
  max-width: none !important;
  min-height: 0 !important;
  min-width: 0 !important;
  width: 100%;
}

.cropper-wrap-box,
.cropper-canvas,
.cropper-drag-box,
.cropper-crop-box,
.cropper-modal {
  bottom: 0;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
}

.cropper-wrap-box,
.cropper-canvas {
  overflow: hidden;
}

.cropper-drag-box {
  background-color: #fff;
  opacity: 0;
}

.cropper-modal {
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 0;
}

.cropper-view-box {
  display: block;
  height: 100%;
  outline: 1px solid #39f;
  outline-color: rgba(51, 153, 255, 0.75);
  overflow: hidden;
  width: 100%;
}

.cropper-dashed {
  border: 0 dashed #eee;
  display: block;
  opacity: 0.5;
  position: absolute;
}

.cropper-dashed.dashed-h {
  border-bottom-width: 1px;
  border-top-width: 1px;
  height: calc(100% / 3);
  left: 0;
  top: calc(100% / 3);
  width: 100%;
}

.cropper-dashed.dashed-v {
  border-left-width: 1px;
  border-right-width: 1px;
  height: 100%;
  left: calc(100% / 3);
  top: 0;
  width: calc(100% / 3);
}

.cropper-center {
  display: block;
  height: 0;
  left: 50%;
  opacity: 0.75;
  position: absolute;
  top: 50%;
  width: 0;
}

.cropper-center::before,
.cropper-center::after {
  background-color: #eee;
  content: ' ';
  display: block;
  position: absolute;
}

.cropper-center::before {
  height: 1px;
  left: -3px;
  top: 0;
  width: 7px;
}

.cropper-center::after {
  height: 7px;
  left: 0;
  top: -3px;
  width: 1px;
}

.cropper-face,
.cropper-line,
.cropper-point {
  display: block;
  height: 100%;
  opacity: 0.1;
  position: absolute;
  width: 100%;
}

.cropper-face {
  background-color: #fff;
  left: 0;
  top: 0;
}

.cropper-line {
  background-color: #39f;
}

.cropper-line.line-e {
  cursor: ew-resize;
  right: -3px;
  top: 0;
  width: 5px;
}

.cropper-line.line-n {
  cursor: ns-resize;
  height: 5px;
  left: 0;
  top: -3px;
}

.cropper-line.line-w {
  cursor: ew-resize;
  left: -3px;
  top: 0;
  width: 5px;
}

.cropper-line.line-s {
  bottom: -3px;
  cursor: ns-resize;
  height: 5px;
  left: 0;
}

.cropper-point {
  background-color: #39f;
  height: 5px;
  opacity: 0.75;
  width: 5px;
}

.cropper-point.point-e {
  cursor: ew-resize;
  margin-top: -3px;
  right: -3px;
  top: 50%;
}

.cropper-point.point-n {
  cursor: ns-resize;
  left: 50%;
  margin-left: -3px;
  top: -3px;
}

.cropper-point.point-w {
  cursor: ew-resize;
  left: -3px;
  margin-top: -3px;
  top: 50%;
}

.cropper-point.point-s {
  bottom: -3px;
  cursor: ns-resize;
  left: 50%;
  margin-left: -3px;
}

.cropper-point.point-ne {
  cursor: nesw-resize;
  right: -3px;
  top: -3px;
}

.cropper-point.point-nw {
  cursor: nwse-resize;
  left: -3px;
  top: -3px;
}

.cropper-point.point-sw {
  bottom: -3px;
  cursor: nesw-resize;
  left: -3px;
}

.cropper-point.point-se {
  bottom: -3px;
  cursor: nwse-resize;
  height: 20px;
  opacity: 1;
  right: -3px;
  width: 20px;
}

.cropper-point.point-se::before {
  background-color: #39f;
  bottom: -50%;
  content: ' ';
  display: block;
  height: 200%;
  opacity: 0;
  position: absolute;
  right: -50%;
  width: 200%;
}

.cropper-invisible {
  opacity: 0;
}

.cropper-bg {
  background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAAA3NCSVQICAjb4U/gAAAABlBMVEXMzMz////TjRV2AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3wYeFzQqJqJqJgAAAAlwSFlzAAALEgAACxIB0t1+/AAAABxJREFUCJlj+M/AgBVhF/0PAH6/D/HkDxOGAAAAAElFTkSuQmCC');
}

.cropper-hide {
  display: block;
  height: 0;
  position: absolute;
  width: 0;
}

.cropper-hidden {
  display: none !important;
}

.cropper-move {
  cursor: move;
}

.cropper-crop {
  cursor: crosshair;
}

.cropper-disabled .cropper-drag-box,
.cropper-disabled .cropper-face,
.cropper-disabled .cropper-line,
.cropper-disabled .cropper-point {
  cursor: not-allowed;
}
</style>

