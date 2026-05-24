import { useState, useEffect } from 'react'
import { getToday, addFood, deleteFood, estimateFood, addExercise, deleteExercise, addWater, deleteWater } from '../../api/logs'
import './log.css'

const WATER_GOAL_ML = 2500
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }

export default function Log() {
  const [log, setLog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('food')

  const [foodForm, setFoodForm] = useState({ meal_type: 'breakfast', name: '', quantity: '', calories: '', protein_g: '' })
  const [estimating, setEstimating] = useState(false)
  const [addingFood, setAddingFood] = useState(false)

  const [exerciseForm, setExerciseForm] = useState({ name: '', duration_mins: '', calories_burned: '' })
  const [addingExercise, setAddingExercise] = useState(false)

  const refresh = () => {
    getToday().then(res => setLog(res.data)).finally(() => setLoading(false))
  }

  useEffect(() => { refresh() }, [])

  const handleEstimate = async () => {
    if (!foodForm.name) return
    setEstimating(true)
    try {
      const res = await estimateFood({ name: foodForm.name, quantity: foodForm.quantity })
      setFoodForm(f => ({ ...f, calories: res.data.calories, protein_g: res.data.protein_g }))
    } catch (err) {
      console.error(err)
    } finally {
      setEstimating(false)
    }
  }

  const handleAddFood = async () => {
    if (!foodForm.name) return
    setAddingFood(true)
    try {
      await addFood(foodForm)
      setFoodForm({ meal_type: 'breakfast', name: '', quantity: '', calories: '', protein_g: '' })
      refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setAddingFood(false)
    }
  }

  const handleDeleteFood = async (id) => {
    await deleteFood(id)
    refresh()
  }

  const handleAddExercise = async () => {
    if (!exerciseForm.name) return
    setAddingExercise(true)
    try {
      await addExercise(exerciseForm)
      setExerciseForm({ name: '', duration_mins: '', calories_burned: '' })
      refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setAddingExercise(false)
    }
  }

  const handleDeleteExercise = async (id) => {
    await deleteExercise(id)
    refresh()
  }

  const handleAddWater = async (amount) => {
    await addWater(amount)
    refresh()
  }

  const handleDeleteWater = async (id) => {
    await deleteWater(id)
    refresh()
  }

  const waterPercent = Math.min(100, Math.round(((log?.total_water_ml || 0) / WATER_GOAL_ML) * 100))

  if (loading) return <div className="log-loading">Loading today's log...</div>

  return (
    <div className="log-page">
      <div className="log-header">
        <div>
          <h1>Daily Log</h1>
          <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="log-stats">
          <div className="stat-pill">
            <span className="stat-value">{log?.total_calories || 0}</span>
            <span className="stat-label">kcal</span>
          </div>
          <div className="stat-pill">
            <span className="stat-value">{log?.total_protein || 0}g</span>
            <span className="stat-label">protein</span>
          </div>
          <div className="stat-pill water">
            <span className="stat-value">{Math.round((log?.total_water_ml || 0) / 1000 * 10) / 10}L</span>
            <span className="stat-label">water</span>
          </div>
        </div>
      </div>

      <div className="section-tabs">
        {['food', 'exercise', 'water'].map(s => (
          <button
            key={s}
            className={`section-tab ${activeSection === s ? 'active' : ''}`}
            onClick={() => setActiveSection(s)}
          >
            {s === 'food' ? '🍽️' : s === 'exercise' ? '🏃' : '💧'} {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {activeSection === 'food' && (
        <div className="section">
          <div className="add-form">
            <h3>Add food</h3>
            <div className="form-row">
              <select value={foodForm.meal_type} onChange={e => setFoodForm(f => ({ ...f, meal_type: e.target.value }))}>
                {MEAL_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-row">
              <input
                placeholder="Food name"
                value={foodForm.name}
                onChange={e => setFoodForm(f => ({ ...f, name: e.target.value }))}
              />
              <input
                placeholder="Quantity (e.g. 2 eggs)"
                value={foodForm.quantity}
                onChange={e => setFoodForm(f => ({ ...f, quantity: e.target.value }))}
              />
            </div>
            <div className="form-row">
              <input
                type="number"
                placeholder="Calories"
                value={foodForm.calories}
                onChange={e => setFoodForm(f => ({ ...f, calories: e.target.value }))}
              />
              <input
                type="number"
                placeholder="Protein (g)"
                value={foodForm.protein_g}
                onChange={e => setFoodForm(f => ({ ...f, protein_g: e.target.value }))}
              />
              <button className="btn-estimate" onClick={handleEstimate} disabled={estimating || !foodForm.name}>
                {estimating ? '...' : '✨ Estimate'}
              </button>
            </div>
            <button className="btn-add" onClick={handleAddFood} disabled={addingFood || !foodForm.name}>
              {addingFood ? 'Adding...' : '+ Add food'}
            </button>
          </div>

          <div className="entries-list">
            {MEAL_TYPES.map(mealType => {
              const entries = log?.food_entries?.filter(e => e.meal_type === mealType) || []
              if (entries.length === 0) return null
              return (
                <div key={mealType} className="meal-group">
                  <div className="meal-group-header">
                    <span>{MEAL_ICONS[mealType]} {mealType.charAt(0).toUpperCase() + mealType.slice(1)}</span>
                    <span>{entries.reduce((sum, e) => sum + (e.calories || 0), 0)} kcal</span>
                  </div>
                  {entries.map(entry => (
                    <div key={entry.id} className="entry-row">
                      <div className="entry-info">
                        <span className="entry-name">{entry.name}</span>
                        {entry.quantity && <span className="entry-qty">{entry.quantity}</span>}
                        {entry.is_estimated && <span className="estimated-badge">AI estimate</span>}
                      </div>
                      <div className="entry-macros">
                        {entry.calories && <span>{entry.calories} kcal</span>}
                        {entry.protein_g && <span>{entry.protein_g}g protein</span>}
                      </div>
                      <button className="btn-delete" onClick={() => handleDeleteFood(entry.id)}>×</button>
                    </div>
                  ))}
                </div>
              )
            })}
            {(!log?.food_entries || log.food_entries.length === 0) && (
              <div className="empty-entries">No food logged yet today</div>
            )}
          </div>
        </div>
      )}

      {activeSection === 'exercise' && (
        <div className="section">
          <div className="add-form">
            <h3>Log exercise</h3>
            <div className="form-row">
              <input
                placeholder="Exercise name (e.g. Morning walk)"
                value={exerciseForm.name}
                onChange={e => setExerciseForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="form-row">
              <input
                type="number"
                placeholder="Duration (mins)"
                value={exerciseForm.duration_mins}
                onChange={e => setExerciseForm(f => ({ ...f, duration_mins: e.target.value }))}
              />
              <input
                type="number"
                placeholder="Calories burned (optional)"
                value={exerciseForm.calories_burned}
                onChange={e => setExerciseForm(f => ({ ...f, calories_burned: e.target.value }))}
              />
            </div>
            <button className="btn-add" onClick={handleAddExercise} disabled={addingExercise || !exerciseForm.name}>
              {addingExercise ? 'Adding...' : '+ Log exercise'}
            </button>
          </div>

          <div className="entries-list">
            {log?.exercise_entries?.map(entry => (
              <div key={entry.id} className="entry-row">
                <div className="entry-info">
                  <span className="entry-name">{entry.name}</span>
                  <span className="entry-qty">{entry.duration_mins} mins</span>
                </div>
                <div className="entry-macros">
                  {entry.calories_burned && <span>{entry.calories_burned} kcal burned</span>}
                </div>
                <button className="btn-delete" onClick={() => handleDeleteExercise(entry.id)}>×</button>
              </div>
            ))}
            {(!log?.exercise_entries || log.exercise_entries.length === 0) && (
              <div className="empty-entries">No exercise logged yet today</div>
            )}
          </div>
        </div>
      )}

      {activeSection === 'water' && (
        <div className="section">
          <div className="water-tracker">
            <div className="water-circle-wrapper">
              <svg viewBox="0 0 120 120" className="water-circle">
                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
                <circle
                  cx="60" cy="60" r="54"
                  fill="none"
                  stroke="#a0c4e8"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  strokeDashoffset={`${2 * Math.PI * 54 * (1 - waterPercent / 100)}`}
                  transform="rotate(-90 60 60)"
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>
              <div className="water-circle-text">
                <span className="water-amount">{Math.round((log?.total_water_ml || 0) / 100) / 10}L</span>
                <span className="water-goal">of {WATER_GOAL_ML / 1000}L</span>
                <span className="water-pct">{waterPercent}%</span>
              </div>
            </div>

            <div className="water-buttons">
              <p>Quick add</p>
              <div className="water-quick">
                {[150, 250, 350, 500].map(ml => (
                  <button key={ml} className="btn-water" onClick={() => handleAddWater(ml)}>
                    💧 {ml}ml
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="entries-list">
            {log?.water_entries?.map(entry => (
              <div key={entry.id} className="entry-row">
                <div className="entry-info">
                  <span className="entry-name">💧 Water</span>
                  <span className="entry-qty">{entry.amount_ml}ml</span>
                </div>
                <div className="entry-macros">
                  <span>{new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <button className="btn-delete" onClick={() => handleDeleteWater(entry.id)}>×</button>
              </div>
            ))}
            {(!log?.water_entries || log.water_entries.length === 0) && (
              <div className="empty-entries">No water logged yet today</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
