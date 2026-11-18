import { useState, useEffect } from 'react'
import api from '../../api/client'
import './exercise.css'

const TYPE_LABELS = {
  strength: 'Strength',
  cardio: 'Cardio',
  hiit: 'HIIT',
  yoga: 'Yoga',
  walk: 'Walk',
  rest: 'Rest',
  mixed: 'Mixed',
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
          <h1>Exercise plan</h1>
          {plan && <p>{plan.weekly_summary}</p>}
        </div>
        <button className="btn-generate" onClick={generate} disabled={generating}>
          {generating ? <><span className="spinner" />Generating...</> : <>{plan ? 'Regenerate' : 'Generate plan'}</>}
        </button>
      </div>

      {error && <div className="exercise-error">{error}</div>}

      {generating && (
        <div className="generating-state">
          <div className="generating-spinner" />
          <p>Building your exercise plan...</p>
          <span>This takes about 15-20 seconds</span>
        </div>
      )}

      {!generating && !plan && (
        <div className="empty-state">
          <h2>No exercise plan yet</h2>
          <p>Generate a workout plan that suits your activity level and symptoms.</p>
          <button className="btn-generate-large" onClick={generate}>
            Generate my exercise plan
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
                  <span className="day-short">{day.slice(0, 3)}</span>
                  <span className="day-type">{TYPE_LABELS[dayData?.type] || ''}</span>
                </button>
              )
            })}
          </div>

          {activeDayData && (
            <div className="day-content">
              <div className="day-header">
                <div className="day-title-group">
                  <div>
                    <h2>{activeDayData.title}</h2>
                    <div className="day-meta">
                      {activeDayData.duration_mins > 0 && (
                        <span>{activeDayData.duration_mins} mins</span>
                      )}
                      {activeDayData.intensity && activeDayData.intensity !== 'none' && (
                        <span className="intensity-badge">
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
                          Watch video
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