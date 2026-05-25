import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers['Authorization'] = `Token ${token}`
  }
  return config
})

export default api

function getCookie(name) {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
  return null
}

api.interceptors.request.use(async (config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
    let token = getCookie('csrftoken')
    if (!token) {
      await fetch(`${BASE}/api/auth/csrf/`, { credentials: 'include' })
      token = getCookie('csrftoken')
    }
    if (token) config.headers['X-CSRFToken'] = token
  }
  return config
})

export default api