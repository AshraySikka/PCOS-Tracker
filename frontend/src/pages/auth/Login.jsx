import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../context/AuthContext'
import { login, demoLogin } from '../../api/auth'
import './auth.css'

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const { setUser } = useAuth()
  const navigate = useNavigate()

  const onSubmit = async (data) => {
    setLoading(true)
    setError('')
    try {
      const res = await login(data)
      setUser(res.data)
      navigate('/dashboard')
    } catch (err) {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const tryDemo = async () => {
    setDemoLoading(true)
    setError('')
    try {
      const res = await demoLogin()
      setUser(res.data)
      navigate('/dashboard')
    } catch (err) {
      setError('Could not open the demo. The server may be waking up, try again in a moment.')
    } finally {
      setDemoLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">PCOS Tracker</span>
          <h1>Welcome back</h1>
          <p>Pick up where you left off.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="field">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && <span className="field-error">{errors.email.message}</span>}
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && <span className="field-error">{errors.password.message}</span>}
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="auth-divider">or</div>
        <button type="button" className="btn-demo" onClick={tryDemo} disabled={demoLoading}>
          {demoLoading ? 'Opening demo...' : 'Try the demo as Jane'}
        </button>

        <div className="auth-footer">
          <Link to="/forgot-password">Forgot password?</Link>
          <span>|</span>
          <Link to="/register">Create account</Link>
        </div>
      </div>
    </div>
  )
}
