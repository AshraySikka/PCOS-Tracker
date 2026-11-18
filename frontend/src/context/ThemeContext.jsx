import { createContext, useContext, useState, useEffect, useCallback } from 'react'

export const THEME_STORAGE_KEY = 'pcos-theme'

const ThemeContext = createContext(null)

// Dark is the default look. Light is something you switch on.
function readInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // storage can be blocked in private mode, just use the default
  }
  return 'dark'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0d0d0d' : '#fbf4ef')
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // the theme still works for this visit
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    const root = document.documentElement
    root.classList.add('theme-transition')
    window.setTimeout(() => root.classList.remove('theme-transition'), 400)
    setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
