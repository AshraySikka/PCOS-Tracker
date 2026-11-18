import { useState, useEffect } from 'react'
import { generateMealPlan, getCurrentMealPlan } from '../../api/meals'
import Icon from '../../components/Icon'
import './meals.css'

export default function Meals() {
  const [plan, setPlan] = useState(null)
  const DAYS = plan?.days?.map(d => d.day) || ['Monday', 'Tuesday', 'Wednesday']
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
          <h1>Meal plan</h1>
          {plan && (
            <p>{plan.daily_protein_target}g protein a day, {plan.per_meal_protein}g per meal</p>
          )}
        </div>
        <button className="btn-generate" onClick={generate} disabled={generating}>
          {generating ? (
            <><span className="spinner" />Generating...</>
          ) : (
            <>{plan ? 'Regenerate' : 'Generate plan'}</>
          )}
        </button>
      </div>

      {error && <div className="meals-error">{error}</div>}

      {generating && (
        <div className="generating-state">
          <div className="generating-spinner" />
          <p>Building your meal plan...</p>
          <span>This takes about 15-20 seconds</span>
        </div>
      )}

      {!generating && !plan && (
        <div className="empty-state">
          <h2>No meal plan yet</h2>
          <p>Generate a meal plan built around your profile and the foods you already eat.</p>
          <button className="btn-generate-large" onClick={generate}>
            Generate my meal plan
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
                      <Icon name="meals" size={30} />
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
