import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import './auth.css'

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = (data) => {
    console.log('Reset requested for:', data.email)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">✦</div>
          <h1>Reset password</h1>
          <p>We'll send you a code to reset your password</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && <span className="field-error">{errors.email.message}</span>}
          </div>

          <button type="submit" className="btn-primary">
            Send reset code
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login">Back to sign in</Link>
        </div>
      </div>
    </div>
  )
}
