import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getWeeklyReport } from '../../api/reports'
import api from '../../api/client'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import './dashboard.css'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value}{p.unit || ''}</p>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [report, setReport] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getWeeklyReport(),
      api.get('/api/profile/metrics/')
    ]).then(([reportRes, profileRes]) => {
      setReport(reportRes.data)
      setProfile(profileRes.data)
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [])

  const chartData = report?.days?.map(d => ({
    day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    calories: d.calories,
    protein: d.protein,
    water: Math.round(d.water_ml / 100) / 10,
    exercise: d.exercise_mins,
  })) || []

  const today = report?.days?.[report.days.length - 1]

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Good {getTimeOfDay()}</h1>
          <p>{user?.email}</p>
        </div>
        <button className="btn-logout" onClick={logout}>Sign out</button>
      </div>

      {profile && (
        <div className="metrics-row">
          <div className="metric-card">
            <span className="metric-icon">⚖️</span>
            <div>
              <span className="metric-value">{profile.bmi || '—'}</span>
              <span className="metric-label">BMI</span>
            </div>
          </div>
          <div className="metric-card">
            <span className="metric-icon">🥩</span>
            <div>
              <span className="metric-value">{profile.protein_target_g || '—'}g</span>
              <span className="metric-label">Daily protein target</span>
            </div>
          </div>
          <div className="metric-card">
            <span className="metric-icon">🍽️</span>
            <div>
              <span className="metric-value">{profile.per_meal_protein_g || '—'}g</span>
              <span className="metric-label">Per meal protein</span>
            </div>
          </div>
          {today && (
            <div className="metric-card highlight">
              <span className="metric-icon">📊</span>
              <div>
                <span className="metric-value">{today.calories}</span>
                <span className="metric-label">Calories today</span>
              </div>
            </div>
          )}
        </div>
      )}

      {report && (
        <div className="charts-grid">
          <div className="chart-card wide">
            <h3>Calories this week</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e8b4a0" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#e8b4a0" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fill: 'rgba(245,240,235,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(245,240,235,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="calories" name="Calories" stroke="#e8b4a0" fill="url(#calGrad)" strokeWidth={2} dot={{ fill: '#e8b4a0', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Protein (g)</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fill: 'rgba(245,240,235,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(245,240,235,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="protein" name="Protein" fill="#e8b4a0" radius={[4, 4, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Water (L)</h3>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a0c4e8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a0c4e8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fill: 'rgba(245,240,235,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(245,240,235,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="water" name="Water" unit="L" stroke="#a0c4e8" fill="url(#waterGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="summary-card">
            <h3>This week</h3>
            <div className="summary-stats">
              <div className="summary-stat">
                <span className="ss-value">{report.summary.avg_calories}</span>
                <span className="ss-label">avg kcal/day</span>
              </div>
              <div className="summary-stat">
                <span className="ss-value">{report.summary.avg_protein}g</span>
                <span className="ss-label">avg protein/day</span>
              </div>
              <div className="summary-stat">
                <span className="ss-value">{report.summary.total_exercise_mins}</span>
                <span className="ss-label">exercise mins</span>
              </div>
              <div className="summary-stat">
                <span className="ss-value">{report.summary.days_logged}/7</span>
                <span className="ss-label">days logged</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="nav-grid">
        <Link to="/log" className="nav-card">
          <span className="nav-icon">📋</span>
          <span className="nav-label">Daily Log</span>
        </Link>
        <Link to="/meals" className="nav-card">
          <span className="nav-icon">🥗</span>
          <span className="nav-label">Meal Plan</span>
        </Link>
        <Link to="/exercise" className="nav-card">
          <span className="nav-icon">🏃‍♀️</span>
          <span className="nav-label">Exercise</span>
        </Link>
        <Link to="/onboarding" className="nav-card">
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">Profile</span>
        </Link>
      </div>
    </div>
  )
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
