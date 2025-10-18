import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (username, password) =>
    api.post('/api/auth/login', { username, password }),
  register: (username, password, email) =>
    api.post('/api/auth/register', { username, password, email })
};

// User API
export const userAPI = {
  getMe: () => api.get('/api/users/me'),
  getAll: () => api.get('/api/users'),
  getById: (id) => api.get(`/api/users/${id}`),
  create: (userData) => api.post('/api/users', userData),
  update: (id, userData) => api.put(`/api/users/${id}`, userData),
  delete: (id) => api.delete(`/api/users/${id}`)
};

// Suite API
export const suiteAPI = {
  getAll: () => api.get('/api/suites'),
  getById: (id) => api.get(`/api/suites/${id}`),
  create: (suiteData) => api.post('/api/suites', suiteData),
  update: (id, suiteData) => api.put(`/api/suites/${id}`, suiteData),
  delete: (id) => api.delete(`/api/suites/${id}`)
};

// Environment API
export const environmentAPI = {
  getAll: () => api.get('/api/environments'),
  getById: (id) => api.get(`/api/environments/${id}`),
  create: (suiteId) => api.post('/api/environments', { suiteId }),
  start: (id) => api.post(`/api/environments/${id}/start`),
  stop: (id) => api.post(`/api/environments/${id}/stop`),
  delete: (id) => api.delete(`/api/environments/${id}`),
  getStatus: (id) => api.get(`/api/environments/${id}/status`)
};

export default api;
