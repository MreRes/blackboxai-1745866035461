import axios from 'axios';
import store from '../store';
import { logout } from '../store/slices/authSlice';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding auth token
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

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  activateWhatsApp: (data) => api.post('/auth/activate-whatsapp', data),
  getCurrentUser: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data)
};

// Transaction API calls
export const transactionAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  getSummary: (params) => api.get('/transactions/summary', { params }),
  exportData: (format, params) => api.get(`/transactions/export/${format}`, { 
    params,
    responseType: 'blob'
  })
};

// Budget API calls
export const budgetAPI = {
  getAll: (params) => api.get('/budgets', { params }),
  getById: (id) => api.get(`/budgets/${id}`),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
  getSummary: () => api.get('/budgets/summary'),
  getAnalytics: (id) => api.get(`/budgets/${id}/analytics`),
  copyToPeriod: (id) => api.post(`/budgets/${id}/copy`)
};

// Goal API calls
export const goalAPI = {
  getAll: (params) => api.get('/goals', { params }),
  getById: (id) => api.get(`/goals/${id}`),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
  getProgress: (id) => api.get(`/goals/${id}/progress`),
  addTransaction: (id, data) => api.post(`/goals/${id}/transactions`, data),
  getAnalytics: (id) => api.get(`/goals/${id}/analytics`)
};

// WhatsApp API calls
export const whatsAppAPI = {
  getQRCode: () => api.get('/whatsapp/qr'),
  getStatus: () => api.get('/whatsapp/status')
};

// Admin API calls
export const adminAPI = {
  getAllUsers: (params) => api.get('/admin/users', { params }),
  getUserDetails: (userId) => api.get(`/admin/users/${userId}`),
  updateUserSettings: (userId, data) => api.patch(`/admin/users/${userId}/settings`, data),
  getSystemStatus: () => api.get('/admin/system/status'),
  createBackup: () => api.post('/admin/backup'),
  restoreBackup: (data) => api.post('/admin/restore', data),
  updateAdminPassword: (data) => api.post('/admin/password/change', data),
  getWhatsAppQR: () => api.get('/admin/whatsapp/qr')
};

// Report API calls
export const reportAPI = {
  getTransactionSummary: (params) => api.get('/reports/transactions/summary', { params }),
  getBudgetSummary: (params) => api.get('/reports/budgets/summary', { params }),
  getGoalsSummary: (params) => api.get('/reports/goals/summary', { params }),
  generateReport: (type, params) => api.get(`/reports/${type}`, {
    params,
    responseType: 'blob'
  })
};

export default api;
