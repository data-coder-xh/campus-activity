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
      <div class="profile-avatar">
        {{ form.name ? form.name[0] : '你' }}
      </div>
      <div>
        <h2 class="page-title">个人信息管理</h2>
        <p class="page-desc">系统会根据此处信息为你自动填写报名表。</p>
      </div>
    </div>

    <div class="profile-card">
      <div class="profile-card-header">
        <div>
          <h3 class="profile-title">基础资料</h3>
          <p class="profile-subtitle">尽量填写完整，方便活动通知与签到。</p>
        </div>
        <span class="profile-hint">完善资料后报名将自动填充个人信息</span>
      </div>

      <form class="form-grid" @submit.prevent="handleSubmit">
        <div class="form-field">
          <label>
            姓名 <span class="required">*</span>
          </label>
          <input v-model="form.name" placeholder="请输入姓名" required />
        </div>
        <div class="form-field">
          <label>
            学号 <span class="required">*</span>
          </label>
          <input v-model="form.studentId" placeholder="例如：20230001" required />
        </div>
        <div class="form-field">
          <label>学院</label>
          <input v-model="form.college" placeholder="例如：计算机学院" />
          <p class="field-desc">请与教务系统保持一致，方便核对。</p>
        </div>
        <div class="form-field">
          <label>专业</label>
          <input v-model="form.major" placeholder="例如：软件工程" />
        </div>
        <div class="form-field">
          <label>联系电话</label>
          <input v-model="form.phone" placeholder="11 位手机号" />
          <p class="field-desc">用于活动变动通知，仅管理员可见。</p>
        </div>
        <div class="form-actions">
          <button class="btn-primary" type="submit" :disabled="loading">
            {{ loading ? '保存中...' : '保存信息' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.profile-avatar {
  width: 3rem;
  height: 3rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #2563eb, #38bdf8);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.3rem;
  box-shadow: 0 12px 30px rgba(37, 99, 235, 0.3);
}

.profile-card {
  background: #f8fafc;
  border-radius: 20px;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
}

.profile-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.profile-title {
  margin: 0 0 0.3rem;
  font-size: 1rem;
  color: #0f172a;
}

.profile-subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
}

.profile-hint {
  font-size: 0.85rem;
  color: #6b7280;
  background: rgba(59, 130, 246, 0.06);
  border-radius: 999px;
  padding: 0.3rem 0.8rem;
  white-space: nowrap;
}

.required {
  color: #ef4444;
  font-size: 0.85em;
}

.field-desc {
  margin: 0;
  font-size: 0.8rem;
  color: #94a3b8;
}

.form-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.form-actions .btn-primary {
  min-width: 140px;
}

@media (max-width: 768px) {
  .profile-card {
    padding: 1.25rem;
  }

  .profile-card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .profile-hint {
    white-space: normal;
  }
}
</style>
