import { NavLink } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import './components.css'

const ITEMS = [
  { to: '/dashboard', emoji: '🏠', label: 'Home', color: 'var(--c-peach)' },
  { to: '/log', emoji: '📋', label: 'Log', color: 'var(--c-rose)' },
  { to: '/meals', emoji: '🥗', label: 'Meals', color: 'var(--c-mint)' },
  { to: '/exercise', emoji: '🏃‍♀️', label: 'Move', color: 'var(--c-gold)' },
  { to: '/onboarding', emoji: '👤', label: 'Profile', color: 'var(--c-lav)' },
  { to: '/settings', emoji: '🔔', label: 'Alerts', color: 'var(--c-water)' },
]

export default function Dock() {
  return (
    <nav className="dock" aria-label="Main">
      {ITEMS.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `dock-item ${isActive ? 'active' : ''}`}
          style={{ '--nav-c': item.color }}
          aria-label={item.label}
        >
          <span className="dock-emoji" aria-hidden="true">{item.emoji}</span>
          <span className="dock-label">{item.label}</span>
        </NavLink>
      ))}
      <span className="dock-sep" aria-hidden="true" />
      <ThemeToggle variant="dock" />
    </nav>
  )
}
