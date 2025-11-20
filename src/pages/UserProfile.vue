<script setup>
import { onMounted, reactive, ref } from 'vue';
import { getMyProfile, updateMyProfile } from '../services/api';
import { useAuthStore } from '../services/auth';

const authStore = useAuthStore();
const loading = ref(false);
const message = ref('');

const form = reactive({
  name: '',
  studentId: '',
  phone: '',
  major: '',
});

const fillForm = (data = {}) => {
  form.name = data.name || '';
  form.studentId = data.studentId || '';
  form.phone = data.phone || '';
  form.major = data.major || '';
};

const fetchProfile = async () => {
  loading.value = true;
  message.value = '';
  try {
    const data = await getMyProfile();
    fillForm(data);
    authStore.updateUser(data);
  } catch (err) {
    message.value = err.response?.data?.message || '加载个人信息失败';
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  if (!form.name || !form.studentId) {
    message.value = '姓名与学号为必填项';
    return;
  }
  loading.value = true;
  message.value = '';
  try {
    const updated = await updateMyProfile(form);
    authStore.updateUser(updated);
    message.value = '信息更新成功';
  } catch (err) {
    message.value = err.response?.data?.message || '保存失败，请稍后再试';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchProfile);
</script>

<template>
  <div>
    <h2 class="page-title">个人信息管理</h2>
    <p class="page-desc">系统会根据此处信息为你自动填写报名表。</p>

    <form class="form-grid" @submit.prevent="handleSubmit">
      <div class="form-field">
        <label>姓名 *</label>
        <input v-model="form.name" placeholder="请输入姓名" required />
      </div>
      <div class="form-field">
        <label>学号 *</label>
        <input v-model="form.studentId" placeholder="例如：20230001" required />
      </div>
      <div class="form-field">
        <label>学院 / 专业</label>
        <input v-model="form.major" placeholder="计算机学院 软件工程" />
      </div>
      <div class="form-field">
        <label>联系电话</label>
        <input v-model="form.phone" placeholder="11 位手机号" />
      </div>
      <div class="form-field" style="grid-column: 1 / -1">
        <button class="btn-primary" type="submit" :disabled="loading">
          {{ loading ? '保存中...' : '保存信息' }}
        </button>
      </div>
      <p v-if="message" style="grid-column: 1 / -1; color: #475569">{{ message }}</p>
    </form>
  </div>
</template>