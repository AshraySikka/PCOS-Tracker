import { useAuth } from '../../context/AuthContext'

export default function Dashboard() {
  const { user, logout } = useAuth()
  return (
    <div style={{ padding: 40, color: '#f5f0eb', background: '#0d0d0d', minHeight: '100vh' }}>
      <h1>Welcome, {user?.email}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
