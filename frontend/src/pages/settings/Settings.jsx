import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import './settings.css'

export default function Settings() {
  const navigate = useNavigate()
  const [prefs, setPrefs] = useState({
    meal_reminders: true,
    water_reminders: true,
    breakfast_time: '08:00',
    lunch_time: '13:00',
    dinner_time: '19:00',
    water_interval_hours: 2,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [notifSupported, setNotifSupported] = useState(false)
  const [notifPermission, setNotifPermission] = useState('default')
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    api.get('/api/notifications/preferences/')
      .then(res => setPrefs(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))

    if ('Notification' in window && 'serviceWorker' in navigator) {
      setNotifSupported(true)
      setNotifPermission(Notification.permission)
    }
  }, [])

  const enableNotifications = async () => {
    try {
      const permission = await Notification.requestPermission()
      setNotifPermission(permission)
      if (permission !== 'granted') return

      const reg = await navigator.serviceWorker.ready
      const keyRes = await api.get('/api/notifications/vapid-key/')
      const vapidKey = keyRes.data.public_key

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey
      })

      await api.post('/api/notifications/subscribe/', sub.toJSON())
      setSubscribed(true)
    } catch (err) {
      console.error('Notification setup failed:', err)
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      await api.patch('/api/notifications/preferences/', prefs)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const update = (field, value) => setPrefs(p => ({ ...p, [field]: value }))

  if (loading) return <div className="settings-loading">Loading settings...</div>

  return (
    <div className="settings-page">
      <div className="settings-header">
        <button className="btn-back" onClick={() => navigate('/dashboard')}>← Back</button>
        <h1>Settings</h1>
      </div>

      <div className="settings-section">
        <h2>Push Notifications</h2>
        <p>Get reminded to eat, drink water, and exercise on time.</p>

        {!notifSupported && (
          <div className="notif-warning">
            Push notifications aren't supported in this browser. On iPhone, add this app to your home screen first.
          </div>
        )}

        {notifSupported && notifPermission !== 'granted' && (
          <button className="btn-enable-notif" onClick={enableNotifications}>
            🔔 Enable notifications
          </button>
        )}

        {notifSupported && notifPermission === 'granted' && (
          <div className="notif-granted">✓ Notifications enabled</div>
        )}
      </div>

      <div className="settings-section">
        <h2>Meal reminders</h2>
        <div className="toggle-row">
          <span>Enable meal reminders</span>
          <label className="toggle">
            <input
              type="checkbox"
              checked={prefs.meal_reminders}
              onChange={e => update('meal_reminders', e.target.checked)}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        {prefs.meal_reminders && (
          <div className="time-pickers">
            <div className="time-field">
              <label>Breakfast</label>
              <input type="time" value={prefs.breakfast_time} onChange={e => update('breakfast_time', e.target.value)} />
            </div>
            <div className="time-field">
              <label>Lunch</label>
              <input type="time" value={prefs.lunch_time} onChange={e => update('lunch_time', e.target.value)} />
            </div>
            <div className="time-field">
              <label>Dinner</label>
              <input type="time" value={prefs.dinner_time} onChange={e => update('dinner_time', e.target.value)} />
            </div>
          </div>
        )}
      </div>

      <div className="settings-section">
        <h2>Water reminders</h2>
        <div className="toggle-row">
          <span>Enable water reminders</span>
          <label className="toggle">
            <input
              type="checkbox"
              checked={prefs.water_reminders}
              onChange={e => update('water_reminders', e.target.checked)}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        {prefs.water_reminders && (
          <div className="interval-field">
            <label>Remind me every</label>
            <div className="interval-row">
              {[1, 2, 3, 4].map(h => (
                <button
                  key={h}
                  className={`interval-btn ${prefs.water_interval_hours === h ? 'active' : ''}`}
                  onClick={() => update('water_interval_hours', h)}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button className="btn-save" onClick={save} disabled={saving}>
        {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save settings'}
      </button>
    </div>
  )
}
