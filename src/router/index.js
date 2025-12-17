import { createRouter, createWebHistory } from 'vue-router';
import EventList from '../pages/EventList.vue';
import EventDetail from '../pages/EventDetail.vue';
import RegisterForm from '../pages/RegisterForm.vue';
import MyRegistrations from '../pages/MyRegistrations.vue';
import UserProfile from '../pages/UserProfile.vue';
import Login from '../pages/Login.vue';
import Register from '../pages/Register.vue';
import AdminDashboard from '../pages/admin/AdminDashboard.vue';
import AdminRegistrations from '../pages/admin/AdminRegistrations.vue';
import ReviewDashboard from '../pages/admin/ReviewDashboard.vue';
import { useAuthStore } from '../services/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: EventList, name: 'EventList' },
    { path: '/events/:id', component: EventDetail, name: 'EventDetail', props: true },
    {
      path: '/events/:id/register',
      component: RegisterForm,
      name: 'RegisterForm',
      props: true,
      meta: { requiresAuth: true },
    },
    {
      path: '/my/registrations',
      component: MyRegistrations,
      name: 'MyRegistrations',
      meta: { requiresAuth: true },
    },
    { path: '/profile', component: UserProfile, name: 'UserProfile', meta: { requiresAuth: true } },
    { path: '/login', component: Login, name: 'Login', meta: { guestOnly: true } },
    { path: '/register', component: Register, name: 'Register', meta: { guestOnly: true } },
    {
      path: '/admin/events',
      component: AdminDashboard,
      name: 'AdminDashboard',
      meta: { requiresOrganizer: true },
    },
    {
      path: '/admin/registrations',
      component: AdminRegistrations,
      name: 'AdminRegistrations',
      meta: { requiresOrganizer: true },
    },
    {
      path: '/admin/review',
      component: ReviewDashboard,
      name: 'ReviewDashboard',
      meta: { requiresReviewer: true },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

router.beforeEach((to, from, next) => {
  const store = useAuthStore();

  if (to.meta.requiresAdmin) {
    if (!store.isAuthenticated.value) {
      return next({ name: 'Login', query: { redirect: to.fullPath } });
    }
    if (!store.isAdmin.value) {
      return next({ name: 'EventList' });
    }
  }

  if (to.meta.requiresOrganizer) {
    if (!store.isAuthenticated.value) {
      return next({ name: 'Login', query: { redirect: to.fullPath } });
    }
    if (!store.isOrganizer.value) {
      return next({ name: 'EventList' });
    }
  }

  if (to.meta.requiresReviewer) {
    if (!store.isAuthenticated.value) {
      return next({ name: 'Login', query: { redirect: to.fullPath } });
    }
    if (!store.isReviewer.value) {
      return next({ name: 'EventList' });
    }
  }

  if (to.meta.requiresAuth && !store.isAuthenticated.value) {
    return next({ name: 'Login', query: { redirect: to.fullPath } });
  }

  if (to.meta.guestOnly && store.isAuthenticated.value) {
    const redirectTarget = typeof to.query.redirect === 'string' ? to.query.redirect : '/';
    return next({ path: redirectTarget });
  }

  return next();
});

export default router;

