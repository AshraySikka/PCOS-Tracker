import api from './client'

export const generateMealPlan = () => api.post('/api/meals/generate/')
export const getCurrentMealPlan = () => api.get('/api/meals/current/')
