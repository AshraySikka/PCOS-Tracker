import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import AppShell from './components/AppShell'
import ThemeToggle from './components/ThemeToggle'
import DemoEntry from './pages/auth/DemoEntry'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import Dashboard from './pages/dashboard/Dashboard'
import './index.css'
import Onboarding from './pages/onboarding/Onboarding'
import Meals from './pages/meals/Meals'
import Exercise from './pages/exercise/Exercise'
import Log from './pages/log/Log'
import Settings from './pages/settings/Settings'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="app-loading">Loading...</div>
  return user ? <AppShell>{children}</AppShell> : <Navigate to="/login" />
}

// Signed out pages have no dock, so the theme toggle floats in the corner
function PublicRoute({ children }) {
  return (
    <>
      <ThemeToggle variant="floating" />
      {children}
    </>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/demo" element={<PublicRoute><DemoEntry /></PublicRoute>} />
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/onboarding" element={
        <ProtectedRoute><Onboarding /></ProtectedRoute>
      } />
      <Route path="/meals" element={
        <ProtectedRoute><Meals /></ProtectedRoute>
      } />
      <Route path="/exercise" element={
        <ProtectedRoute><Exercise /></ProtectedRoute>
      } />
      <Route path="/log" element={
        <ProtectedRoute><Log /></ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute><Settings /></ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  })
}

let deferredPrompt

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt = e
  window.deferredInstallPrompt = e
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
)
