import { useTheme } from '../context/ThemeContext'
import './components.css'

// variant: "dock" sits at the end of the dock, "inline" is a bordered button
// for page headers, "floating" pins to the corner on signed out pages.
export default function ThemeToggle({ variant = 'inline' }) {
  const { isDark, toggleTheme } = useTheme()
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'
  return (
    <button
      type="button"
      className={`theme-toggle tt-${variant}`}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      <span className="tt-track" aria-hidden="true">
        <span className={`tt-face ${isDark ? 'on' : ''}`}>🌙</span>
        <span className={`tt-face ${isDark ? '' : 'on'}`}>☀️</span>
      </span>
    </button>
  )
}
