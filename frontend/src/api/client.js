import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Transactions API
export const transactionsAPI = {
    getAll: (params = {}) => apiClient.get('/api/transactions/', { params }),
    getOne: (id) => apiClient.get(`/api/transactions/${id}`),
    create: (data) => apiClient.post('/api/transactions/', data),
    update: (id, data) => apiClient.put(`/api/transactions/${id}`, data),
    delete: (id) => apiClient.delete(`/api/transactions/${id}`),
    getMonthlyStats: (year, month) =>
        apiClient.get('/api/transactions/stats/monthly', { params: { year, month } }),
    getCategoryStats: (year, month, type) =>
        apiClient.get('/api/transactions/stats/category', { params: { year, month, type } }),
};

// Budget Plans API
export const budgetPlansAPI = {
    getAll: (params = {}) => apiClient.get('/api/plans/', { params }),
    getOne: (id) => apiClient.get(`/api/plans/${id}`),
    create: (data) => apiClient.post('/api/plans/', data),
    update: (id, data) => apiClient.put(`/api/plans/${id}`, data),
    delete: (id) => apiClient.delete(`/api/plans/${id}`),
};

// Excel API
export const excelAPI = {
    import: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post('/api/excel/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    exportTransactions: (params = {}) => {
        return apiClient.get('/api/excel/export/transactions', {
            params,
            responseType: 'blob',
        });
    },
    exportMonthlyReport: (year, month) => {
        return apiClient.get('/api/excel/export/monthly-report', {
            params: { year, month },
            responseType: 'blob',
        });
    },
};

// Regular Transactions API
export const regularTransactionsAPI = {
    getAll: (params = {}) => apiClient.get('/api/regular/', { params }),
    getOne: (id) => apiClient.get(`/api/regular/${id}`),
    create: (data) => apiClient.post('/api/regular/', data),
    update: (id, data) => apiClient.put(`/api/regular/${id}`, data),
    delete: (id) => apiClient.delete(`/api/regular/${id}`),
};

// Asset Simulation API
export const simulationAPI = {
    getGoals: () => apiClient.get('/api/simulation/goals'),
    createGoal: (data) => apiClient.post('/api/simulation/goals', data),
    deleteGoal: (id) => apiClient.delete(`/api/simulation/goals/${id}`),
    analyze: (goalId) => apiClient.get(`/api/simulation/analyze/${goalId}`),
};

// Tax API
export const taxAPI = {
    calculate: (data) => apiClient.post('/api/tax/calculate', data),
};

export default apiClient;
