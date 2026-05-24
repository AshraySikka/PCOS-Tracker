import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { user, logout } = useAuth()
  return (
    <div style={{ padding: 40, color: '#f5f0eb', background: '#0d0d0d', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      <h1 style={{ marginBottom: 8 }}>Welcome back</h1>
      <p style={{ color: 'rgba(245,240,235,0.4)', marginBottom: 32 }}>{user?.email}</p>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Link to="/meals" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '20px 28px', color: '#f5f0eb', textDecoration: 'none', fontSize: 15 }}>
          🥗 Meal Plan
        </Link>
        <Link to="/onboarding" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '20px 28px', color: '#f5f0eb', textDecoration: 'none', fontSize: 15 }}>
          ⚙️ Update Profile
        </Link>
        <Link to="/exercise" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '20px 28px', color: '#f5f0eb', textDecoration: 'none', fontSize: 15 }}>
          🏃‍♀️ Exercise Plan
        </Link>
        <Link to="/log" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '20px 28px', color: '#f5f0eb', textDecoration: 'none', fontSize: 15 }}>
          📋 Daily Log
        </Link>
      </div>
      <button onClick={logout} style={{ marginTop: 40, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 20px', color: 'rgba(245,240,235,0.4)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
        Logout
      </button>
    </div>
  )
}