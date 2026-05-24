import api from './client'

export const getToday = () => api.get('/api/logs/today/')
export const getByDate = (date) => api.get(`/api/logs/?date=${date}`)
export const addFood = (data) => api.post('/api/logs/food/', data)
export const deleteFood = (id) => api.delete(`/api/logs/food/${id}/`)
export const estimateFood = (data) => api.post('/api/logs/food/estimate/', data)
export const addExercise = (data) => api.post('/api/logs/exercise/', data)
export const deleteExercise = (id) => api.delete(`/api/logs/exercise/${id}/`)
export const addWater = (amount_ml) => api.post('/api/logs/water/', { amount_ml })
export const deleteWater = (id) => api.delete(`/api/logs/water/${id}/`)
