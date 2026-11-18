import { useTheme } from '../context/ThemeContext'
import Icon from './Icon'
import './components.css'

// variant "floating" sits in the corner on signed out pages
export default function ThemeToggle({ variant = 'bar' }) {
  const { isDark, toggleTheme } = useTheme()
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'
  return (
    <button
      type="button"
      className={`theme-toggle ${variant === 'floating' ? 'floating' : ''}`}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      <Icon name={isDark ? 'sun' : 'moon'} size={18} />
    </button>
  )
}
