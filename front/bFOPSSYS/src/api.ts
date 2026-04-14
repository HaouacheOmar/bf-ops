import axios from 'axios';

const API_BASE = '/api';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = (error.config || {}) as any;
        const requestUrl = String(originalRequest.url || '');

        const canRefresh =
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !requestUrl.includes('/user/token/') &&
            !requestUrl.includes('/user/logout/');

        if (!canRefresh) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            await axios.post(`${API_BASE}/user/token/refresh/`, {}, { withCredentials: true });
            return api(originalRequest);
        } catch (refreshError) {
            return Promise.reject(refreshError);
        }
    }
);

export const login = (data: any) => api.post('/user/token/', data);
export const logout = () => api.post('/user/logout/');
export const getCurrentUser = () => api.get('/user/me/');
export const createUser = (data: any) => api.post('/user/register/', data);
export const getManagedAccounts = () => api.get('/user/accounts/');
export const createManagedAccount = (data: { username: string; password: string; role: 'admin' | 'viewer' }) =>
    api.post('/user/accounts/', data);
export const updateManagedAccountPassword = (userId: number, password: string) =>
    api.patch(`/user/accounts/${userId}/password/`, { password });
export const deleteManagedAccount = (userId: number) => api.delete(`/user/accounts/${userId}/`);
export const forgotPasswordCheck = (username: string) =>
    api.post('/user/forgot-password/check/', { username });
export const forgotPasswordReset = (username: string, password: string) =>
    api.post('/user/forgot-password/reset/', { username, password });

// Companies
export const getCompanies = (params?: any) => api.get('/companies/', { params });
export const getCompany = (id: number) => api.get(`/companies/${id}/`);
export const createCompany = (data: any) => api.post('/companies/', data);
export const updateCompany = (id: number, data: any) => api.put(`/companies/${id}/`, data);
export const deleteCompany = (id: number) => api.delete(`/companies/${id}/`);


// Unites
export const createUnite = (data: any) => api.post('/unites/', data);

// Grades
export const getGrades = (params?: any) => api.get('/grades/', { params });
export const createGrade = (data: any) => api.post('/grades/', data);

// UniteQuotas
export const getUniteQuotas = (params?: any) => api.get('/unite-quotas/', { params });
export const createUniteQuota = (data: any) => api.post('/unite-quotas/', data);
export const updateUniteQuota = (id: number, data: any) => api.put(`/unite-quotas/${id}/`, data);
export const deleteUniteQuota = (id: number) => api.delete(`/unite-quotas/${id}/`);
