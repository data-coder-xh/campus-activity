<script setup>
import { computed } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import { useAuthStore } from './services/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const navLinks = [
  { to: '/', label: '活动列表' },
  { to: '/my/registrations', label: '我的报名', requiresAuth: true },
  { to: '/profile', label: '个人信息', requiresAuth: true },
  { to: '/admin/events', label: '管理员活动', requiresAdmin: true },
  { to: '/admin/registrations', label: '报名审核', requiresAdmin: true },
];

const visibleNavs = computed(() =>
  navLinks.filter((link) => {
    if (link.requiresAdmin) return authStore.isAdmin.value;
    if (link.requiresAuth) return authStore.isAuthenticated.value;
    return true;
  })
);

const isAdminRoute = computed(() => route.path.startsWith('/admin'));
const currentUserName = computed(
  () => authStore.currentUser.value?.name || authStore.currentUser.value?.username
);

const handleLogout = () => {
  authStore.clearSession();
  router.push({ name: 'Login' });
};
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="app-header__brand">
        <RouterLink to="/">校园活动报名系统</RouterLink>
        <small>Campus Activity Portal</small>
      </div>
      <nav class="app-header__nav">
        <RouterLink
          v-for="link in visibleNavs"
          :key="link.to"
          :to="link.to"
          :class="{ active: link.to === '/' ? route.path === '/' : route.path.startsWith(link.to) }"
        >
          {{ link.label }}
        </RouterLink>
        <template v-if="!authStore.isAuthenticated.value">
          <RouterLink to="/login">登录</RouterLink>
          <RouterLink to="/register">注册</RouterLink>
        </template>
        <div v-else class="user-pill">
          <span>{{ currentUserName || '已登录' }}</span>
          <button class="ghost-btn" @click="handleLogout">退出</button>
        </div>
      </nav>
    </header>

    <main class="app-main">
      <section class="hero" :class="{ 'hero--admin': isAdminRoute }">
        <div>
          <p class="hero__eyebrow">{{ isAdminRoute ? '管理后台' : '学生端功能' }}</p>
          <h1>{{ isAdminRoute ? '活动与报名管理' : '发现校园精彩活动' }}</h1>
          <p>
            {{ isAdminRoute
              ? '发布、编辑与审核报名，实时掌握活动动态。'
              : '浏览活动、了解详情、快速报名，并随时查看报名状态。' }}
          </p>
        </div>
      </section>
      <section class="app-view">
        <RouterView />
      </section>
    </main>

    <footer class="app-footer">
      <p>© {{ new Date().getFullYear() }} 校园活动报名系统</p>
    </footer>
  </div>
</template>
