import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../context/AuthContext'
import { register as registerApi } from '../../api/auth'
import './auth.css'

export default function Register() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser } = useAuth()
  const navigate = useNavigate()

  const onSubmit = async (data) => {
    setLoading(true)
    setError('')
    try {
      const res = await registerApi(data)
      setUser(res.data)
      navigate('/onboarding')
    } catch (err) {
      const msg = err.response?.data
      if (msg?.email) setError('Email already in use')
      else setError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">✦</div>
          <h1>Create account</h1>
          <p>Start your PCOS wellness journey</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="field">
            <label>Username</label>
            <input
              type="text"
              placeholder="yourname"
              {...register('username', { required: 'Username is required' })}
            />
            {errors.username && <span className="field-error">{errors.username.message}</span>}
          </div>

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
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Minimum 8 characters' }
              })}
            />
            {errors.password && <span className="field-error">{errors.password.message}</span>}
          </div>

          <div className="field">
            <label>Confirm password</label>
            <input
              type="password"
              placeholder="••••••••"
              {...register('password2', {
                required: 'Please confirm your password',
                validate: val => val === watch('password') || 'Passwords do not match'
              })}
            />
            {errors.password2 && <span className="field-error">{errors.password2.message}</span>}
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login">Already have an account? Sign in</Link>
        </div>
      </div>
    </div>
  )
}
