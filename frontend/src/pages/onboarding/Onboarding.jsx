import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import './onboarding.css'

const SYMPTOMS = [
  'Irregular periods', 'Weight gain', 'Fatigue', 'Acne',
  'Hair loss', 'Excess hair growth', 'Mood swings', 'Brain fog',
  'Sleep issues', 'Bloating', 'Sugar cravings', 'Insulin resistance'
]

const CUISINES = [
  'Indian', 'Mediterranean', 'Chinese', 'Italian',
  'Mexican', 'Japanese', 'Middle Eastern', 'American',
  'Thai', 'Korean', 'Greek', 'French'
]

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
  { value: 'lightly_active', label: 'Lightly active', desc: '1-3 days/week' },
  { value: 'moderately_active', label: 'Moderately active', desc: '3-5 days/week' },
  { value: 'very_active', label: 'Very active', desc: '6-7 days/week' },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
    age: '',
    weight_kg: '',
    height_cm: '',
    activity_level: 'sedentary',
    symptoms: [],
    cuisine_preferences: [],
    food_items: '',
    goal: '',
  })

  const update = (field, value) => setData(prev => ({ ...prev, [field]: value }))

  const toggleArray = (field, value) => {
    setData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }))
  }

  const submit = async () => {
    setLoading(true)
    try {
      await api.patch('/api/profile/', data)
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const totalSteps = 5

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(step / totalSteps) * 100}%` }} />
        </div>

        <div className="step-counter">Step {step} of {totalSteps}</div>

        {step === 1 && (
          <div className="step">
            <div className="step-icon">🌸</div>
            <h2>Let's start with the basics</h2>
            <p>This helps us personalise your plan</p>
            <div className="fields">
              <div className="field">
                <label>Age</label>
                <input
                  type="number"
                  placeholder="28"
                  value={data.age}
                  onChange={e => update('age', e.target.value)}
                  onBlur={e => {
                    const val = parseInt(e.target.value)
                    if (!e.target.value) return
                    if (val < 13) update('age', 13)
                    if (val > 80) update('age', 80)
                  }}
                />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Weight (kg)</label>
                  <input
                    type="number"
                    placeholder="65"
                    value={data.weight_kg}
                    onChange={e => update('weight_kg', e.target.value)}
                    onBlur={e => {
                      const val = parseFloat(e.target.value)
                      if (!e.target.value) return
                      if (val < 30) update('weight_kg', 30)
                      if (val > 300) update('weight_kg', 300)
                    }}
                  />
                </div>
                <div className="field">
                  <label>Height (cm)</label>
                  <input
                    type="number"
                    placeholder="163"
                    value={data.height_cm}
                    onChange={e => update('height_cm', e.target.value)}
                    onBlur={e => {
                      const val = parseFloat(e.target.value)
                      if (!e.target.value) return
                      if (val < 100) update('height_cm', 100)
                      if (val > 250) update('height_cm', 250)
                    }}
                  />
                </div>
              </div>
              <div className="field">
                <label>Your goal <span style={{color:'rgba(245,240,235,0.3)', fontWeight:300}}>(optional)</span></label>
                <textarea
                  placeholder="Optional — e.g. manage symptoms, lose weight, improve energy..."
                  value={data.goal}
                  onChange={e => update('goal', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step">
            <div className="step-icon">⚡</div>
            <h2>Activity level</h2>
            <p>How active are you on a typical week?</p>
            <div className="activity-options">
              {ACTIVITY_LEVELS.map(opt => (
                <button
                  key={opt.value}
                  className={`activity-option ${data.activity_level === opt.value ? 'selected' : ''}`}
                  onClick={() => update('activity_level', opt.value)}
                >
                  <span className="activity-label">{opt.label}</span>
                  <span className="activity-desc">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step">
            <div className="step-icon">💫</div>
            <h2>Your symptoms</h2>
            <p>Select all that apply to you</p>
            <div className="tag-grid">
              {SYMPTOMS.map(s => (
                <button
                  key={s}
                  className={`tag ${data.symptoms.includes(s) ? 'selected' : ''}`}
                  onClick={() => toggleArray('symptoms', s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="step">
            <div className="step-icon">🍽️</div>
            <h2>Food preferences</h2>
            <p>What cuisines do you enjoy? Select all that apply</p>
            <div className="tag-grid">
              {CUISINES.map(c => (
                <button
                  key={c}
                  className={`tag ${data.cuisine_preferences.includes(c) ? 'selected' : ''}`}
                  onClick={() => toggleArray('cuisine_preferences', c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="step">
            <div className="step-icon">📋</div>
            <h2>Your food list</h2>
            <p>List foods you usually eat — your AI meal plan will be built around these</p>
            <div className="field">
              <textarea
                placeholder="e.g. eggs, chicken, rice, spinach, yogurt, almonds, lentils, oats..."
                value={data.food_items}
                onChange={e => update('food_items', e.target.value)}
                rows={5}
              />
            </div>
            <div className="upload-divider">
              <span>or upload a file</span>
            </div>
            <div className="field">
              <label className="file-upload-label">
                <input
                  type="file"
                  accept=".txt,.csv"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = ev => update('food_items', ev.target.result)
                    reader.readAsText(file)
                  }}
                />
                <span className="file-upload-btn">📁 Choose a .txt or .csv file</span>
              </label>
            </div>
            <p className="hint">The more you add, the more personalised your meal plan will be</p>
          </div>
        )}

        <div className="step-actions">
          {step > 1 && (
            <button className="btn-secondary" onClick={() => setStep(s => s - 1)}>
              Back
            </button>
          )}
          {step < totalSteps ? (
            <button className="btn-primary" onClick={() => setStep(s => s + 1)}>
              Continue
            </button>
          ) : (
            <button className="btn-primary" onClick={submit} disabled={loading}>
              {loading ? 'Saving...' : 'Complete setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}