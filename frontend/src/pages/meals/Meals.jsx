import { useState, useEffect } from 'react'
import { generateMealPlan, getCurrentMealPlan } from '../../api/meals'
import './meals.css'

const DAYS = plan?.days?.map(d => d.day) || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙' }

export default function Meals() {
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [activeDay, setActiveDay] = useState('Monday')
  const [error, setError] = useState('')

  useEffect(() => {
    getCurrentMealPlan()
      .then(res => setPlan(res.data))
      .catch(() => setPlan(null))
      .finally(() => setLoading(false))
  }, [])

  const generate = async () => {
    setGenerating(true)
    setError('')
    try {
      const res = await generateMealPlan()
      setPlan(res.data)
      setActiveDay('Monday')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate meal plan')
    } finally {
      setGenerating(false)
    }
  }

  const activeDayData = plan?.days?.find(d => d.day === activeDay)

  if (loading) return <div className="meals-loading">Loading your meal plan...</div>

  return (
    <div className="meals-page">
      <div className="meals-header">
        <div>
          <h1>Your Meal Plan</h1>
          {plan && (
            <p>{plan.daily_protein_target}g protein daily · {plan.per_meal_protein}g per meal</p>
          )}
        </div>
        <button className="btn-generate" onClick={generate} disabled={generating}>
          {generating ? (
            <><span className="spinner" />Generating...</>
          ) : (
            <>{plan ? '✨ Regenerate' : '✨ Generate Plan'}</>
          )}
        </button>
      </div>

      {error && <div className="meals-error">{error}</div>}

      {generating && (
        <div className="generating-state">
          <div className="generating-spinner" />
          <p>Your AI nutritionist is crafting your personalised meal plan...</p>
          <span>This takes about 15-20 seconds</span>
        </div>
      )}

      {!generating && !plan && (
        <div className="empty-state">
          <div className="empty-icon">🥗</div>
          <h2>No meal plan yet</h2>
          <p>Generate your personalised 7-day PCOS-friendly meal plan based on your profile</p>
          <button className="btn-generate-large" onClick={generate}>
            ✨ Generate My Meal Plan
          </button>
        </div>
      )}

      {!generating && plan && (
        <>
          <div className="day-tabs">
            {DAYS.map(day => (
              <button
                key={day}
                className={`day-tab ${activeDay === day ? 'active' : ''}`}
                onClick={() => setActiveDay(day)}
              >
                <span className="day-short">{day.slice(0, 3)}</span>
              </button>
            ))}
          </div>

          <div className="meals-grid">
            {activeDayData?.meals?.map(meal => (
              <div key={meal.id} className="meal-card">
                <div className="meal-image-wrapper">
                  {meal.image_url ? (
                    <img src={meal.image_url} alt={meal.name} className="meal-image" />
                  ) : (
                    <div className="meal-image-placeholder">
                      {MEAL_ICONS[meal.meal_type]}
                    </div>
                  )}
                  <span className="meal-type-badge">{meal.meal_type}</span>
                </div>
                <div className="meal-content">
                  <h3>{meal.name}</h3>
                  <p>{meal.description}</p>
                  <div className="meal-macros">
                    <span className="macro protein">{meal.protein_g}g protein</span>
                    <span className="macro calories">{meal.calories} kcal</span>
                  </div>
                  <div className="meal-ingredients">
                    {meal.ingredients?.slice(0, 5).map((ing, i) => (
                      <span key={i} className="ingredient">{ing}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
