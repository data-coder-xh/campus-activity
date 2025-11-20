<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { registerAccount } from '../services/api';
import { useAuthStore } from '../services/auth';

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  name: '',
  studentId: '',
  phone: '',
  major: '',
});

const loading = ref(false);
const message = ref('');

const handleSubmit = async () => {
  if (!form.username || !form.password || !form.name || !form.studentId) {
    message.value = '请填写必填字段';
    return;
  }
  if (form.password !== form.confirmPassword) {
    message.value = '两次输入的密码不一致';
    return;
  }
  loading.value = true;
  message.value = '';
  try {
    const payload = {
      username: form.username,
      password: form.password,
      name: form.name,
      studentId: form.studentId,
      phone: form.phone,
      major: form.major,
    };
    const data = await registerAccount(payload);
    authStore.setSession(data);
    router.replace({ name: 'EventList' });
  } catch (err) {
    message.value = err.response?.data?.message || '注册失败，请稍后再试';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="auth-card">
    <h2>注册新账号</h2>
    <p class="page-desc">填写基础信息即可创建学生账号，管理员请使用预置账号登录。</p>
    <form class="form-grid auth-grid" @submit.prevent="handleSubmit">
      <div class="form-field">
        <label>账号 *</label>
        <input v-model="form.username" placeholder="用于登录的账号" />
      </div>
      <div class="form-field">
        <label>密码 *</label>
        <input v-model="form.password" type="password" placeholder="至少 6 位" />
      </div>
      <div class="form-field">
        <label>确认密码 *</label>
        <input v-model="form.confirmPassword" type="password" placeholder="再次输入密码" />
      </div>
      <div class="form-field">
        <label>姓名 *</label>
        <input v-model="form.name" placeholder="请输入姓名" />
      </div>
      <div class="form-field">
        <label>学号 *</label>
        <input v-model="form.studentId" placeholder="例如：20230001" />
      </div>
      <div class="form-field">
        <label>学院 / 专业</label>
        <input v-model="form.major" placeholder="计算机学院 软件工程" />
      </div>
      <div class="form-field">
        <label>电话</label>
        <input v-model="form.phone" placeholder="11 位手机号" />
      </div>
      <div class="form-field" style="grid-column: 1 / -1">
        <button class="btn-primary" type="submit" :disabled="loading">
          {{ loading ? '提交中...' : '注册并登录' }}
        </button>
        <p class="form-message" v-if="message">{{ message }}</p>
        <RouterLink to="/login" class="auth-link">已有账号？去登录</RouterLink>
      </div>
    </form>
  </div>
</template>

<style scoped>
.auth-card {
  max-width: 720px;
  margin: 0 auto;
}

.auth-grid {
  gap: 1rem;
}

.form-message {
  color: #b91c1c;
  margin-top: 0.5rem;
}

.auth-link {
  display: inline-block;
  margin-top: 0.5rem;
  color: #2563eb;
}

.auth-link:hover {
  text-decoration: underline;
}
</style>

