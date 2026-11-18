import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getToday, getByDate, addFood, deleteFood, estimateFood, addExercise, deleteExercise, addWater, deleteWater } from '../../api/logs'
import './log.css'

const WATER_GOAL_ML = 2500
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }

// "2026-11-17" -> local Date (new Date('2026-11-17') would shift by timezone)
function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function shiftDate(iso, days) {
  const d = parseDate(iso)
  d.setDate(d.getDate() + days)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

// One wave period is 100 units wide, so sliding it by exactly 100 loops cleanly.
const WAVE = 'M0 12 Q 25 0 50 12 T 100 12 T 150 12 T 200 12 T 250 12 T 300 12 V 200 H 0 Z'

function WaterOrb({ ml, percent, splash }) {
  const C = 2 * Math.PI * 74
  // The orb interior spans y=20 to y=140. Empty sits at 144, full reaches 14.
  const level = 144 - (130 * percent) / 100
  const done = percent >= 100
  return (
    <div className={`water-orb ${splash ? 'splash' : ''} ${done ? 'done' : ''}`}>
      <svg viewBox="0 0 160 160" className="water-circle" role="img" aria-label={`${percent}% of the daily water goal`}>
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" className="stop-water" />
            <stop offset="100%" className="stop-lav" />
          </linearGradient>
          <linearGradient id="waterFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" className="stop-water" stopOpacity="0.95" />
            <stop offset="100%" className="stop-lav" stopOpacity="0.85" />
          </linearGradient>
          <clipPath id="orbClip"><circle cx="80" cy="80" r="60" /></clipPath>
        </defs>

        <circle cx="80" cy="80" r="74" className="ring-track" />
        <circle
          cx="80" cy="80" r="74" fill="none" stroke="url(#ringGrad)" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - percent / 100)}
          transform="rotate(-90 80 80)"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.3, 0.9, 0.3, 1)' }}
        />

        <circle cx="80" cy="80" r="60" className="orb-glass" />
        <g clipPath="url(#orbClip)">
          <g className="water-level" style={{ transform: `translateY(${level}px)` }}>
            <g className="wave wave-back"><path d={WAVE} fill="url(#waterFill)" opacity="0.45" /></g>
            <g className="wave wave-front"><path d={WAVE} fill="url(#waterFill)" /></g>
            <circle className="bubble b1" cx="55" cy="90" r="3" />
            <circle className="bubble b2" cx="88" cy="100" r="2.2" />
            <circle className="bubble b3" cx="108" cy="85" r="3.4" />
            <circle className="bubble b4" cx="72" cy="105" r="1.8" />
          </g>
          <ellipse cx="58" cy="46" rx="16" ry="8" className="orb-shine" transform="rotate(-30 58 46)" />
        </g>
        <circle cx="80" cy="80" r="60" className="orb-rim" />
      </svg>
      <div className="water-circle-text">
        <span className="water-amount">{Math.round(ml / 100) / 10}L</span>
        <span className="water-goal">of {WATER_GOAL_ML / 1000}L</span>
        <span className="water-pct">{percent}%</span>
      </div>
    </div>
  )
}

