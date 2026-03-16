import axios from 'axios';

const API_BASE = '/api';

export const api = axios.create({
  baseURL: API_BASE,
});

// Companies
export const getCompanies = (params?: any) => api.get('/companies/', { params });
export const getCompany = (id: number) => api.get(`/companies/${id}/`);
export const createCompany = (data: any) => api.post('/companies/', data);
export const updateCompany = (id: number, data: any) => api.put(`/companies/${id}/`, data);
export const deleteCompany = (id: number) => api.delete(`/companies/${id}/`);

// Add similar functions for services, jobs, years, persons, assignments as needed
