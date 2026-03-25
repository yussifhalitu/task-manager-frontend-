import axios from 'axios';

// Your live Railway API URL
const API_URL = "https://web-production-31185.up.railway.app";

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
});

// Automatically attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth calls
export const register = (data) => api.post('/auth/register', data);
export const login    = (data) => api.post('/auth/login',
  new URLSearchParams(data),  // login needs form format
  { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }}
);
export const getMe = () => api.get('/auth/me');

// Task calls
export const getTasks    = (done) => api.get('/tasks', { params: done !== undefined ? { done } : {} });
export const createTask  = (data) => api.post('/tasks', data);
export const updateTask  = (id, data) => api.put(`/tasks/${id}`, data);
export const deleteTask  = (id) => api.delete(`/tasks/${id}`);
export const markDone    = (id) => api.patch(`/tasks/${id}/done`);

export default api;