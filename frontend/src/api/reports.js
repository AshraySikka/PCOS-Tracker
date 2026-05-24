import api from './client'

export const getWeeklyReport = () => api.get('/api/reports/weekly/')
export const getMonthlyReport = () => api.get('/api/reports/monthly/')
