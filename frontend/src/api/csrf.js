export function getCookie(name) {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
  return null
}

export async function fetchCsrfToken() {
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/auth/csrf/`,
    { credentials: 'include' }
  )
  return res
}
