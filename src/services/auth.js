import { computed, ref } from 'vue';

const tokenKey = 'authToken';
const userKey = 'authUser';

const token = ref(localStorage.getItem(tokenKey) || '');
const storedUser = localStorage.getItem(userKey);
const currentUser = ref(storedUser ? JSON.parse(storedUser) : null);

const persistToken = (value) => {
  token.value = value || '';
  if (token.value) {
    localStorage.setItem(tokenKey, token.value);
  } else {
    localStorage.removeItem(tokenKey);
  }
};

const persistUser = (value) => {
  currentUser.value = value || null;
  if (currentUser.value) {
    localStorage.setItem(userKey, JSON.stringify(currentUser.value));
  } else {
    localStorage.removeItem(userKey);
  }
};

const setSession = ({ token: newToken, user }) => {
  persistToken(newToken);
  persistUser(user);
};

const clearSession = () => {
  persistToken('');
  persistUser(null);
};

const updateUser = (user) => {
  persistUser(user);
};

const isAuthenticated = computed(() => Boolean(token.value));
const isAdmin = computed(() => currentUser.value?.role === 'admin');
const isOrganizer = computed(() => currentUser.value?.role === 'organizer');
const isReviewer = computed(() => currentUser.value?.role === 'reviewer');
const isStudent = computed(() => currentUser.value?.role === 'student');

const authStore = {
  token,
  currentUser,
  isAuthenticated,
  isAdmin,
  isOrganizer,
  isReviewer,
  isStudent,
  setSession,
  clearSession,
  updateUser,
};

export const useAuthStore = () => authStore;

