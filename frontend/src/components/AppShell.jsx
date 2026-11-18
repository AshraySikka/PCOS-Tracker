import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Icon from './Icon'
import ThemeToggle from './ThemeToggle'
import './components.css'

const LINKS = [
  { to: '/dashboard', label: 'Dashboard', short: 'Home', icon: 'home' },
  { to: '/log', label: 'Daily log', short: 'Log', icon: 'log' },
  { to: '/meals', label: 'Meals', short: 'Meals', icon: 'meals' },
  { to: '/exercise', label: 'Exercise', short: 'Exercise', icon: 'exercise' },
  { to: '/onboarding', label: 'Profile', short: 'Profile', icon: 'profile' },
  { to: '/settings', label: 'Settings', short: 'Settings', icon: 'settings' },
]

export default function AppShell({ children }) {
  const { user, logout } = useAuth()
  const isDemo = user?.email === 'jane.demo@example.com'

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink to="/dashboard" className="brand">PCOS Tracker</NavLink>
          <nav className="topnav" aria-label="Main">
            {LINKS.map(l => (
              <NavLink key={l.to} to={l.to} className="topnav-link">{l.label}</NavLink>
            ))}
          </nav>
          <div className="topbar-actions">
            {isDemo && <span className="demo-tag">Demo account</span>}
            <ThemeToggle />
            <button type="button" className="signout" onClick={logout}>
              <Icon name="logout" size={16} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">{children}</main>

      <nav className="tabbar" aria-label="Main">
        {LINKS.map(l => (
          <NavLink key={l.to} to={l.to} className="tab">
            <Icon name={l.icon} size={20} />
            <span>{l.short}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
