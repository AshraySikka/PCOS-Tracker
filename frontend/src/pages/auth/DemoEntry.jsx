import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getMe } from '../../api/auth'

// Landing page for the demo-login link. The backend redirects here with a
// token, we store it and go straight to the dashboard.
export default function DemoEntry() {
  const [params] = useSearchParams()
  const { setUser } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const token = params.get('token')
    if (!token) {
      navigate('/login', { replace: true })
      return
    }
    localStorage.setItem('authToken', token)
    getMe()
      .then(res => {
        setUser({ ...res.data, token })
        navigate('/dashboard', { replace: true })
      })
      .catch(() => {
        localStorage.removeItem('authToken')
        navigate('/login', { replace: true })
      })
  }, [])

  return <div className="app-loading">Opening the demo...</div>
}
