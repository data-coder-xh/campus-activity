<script setup>
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { loginAccount } from '../services/api';
import { useAuthStore } from '../services/auth';
import toast from '../services/toast';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const form = reactive({
  username: '',
  password: '',
});

const loading = ref(false);

const handleSubmit = async () => {
  if (!form.username || !form.password) {
    toast.warning('请输入账号和密码');
    return;
  }
  loading.value = true;
  try {
    const data = await loginAccount(form);
    authStore.setSession(data);
    const redirectTarget = typeof route.query.redirect === 'string' ? route.query.redirect : null;
    if (redirectTarget) {
      router.replace(redirectTarget);
    } else if (authStore.isReviewer.value) {
      router.replace({ name: 'ReviewDashboard' });
    } else if (authStore.isOrganizer.value) {
      router.replace({ name: 'AdminDashboard' });
    } else {
      router.replace({ name: 'EventList' });
    }
  } catch (err) {
    toast.error(err.response?.data?.message || '登录失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="auth-card">
    <h2>登录账户</h2>
    <p class="page-desc">使用注册好的账号密码登录，不同角色拥有不同的权限。</p>
    <form class="form-field auth-form" @submit.prevent="handleSubmit">
      <label>账号</label>
      <input v-model="form.username" placeholder="请输入账号" />
      <label>密码</label>
      <input v-model="form.password" type="password" placeholder="请输入密码" />
      <button class="btn-primary" type="submit" :disabled="loading">
        {{ loading ? '登录中...' : '登录' }}
      </button>
      <RouterLink to="/register" class="auth-link">还没有账号？立即注册</RouterLink>
    </form>
  </div>
</template>

<style scoped>
.auth-card {
  max-width: 420px;
  margin: 0 auto;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 1rem;
}

.auth-form button {
  margin-top: 0.5rem;
}

.form-message {
  color: #b91c1c;
  margin: 0;
}

.auth-link {
  text-align: center;
  color: #2563eb;
}

.auth-link:hover {
  text-decoration: underline;
}
</style>

