import { api } from './api';

export const bulkCreatePersons = (data: any[]) => api.post('/persons/bulk_create/', data);