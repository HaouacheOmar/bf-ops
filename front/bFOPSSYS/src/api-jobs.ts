import { api } from './api';

export const bulkCreateJobs = (data: any[]) => api.post('/jobs/bulk_create/', data);