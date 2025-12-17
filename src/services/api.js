import axios from 'axios';
import { useAuthStore } from './auth';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000/api';

const client = axios.create({
  baseURL,
  timeout: 10000,
});

client.interceptors.request.use((config) => {
  const { token } = useAuthStore();
  if (token.value) {
    config.headers.Authorization = `Bearer ${token.value}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const store = useAuthStore();
      store.clearSession();
    }
    return Promise.reject(error);
  }
);

const unwrap = (promise) => promise.then((res) => res.data);

export const getEvents = (params = {}) => unwrap(client.get('/events', { params }));
export const getEventDetail = (id) => unwrap(client.get(`/events/${id}`));
export const createEvent = (payload) => unwrap(client.post('/events', payload));
export const updateEvent = (id, payload) => unwrap(client.put(`/events/${id}`, payload));
export const updateEventStatus = (id, status) => unwrap(client.patch(`/events/${id}/status`, { status }));
export const reviewEvent = (id, reviewStatus) => unwrap(client.patch(`/events/${id}/review`, { reviewStatus }));
export const deleteEvent = (id) => unwrap(client.delete(`/events/${id}`));

export const registerAccount = (payload) => unwrap(client.post('/auth/register', payload));
export const loginAccount = (payload) => unwrap(client.post('/auth/login', payload));

export const getMyProfile = () => unwrap(client.get('/users/me'));
export const updateMyProfile = (payload) => unwrap(client.put('/users/me', payload));

export const createRegistration = (payload) => unwrap(client.post('/registrations', payload));
export const getRegistrations = (params = {}) => unwrap(client.get('/registrations', { params }));
export const updateRegistrationStatus = (id, status) =>
  unwrap(client.patch(`/registrations/${id}/status`, { status }));

