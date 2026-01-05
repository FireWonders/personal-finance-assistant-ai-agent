import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Transactions API
export const transactionsAPI = {
    getAll: (params) => api.get('/transactions/', { params }),
    getById: (id) => api.get(`/transactions/${id}`),
    create: (data) => api.post('/transactions/', data),
    update: (id, data) => api.put(`/transactions/${id}`, data),
    delete: (id) => api.delete(`/transactions/${id}`),
};

// Analytics API
export const analyticsAPI = {
    getSummary: (params) => api.get('/analytics/summary', { params }),
    getCategorySummary: (params) => api.get('/analytics/by-category', { params }),
    getMonthlyTrend: (params) => api.get('/analytics/monthly-trend', { params }),
};

// Files API
export const filesAPI = {
    uploadCSV: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/files/upload-csv', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    uploadExcel: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/files/upload-excel', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    downloadCSV: (params) => {
        return api.get('/files/download-csv', {
            params,
            responseType: 'blob',
        });
    },
};

export default api;
