import { createContext, useContext, useState, useEffect } from 'react'
import { getMe, logout as logoutApi } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setLoading(false)
      return
    }
    getMe()
      .then(res => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('authToken')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const setUserWithToken = (userData) => {
    if (userData?.token) {
      localStorage.setItem('authToken', userData.token)
    }
    setUser(userData)
  }

  const logout = async () => {
    await logoutApi()
    localStorage.removeItem('authToken')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser: setUserWithToken, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)