import axios from 'axios';

const API_URL = "https://web-production-31185.up.railway.app";

const api = axios.create({
  baseURL: API_URL,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle expired token responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401)
      {
      // Token expired or invalid
      // Clear everything and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const register   = (data) => api.post('/auth/register', data);
export const login      = (data) => api.post('/auth/login',
  new URLSearchParams(data),
  { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }}
);
export const getMe      = () => api.get('/auth/me');
export const getTasks   = (done) => api.get('/tasks', { params: done !== undefined ? { done } : {} });
export const createTask = (data) => api.post('/tasks', data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`);
export const markDone   = (id) => api.patch(`/tasks/${id}/done`);

export default api;