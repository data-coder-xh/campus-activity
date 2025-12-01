<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { getMyProfile, updateMyProfile } from '../services/api';
import { useAuthStore } from '../services/auth';
import toast from '../services/toast';

const authStore = useAuthStore();
const loading = ref(false);

const form = reactive({
  name: '',
  studentId: '',
  phone: '',
  college: '',
  major: '',
});

const currentUser = computed(() => authStore.currentUser.value || {});

const displayName = computed(
  () => form.name || currentUser.value.name || currentUser.value.username || '同学'
);

const initials = computed(() => (displayName.value || '').trim().slice(0, 1).toUpperCase());

const completionPercentage = computed(() => {
  const fields = ['name', 'studentId', 'phone', 'college', 'major'];
  const filled = fields.filter((key) => !!form[key]).length;
  return Math.round((filled / fields.length) * 100);
});

const fillForm = (data = {}) => {
  form.name = data.name || '';
  form.studentId = data.studentId || '';
  form.phone = data.phone || '';
  form.college = data.college || '';
  form.major = data.major || '';
};

const fetchProfile = async () => {
  loading.value = true;
  try {
    const data = await getMyProfile();
    fillForm(data);
    authStore.updateUser(data);
  } catch (err) {
    toast.error(err.response?.data?.message || '加载个人信息失败');
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  if (!form.name || !form.studentId) {
    toast.warning('姓名与学号为必填项');
    return;
  }
  loading.value = true;
  try {
    const updated = await updateMyProfile(form);
    authStore.updateUser(updated);
    toast.success('信息更新成功');
  } catch (err) {
    toast.error(err.response?.data?.message || '保存失败，请稍后再试');
  } finally {
    loading.value = false;
  }
};

onMounted(fetchProfile);
</script>

<template>
  <div class="profile-page">
    <div class="profile-header">
      <div class="profile-header__main">
        <div class="profile-avatar">
          <span>{{ initials }}</span>
        </div>
        <div>
          <h2 class="page-title">个人信息管理</h2>
          <p class="page-desc">
            完善个人信息后，系统会自动帮你填写活动报名表。
          </p>
        </div>
      </div>
      <div class="profile-header__meta">
        <p class="profile-meta-label">资料完整度</p>
        <div class="profile-progress">
          <div class="profile-progress__bar">
            <div class="profile-progress__value" :style="{ width: completionPercentage + '%' }"></div>
          </div>
          <span class="profile-progress__text">{{ completionPercentage }}%</span>
        </div>
        <p class="profile-meta-sub">
          {{
            completionPercentage === 100 ? '太棒了，个人信息已完善。' : '建议尽量填写完整，以便快速报名。'
          }}
        </p>
      </div>
    </div>

    <div class="profile-body">
      <form class="form-grid profile-form" @submit.prevent="handleSubmit">
        <div class="form-field">
          <label>姓名 *</label>
          <input v-model="form.name" placeholder="请输入姓名" required />
        </div>
        <div class="form-field">
          <label>学号 *</label>
          <input v-model="form.studentId" placeholder="例如：20230001" required />
        </div>
        <div class="form-field">
          <label>学院</label>
          <input v-model="form.college" placeholder="例如：计算机学院" />
        </div>
        <div class="form-field">
          <label>专业</label>
          <input v-model="form.major" placeholder="例如：软件工程" />
        </div>
        <div class="form-field">
          <label>联系电话</label>
          <input v-model="form.phone" placeholder="11 位手机号" />
        </div>

        <div class="profile-tips">
          <h3>填写小提示</h3>
          <ul>
            <li>姓名与学号为必填项，请务必填写真实信息。</li>
            <li>学院与专业将用于快速匹配适合你的活动。</li>
            <li>手机号仅用于活动通知，不会对外公开。</li>
          </ul>
        </div>

        <div class="form-field profile-form__actions">
          <button class="btn-primary" type="submit" :disabled="loading">
            {{ loading ? '保存中...' : '保存信息' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
