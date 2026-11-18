import api from './client'

export const getWeeklyReport = () => api.get('/api/reports/weekly/')
export const getMonthlyReport = () => api.get('/api/reports/monthly/')
export const getDashboard = (range = 'all') => api.get(`/api/reports/dashboard/?range=${range}`)