export default function Log() {
  const [searchParams, setSearchParams] = useSearchParams()
  const dateParam = searchParams.get('date')
  const [log, setLog] = useState(null)
  const [serverToday, setServerToday] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('food')
  const [estimateError, setEstimateError] = useState('')

  const [foodForm, setFoodForm] = useState({ meal_type: 'breakfast', name: '', quantity: '', calories: '', protein_g: '' })
  const [estimating, setEstimating] = useState(false)
  const [addingFood, setAddingFood] = useState(false)

  const [exerciseForm, setExerciseForm] = useState({ name: '', duration_mins: '', calories_burned: '' })
  const [addingExercise, setAddingExercise] = useState(false)

  const [splash, setSplash] = useState(false)
  const [floaters, setFloaters] = useState([])
  const splashTimer = useRef(null)

  const refresh = () => {
    const request = dateParam ? getByDate(dateParam) : getToday()
    request.then(res => setLog(res.data)).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { refresh() }, [dateParam])
  useEffect(() => { getToday().then(res => setServerToday(res.data.date)).catch(console.error) }, [])
  useEffect(() => () => clearTimeout(splashTimer.current), [])

  const viewDate = log?.date
  const isToday = !!viewDate && viewDate === serverToday
  const canGoNext = !!viewDate && !!serverToday && viewDate < serverToday
  const goTo = iso => setSearchParams(iso === serverToday ? {} : { date: iso })
  const dayWord = isToday ? 'today' : 'on this day'

  const handleEstimate = async () => {
    if (!foodForm.name) return
    setEstimating(true)
    setEstimateError('')
    try {
      const res = await estimateFood({ name: foodForm.name, quantity: foodForm.quantity })
      setFoodForm(f => ({ ...f, calories: res.data.calories, protein_g: res.data.protein_g }))
    } catch (err) {
      setEstimateError(err.response?.data?.error || 'Could not estimate this food. Enter the numbers by hand.')
    } finally {
      setEstimating(false)
    }
  }

  const handleAddFood = async () => {
    if (!foodForm.name) return
    setAddingFood(true)
    try {
      await addFood({ ...foodForm, date: viewDate })
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
      await addExercise({ ...exerciseForm, date: viewDate })
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
    // splash straight away so the orb reacts to the tap, the number follows the server
    setSplash(true)
    clearTimeout(splashTimer.current)
    splashTimer.current = setTimeout(() => setSplash(false), 700)
    const id = Date.now() + Math.random()
    setFloaters(f => [...f, { id, amount }])
    setTimeout(() => setFloaters(f => f.filter(x => x.id !== id)), 1100)
    await addWater(amount, viewDate)
    refresh()
  }

  const handleDeleteWater = async (id) => {
    await deleteWater(id)
    refresh()
  }

  const totalWater = log?.total_water_ml || 0
  const waterPercent = Math.min(100, Math.round((totalWater / WATER_GOAL_ML) * 100))

  if (loading) return <div className="app-loading">Loading your log...</div>

  return (
    <div className="log-page">
      <div className="log-header">
        <div>
          <h1>Daily Log</h1>
          <div className="date-nav">
            <button type="button" className="date-step" aria-label="Previous day" onClick={() => viewDate && goTo(shiftDate(viewDate, -1))}>‹</button>
            <span className="date-label">
              {viewDate ? parseDate(viewDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : ''}
            </span>
            <button type="button" className="date-step" aria-label="Next day" disabled={!canGoNext} onClick={() => goTo(shiftDate(viewDate, 1))}>›</button>
            {!isToday && serverToday && (
              <button type="button" className="date-today" onClick={() => goTo(serverToday)}>Back to today</button>
            )}
          </div>
        </div>
        <div className="log-stats">
          <div className="stat-pill cal">
            <span className="stat-value">{log?.total_calories || 0}</span>
            <span className="stat-label">kcal</span>
          </div>
          <div className="stat-pill protein">
            <span className="stat-value">{log?.total_protein || 0}g</span>
            <span className="stat-label">protein</span>
          </div>
          <div className="stat-pill water">
            <span className="stat-value">{Math.round(totalWater / 1000 * 10) / 10}L</span>
            <span className="stat-label">water</span>
          </div>
        </div>
      </div>

      <div className="section-tabs" role="tablist">
        {['food', 'exercise', 'water'].map(s => (
          <button
            key={s}
            role="tab"
            aria-selected={activeSection === s}
            className={`section-tab ${s} ${activeSection === s ? 'active' : ''}`}
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
            {estimateError && <div className="form-note error">{estimateError}</div>}
            <button className="btn-add" onClick={handleAddFood} disabled={addingFood || !foodForm.name}>
              {addingFood ? 'Adding...' : '+ Add food'}
            </button>
          </div>

          <div className="entries-list">
            {MEAL_TYPES.map(mealType => {
              const entries = log?.food_entries?.filter(e => e.meal_type === mealType) || []
              if (entries.length === 0) return null
              return (
                <div key={mealType} className={`meal-group ${mealType}`}>
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
                        {entry.protein_g && <span className="protein-chip">{entry.protein_g}g protein</span>}
                      </div>
                      <button className="btn-delete" aria-label={`Delete ${entry.name}`} onClick={() => handleDeleteFood(entry.id)}>×</button>
                    </div>
                  ))}
                </div>
              )
            })}
            {(!log?.food_entries || log.food_entries.length === 0) && (
              <div className="empty-entries">🍽️<br />No food logged {dayWord}</div>
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
              <div key={entry.id} className="entry-row solo ex">
                <div className="entry-info">
                  <span className="entry-name">🏃 {entry.name}</span>
                  <span className="entry-qty">{entry.duration_mins} mins</span>
                </div>
                <div className="entry-macros">
                  {entry.calories_burned && <span>{entry.calories_burned} kcal burned</span>}
                </div>
                <button className="btn-delete" aria-label={`Delete ${entry.name}`} onClick={() => handleDeleteExercise(entry.id)}>×</button>
              </div>
            ))}
            {(!log?.exercise_entries || log.exercise_entries.length === 0) && (
              <div className="empty-entries">🏃<br />No exercise logged {dayWord}</div>
            )}
          </div>
        </div>
      )}

      {activeSection === 'water' && (
        <div className="section">
          <div className="water-tracker">
            <WaterOrb ml={totalWater} percent={waterPercent} splash={splash} />

            <div className="water-buttons">
              <p>{waterPercent >= 100 ? 'Goal reached. Nicely done 🎉' : `${Math.max(0, WATER_GOAL_ML - totalWater)} ml to go`}</p>
              <div className="water-quick">
                {[150, 250, 350, 500].map(ml => (
                  <button key={ml} className="btn-water" onClick={() => handleAddWater(ml)}>
                    💧 {ml}ml
                  </button>
                ))}
              </div>
              <div className="floaters" aria-hidden="true">
                {floaters.map(f => <span key={f.id} className="floater">+{f.amount} ml</span>)}
              </div>
            </div>
          </div>

          <div className="entries-list">
            {log?.water_entries?.map(entry => (
              <div key={entry.id} className="entry-row solo wt">
                <div className="entry-info">
                  <span className="entry-name">💧 Water</span>
                  <span className="entry-qty">{entry.amount_ml}ml</span>
                </div>
                <div className="entry-macros">
                  <span>{new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <button className="btn-delete" aria-label="Delete water entry" onClick={() => handleDeleteWater(entry.id)}>×</button>
              </div>
            ))}
            {(!log?.water_entries || log.water_entries.length === 0) && (
              <div className="empty-entries">💧<br />No water logged {dayWord}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
