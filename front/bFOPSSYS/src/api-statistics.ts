import axios from 'axios';

const API_BASE = '/api';

export const api = axios.create({
  baseURL: API_BASE,
});

export const getServiceStatistics = (year_id: number) => api.get(`/service-statistics/`, { params: { year_id } });
export const getCompanyStatistics = (year_id: number) => api.get(`/company-statistics/`, { params: { year_id } });
export const getJobStatistics = (year_id: number) => api.get(`/job-statistics/`, { params: { year_id } });
