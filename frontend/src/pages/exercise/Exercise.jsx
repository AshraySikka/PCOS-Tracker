import { useState, useEffect } from 'react'
import api from '../../api/client'
import './exercise.css'

const TYPE_COLORS = {
  strength: '#e8b4a0',
  cardio: '#a0c4e8',
  hiit: '#e8a0b4',
  yoga: '#b4e8a0',
  walk: '#c4e8a0',
  rest: 'rgba(245,240,235,0.2)',
  mixed: '#e8d4a0',
}

const TYPE_ICONS = {
  strength: '🏋️',
  cardio: '🏃',
  hiit: '⚡',
  yoga: '🧘',
  walk: '🚶',
  rest: '😴',
  mixed: '💪',
}

export default function Exercise() {
  const [plan, setPlan] = useState(null)
  const DAYS = plan?.days?.map(d => d.day) || ['Monday', 'Tuesday', 'Wednesday']
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [activeDay, setActiveDay] = useState('Monday')
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/exercise/current/')
      .then(res => setPlan(res.data))
      .catch(() => setPlan(null))
      .finally(() => setLoading(false))
  }, [])

  const generate = async () => {
    setGenerating(true)
    setError('')
    try {
      const res = await api.post('/api/exercise/generate/')
      setPlan(res.data)
      setActiveDay('Monday')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate exercise plan')
    } finally {
      setGenerating(false)
    }
  }

  const activeDayData = plan?.days?.find(d => d.day === activeDay)

  if (loading) return <div className="exercise-loading">Loading your exercise plan...</div>

  return (
    <div className="exercise-page">
      <div className="exercise-header">
        <div>
          <h1>Your Exercise Plan</h1>
          {plan && <p>{plan.weekly_summary}</p>}
        </div>
        <button className="btn-generate" onClick={generate} disabled={generating}>
          {generating ? <><span className="spinner" />Generating...</> : <>{plan ? '✨ Regenerate' : '✨ Generate Plan'}</>}
        </button>
      </div>

      {error && <div className="exercise-error">{error}</div>}

      {generating && (
        <div className="generating-state">
          <div className="generating-spinner" />
          <p>Your AI fitness coach is building your personalised plan...</p>
          <span>This takes about 15-20 seconds</span>
        </div>
      )}

      {!generating && !plan && (
        <div className="empty-state">
          <div className="empty-icon">🏃‍♀️</div>
          <h2>No exercise plan yet</h2>
          <p>Generate your personalised 7-day PCOS-friendly workout plan</p>
          <button className="btn-generate-large" onClick={generate}>
            ✨ Generate My Exercise Plan
          </button>
        </div>
      )}

      {!generating && plan && (
        <>
          <div className="day-tabs">
            {DAYS.map(day => {
              const dayData = plan.days?.find(d => d.day === day)
              return (
                <button
                  key={day}
                  className={`day-tab ${activeDay === day ? 'active' : ''} ${dayData?.type === 'rest' ? 'rest' : ''}`}
                  onClick={() => setActiveDay(day)}
                >
                  <span className="day-icon">{TYPE_ICONS[dayData?.type] || '💪'}</span>
                  <span className="day-short">{day.slice(0, 3)}</span>
                </button>
              )
            })}
          </div>

          {activeDayData && (
            <div className="day-content">
              <div className="day-header" style={{ borderColor: TYPE_COLORS[activeDayData.type] }}>
                <div className="day-title-group">
                  <span className="day-type-icon">{TYPE_ICONS[activeDayData.type]}</span>
                  <div>
                    <h2>{activeDayData.title}</h2>
                    <div className="day-meta">
                      {activeDayData.duration_mins > 0 && (
                        <span>{activeDayData.duration_mins} mins</span>
                      )}
                      {activeDayData.intensity && activeDayData.intensity !== 'none' && (
                        <span className="intensity-badge" style={{ color: TYPE_COLORS[activeDayData.type] }}>
                          {activeDayData.intensity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {activeDayData.type === 'rest' ? (
                <div className="rest-day">
                  <p>Today is a rest day. Recovery is essential for managing PCOS symptoms and cortisol levels.</p>
                  <p>You can do gentle stretching or a short walk if you feel up to it.</p>
                </div>
              ) : (
                <div className="exercises-list">
                  {activeDayData.exercises?.map(ex => (
                    <div key={ex.id} className="exercise-card">
                      <div className="exercise-info">
                        <h3>{ex.name}</h3>
                        <div className="exercise-meta">
                          {ex.sets && <span>{ex.sets} sets</span>}
                          {ex.reps && <span>{ex.reps} reps</span>}
                          {ex.duration_secs && <span>{ex.duration_secs}s</span>}
                        </div>
                        {ex.notes && <p className="exercise-notes">{ex.notes}</p>}
                      </div>
                      {ex.youtube_url && (
                        
                        <a href={ex.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="youtube-btn"
                        >
                          ▶ Watch
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}