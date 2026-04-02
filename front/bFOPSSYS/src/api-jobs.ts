import { api } from './api';

export const getJobs = (params?: any) => api.get('/jobs/', { params });
export const bulkCreateJobs = (data: any[]) => api.post('/jobs/bulk_create/', data);