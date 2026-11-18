import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { getDashboard } from '../../api/reports'
import api from '../../api/client'
import { chartColors } from '../../components/chartTheme'
import ThemeToggle from '../../components/ThemeToggle'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, PieChart, Pie, Cell,
} from 'recharts'
import './dashboard.css'

const WATER_GOAL_ML = 2500
const RANGES = [
  { key: '7', label: '7 days' },
  { key: '30', label: '30 days' },
  { key: 'all', label: 'All time' },
]
const MEALS = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_EMOJI = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// ---------- small helpers ----------

// "2026-11-17" -> local Date, avoiding the UTC shift of new Date('2026-11-17')
function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function toIso(date) {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}
const fmtShort = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const fmtLong = d => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
const fmtNum = n => Math.round(n).toLocaleString('en-US')
const litres = ml => (ml / 1000).toFixed(1)

// Round the top of the y axis up to a tidy number
function niceMax(value) {
  const target = Math.max(value, 1) * 1.1
  const pow = Math.pow(10, Math.floor(Math.log10(target)))
  const step = [1, 2, 2.5, 5, 10].map(m => m * pow).find(st => st * 4 >= target) / 4
  return Math.ceil(target / step) * step
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function delta(current, previous, rangeKey) {
  if (rangeKey === 'all' || !previous || previous <= 0) return null
  const pct = Math.round(((current - previous) / previous) * 100)
  return { pct, label: `vs the previous ${rangeKey} days` }
}

// Numbers glide to their new value when the range changes
function CountUp({ value, decimals = 0 }) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || from.current === value) {
      from.current = value
      setShown(value)
      return
    }
    const start = from.current
    const t0 = performance.now()
    let raf
    const tick = now => {
      const k = Math.min(1, (now - t0) / 650)
      const eased = 1 - Math.pow(1 - k, 3)
      setShown(start + (value - start) * eased)
      if (k < 1) raf = requestAnimationFrame(tick)
      else from.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])
  const out = decimals ? shown.toFixed(decimals) : Math.round(shown).toLocaleString('en-US')
  return <>{out}</>
}

// Daily points for short ranges, weekly buckets once there are too many to read.
function buildPoints(days) {
  const daily = days.length <= 60
  if (daily) {
    return {
      mode: 'daily',
      points: days.map(d => {
        const date = parseDate(d.date)
        return {
          date: d.date,
          label: days.length <= 7 ? date.toLocaleDateString('en-US', { weekday: 'short' }) : fmtShort(date),
          fullLabel: fmtLong(date),
          logged: d.logged,
          calories: d.calories,
          protein: d.protein,
          water: d.water_ml / 1000,
          exercise: d.exercise_mins,
        }
      }),
    }
  }
  const points = []
  for (let i = 0; i < days.length; i += 7) {
    const chunk = days.slice(i, i + 7)
    const avg = key => {
      const vals = chunk.map(c => c[key]).filter(v => v > 0)
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    }
    const start = parseDate(chunk[0].date)
    points.push({
      date: chunk[0].date,
      label: fmtShort(start),
      fullLabel: `Week of ${fmtShort(start)}`,
      logged: chunk.some(c => c.logged),
      calories: Math.round(avg('calories')),
      protein: Math.round(avg('protein') * 10) / 10,
      water: Math.round(avg('water_ml') / 100) / 10,
      exercise: chunk.reduce((a, c) => a + c.exercise_mins, 0),
    })
  }
  return { mode: 'weekly', points }
}

// ---------- pieces ----------

function RangeToggle({ value, onChange }) {
  const idx = RANGES.findIndex(r => r.key === value)
  return (
    <div className="range-toggle" role="group" aria-label="Time range">
      <span className="range-pill" style={{ transform: `translateX(${idx * 100}%)` }} aria-hidden="true" />
      {RANGES.map(r => (
        <button
          key={r.key}
          type="button"
          className={value === r.key ? 'active' : ''}
          aria-pressed={value === r.key}
          onClick={() => onChange(r.key)}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}

function Kpi({ emoji, tone, title, value, decimals, unit, note, change, progress }) {
  return (
    <div className={`kpi ${tone}`}>
      <div className="kpi-top">
        <span className="kpi-emoji" aria-hidden="true">{emoji}</span>
        <span className="kpi-title">{title}</span>
      </div>
      <div className="kpi-value">
        <CountUp value={value} decimals={decimals} /><span className="kpi-unit">{unit}</span>
      </div>
      {progress !== undefined && (
        <div
          className="kpi-bar"
          role="progressbar"
          aria-valuenow={Math.min(100, Math.round(progress))}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
      )}
      <div className="kpi-note">{note}</div>
      {change && (
        <div className={`kpi-delta ${change.pct > 0 ? 'up' : change.pct < 0 ? 'down' : ''}`}>
          {change.pct > 0 ? '▲' : change.pct < 0 ? '▼' : '='} {Math.abs(change.pct)}% <span>{change.label}</span>
        </div>
      )}
    </div>
  )
}

function ChartTooltip({ active, payload, metric, mode }) {
  if (!active || !payload || !payload.length) return null
  const p = payload[0].payload
  const value = p[metric.key]
  const hasValue = metric.key === 'exercise' ? true : value > 0
  return (
    <div className="chart-tooltip">
      <div className="tt-title">{p.fullLabel}</div>
      <div className="tt-value" style={{ color: metric.color }}>
        {hasValue ? `${metric.format(value)} ${metric.unit}` : 'Nothing logged'}
      </div>
      {mode === 'weekly' && hasValue && <div className="tt-hint">{metric.weeklyNote}</div>}
      {mode === 'daily' && <div className="tt-hint">Click to open this day</div>}
    </div>
  )
}

function MetricChart({ days, summary, profile, colors, navigate }) {
  const [metricKey, setMetricKey] = useState('calories')
  const { points, mode } = useMemo(() => buildPoints(days), [days])

  const proteinTarget = profile?.protein_target_g || null
  const METRICS = {
    calories: {
      key: 'calories', label: 'Calories', emoji: '🔥', unit: 'kcal', color: colors.calories, format: v => fmtNum(v),
      ref: summary.avg_calories || null, refLabel: 'average', weeklyNote: 'Average on days with food logged',
    },
    protein: {
      key: 'protein', label: 'Protein', emoji: '🥩', unit: 'g', color: colors.protein, format: v => Math.round(v * 10) / 10,
      ref: proteinTarget || summary.avg_protein || null, refLabel: proteinTarget ? 'target' : 'average',
      weeklyNote: 'Average on days with food logged',
    },
    water: {
      key: 'water', label: 'Water', emoji: '💧', unit: 'L', color: colors.water, format: v => v.toFixed(1),
      ref: WATER_GOAL_ML / 1000, refLabel: 'goal', weeklyNote: 'Average on days with water logged',
    },
    exercise: {
      key: 'exercise', label: 'Exercise', emoji: '🏃‍♀️', unit: 'min', color: colors.exercise, format: v => fmtNum(v),
      ref: null, refLabel: '', weeklyNote: 'Total for the week',
    },
  }
  const metric = METRICS[metricKey]
  const hasAny = points.some(p => p[metric.key] > 0)
  const heading = mode === 'weekly'
    ? (metricKey === 'exercise' ? 'Minutes per week' : 'Weekly average per day')
    : 'Per day'

  const openPoint = pt => {
    if (mode !== 'daily' || !pt) return
    navigate(`/log?date=${pt.date}`)
  }

  const tick = { fill: colors.muted, fontSize: 12 }
  const common = { data: points, margin: { top: 12, right: 8, left: -8, bottom: 0 } }
  const axes = (
    <>
      <CartesianGrid stroke={colors.grid} vertical={false} />
      <XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={18} />
      <YAxis
        tick={tick}
        axisLine={false}
        tickLine={false}
        width={44}
        domain={[0, dataMax => niceMax(Math.max(dataMax, metric.ref || 0))]}
      />
      <Tooltip cursor={{ stroke: metric.color, strokeOpacity: 0.35, fill: colors.cursor }} content={<ChartTooltip metric={metric} mode={mode} />} />
      {metric.ref && <ReferenceLine y={metric.ref} stroke={colors.muted} strokeDasharray="4 4" />}
    </>
  )

  return (
    <div className="card chart-card" style={{ '--mc': metric.color }}>
      <div className="card-head">
        <div>
          <h2>{metric.emoji} {metric.label}</h2>
          <p>
            {heading}
            {metric.ref ? `. Dashed line is your ${metric.refLabel}, ${metric.format(metric.ref)} ${metric.unit}` : ''}
          </p>
        </div>
        <div className="metric-tabs" role="tablist" aria-label="Metric">
          {Object.values(METRICS).map(m => (
            <button
              key={m.key}
              type="button"
              role="tab"
              aria-selected={metricKey === m.key}
              className={metricKey === m.key ? 'active' : ''}
              style={{ '--tc': m.color }}
              onClick={() => setMetricKey(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {hasAny ? (
        <ResponsiveContainer width="100%" height={270} key={metricKey}>
          {metricKey === 'exercise' ? (
            <BarChart {...common}>
              {axes}
              <Bar
                dataKey="exercise"
                fill={metric.color}
                radius={[5, 5, 0, 0]}
                maxBarSize={22}
                onClick={entry => openPoint(entry?.payload || entry)}
                style={mode === 'daily' ? { cursor: 'pointer' } : undefined}
                animationDuration={700}
              />
            </BarChart>
          ) : (
            <AreaChart
              {...common}
              onClick={state => openPoint(points[Number(state?.activeTooltipIndex)])}
              style={mode === 'daily' ? { cursor: 'pointer' } : undefined}
            >
              <defs>
                <linearGradient id={`grad-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={metric.color} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={metric.color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              {axes}
              <Area
                type="monotone"
                dataKey={metricKey}
                stroke={metric.color}
                strokeWidth={2.5}
                fill={`url(#grad-${metricKey})`}
                dot={mode === 'daily' && points.length <= 31 ? { r: 3, fill: metric.color, strokeWidth: 0 } : false}
                activeDot={{ r: 6, stroke: colors.surface, strokeWidth: 2, fill: metric.color }}
                animationDuration={800}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      ) : (
        <div className="chart-empty">
          Nothing logged for {metric.label.toLowerCase()} in this period yet. <Link to="/log">Open today's log</Link>
        </div>
      )}
    </div>
  )
}

function Highlights({ data, profile }) {
  const { days, summary, streak } = data
  const target = profile?.protein_target_g
  const foodDays = days.filter(d => d.calories > 0)
  const waterDays = days.filter(d => d.water_ml > 0)
  const proteinHits = target ? foodDays.filter(d => d.protein >= target).length : null
  const waterHits = waterDays.filter(d => d.water_ml >= WATER_GOAL_ML).length

  // best weekday for exercise, by average minutes across that weekday's days in range
  const perDay = Array.from({ length: 7 }, () => ({ mins: 0, n: 0 }))
  days.forEach(d => {
    const w = parseDate(d.date).getDay()
    perDay[w].mins += d.exercise_mins
    perDay[w].n += 1
  })
  let best = null
  perDay.forEach((p, i) => {
    if (p.n && p.mins > 0) {
      const avg = p.mins / p.n
      if (!best || avg > best.avg) best = { day: WEEKDAYS[i], avg }
    }
  })

  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)
  const rows = [
    { emoji: '🔥', tone: 'peach', label: 'Current streak', value: `${streak.current} ${streak.current === 1 ? 'day' : 'days'}`, sub: `Longest ${streak.longest}` },
    { emoji: '📅', tone: 'rose', label: 'Days logged', value: `${summary.days_logged} of ${summary.days_in_range}`, bar: pct(summary.days_logged, summary.days_in_range) },
  ]
  if (proteinHits !== null) rows.push({ emoji: '🥩', tone: 'lav', label: 'Protein target met', value: `${proteinHits} of ${foodDays.length} days`, bar: pct(proteinHits, foodDays.length) })
  rows.push({ emoji: '💧', tone: 'water', label: `Water goal met (${litres(WATER_GOAL_ML)} L)`, value: `${waterHits} of ${waterDays.length} days`, bar: pct(waterHits, waterDays.length) })
  if (best) rows.push({ emoji: '🏃‍♀️', tone: 'mint', label: 'Most active day', value: best.day, sub: `${Math.round(best.avg)} min on average` })

  return (
    <div className="card highlights">
      <div className="card-head"><div><h2>✨ Highlights</h2></div></div>
      <ul>
        {rows.map(r => (
          <li key={r.label} className={`hl-row ${r.tone}`}>
            <span className="hl-emoji" aria-hidden="true">{r.emoji}</span>
            <div className="hl-body">
              <span className="hl-label">{r.label}</span>
              <strong>{r.value}</strong>
              {r.bar !== undefined && <span className="hl-bar"><span style={{ width: `${r.bar}%` }} /></span>}
              {r.sub && <span className="hl-sub">{r.sub}</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function MealSplit({ byMeal, colors }) {
  const [active, setActive] = useState(null)
  const total = MEALS.reduce((a, m) => a + (byMeal[m] || 0), 0)
  const data = MEALS.map((m, i) => ({
    key: m,
    name: m.charAt(0).toUpperCase() + m.slice(1),
    value: byMeal[m] || 0,
    color: colors.meals[i],
  }))
  return (
    <div className="card split-card">
      <div className="card-head"><div><h2>🍽️ Calories by meal</h2><p>Where your calories come from</p></div></div>
      {total === 0 ? (
        <div className="chart-empty small">No food logged in this period.</div>
      ) : (
        <div className="split-body">
          <div className="donut" onMouseLeave={() => setActive(null)}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  innerRadius={56}
                  outerRadius={82}
                  paddingAngle={3}
                  cornerRadius={5}
                  stroke="none"
                  animationDuration={700}
                  onMouseEnter={(_, i) => setActive(i)}
                >
                  {data.map((d, i) => (
                    <Cell
                      key={d.name}
                      fill={d.color}
                      fillOpacity={active === null || active === i ? 1 : 0.3}
                      style={{ transition: 'fill-opacity 0.2s', outline: 'none' }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <strong>{active === null ? fmtNum(total) : fmtNum(data[active].value)}</strong>
              <span>{active === null ? 'kcal total' : `${MEAL_EMOJI[data[active].key]} ${data[active].name}`}</span>
            </div>
          </div>
          <ul className="split-legend">
            {data.map((d, i) => (
              <li
                key={d.name}
                className={active === i ? 'on' : ''}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
              >
                <span className="swatch" style={{ background: d.color }} />
                <span className="split-name">{d.name}</span>
                <span className="split-val">{fmtNum(d.value)} kcal</span>
                <span className="split-pct">{Math.round((d.value / total) * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function TopList({ title, subtitle, rows, valueOf, noteOf, empty, tone }) {
  const max = Math.max(1, ...rows.map(valueOf))
  return (
    <div className={`card toplist ${tone}`}>
      <div className="card-head"><div><h2>{title}</h2><p>{subtitle}</p></div></div>
      {rows.length === 0 ? (
        <div className="chart-empty small">{empty}</div>
      ) : (
        <ol>
          {rows.map((r, i) => (
            <li key={r.name}>
              <div className="tl-top">
                <span className="tl-rank">{i + 1}</span>
                <span className="tl-name">{r.name}</span>
                <span className="tl-note">{noteOf(r)}</span>
              </div>
              <div className="tl-bar"><span style={{ width: `${(valueOf(r) / max) * 100}%`, animationDelay: `${i * 70}ms` }} /></div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

const WEEKS = 22

function Heatmap({ allDays, endDate, target, navigate }) {
  const [hover, setHover] = useState(null)
  const byDate = useMemo(() => {
    const map = {}
    allDays.forEach(d => { map[d.date] = d })
    return map
  }, [allDays])

  const end = parseDate(endDate)
  const lastMonday = new Date(end)
  lastMonday.setDate(end.getDate() - ((end.getDay() + 6) % 7))
  const firstMonday = new Date(lastMonday)
  firstMonday.setDate(lastMonday.getDate() - (WEEKS - 1) * 7)

  const goalsMet = d => {
    if (!d || !d.logged) return { score: 0, total: target ? 4 : 3 }
    const score =
      (d.calories > 0 ? 1 : 0) +
      (target && d.protein >= target ? 1 : 0) +
      (d.water_ml >= WATER_GOAL_ML ? 1 : 0) +
      (d.exercise_mins > 0 ? 1 : 0)
    return { score, total: 4 }
  }
  const levelOf = d => (d && d.logged ? Math.max(1, goalsMet(d).score) : 0)

  const columns = []
  for (let w = 0; w < WEEKS; w++) {
    const cells = []
    for (let r = 0; r < 7; r++) {
      const date = new Date(firstMonday)
      date.setDate(firstMonday.getDate() + w * 7 + r)
      const iso = toIso(date)
      cells.push({ iso, date, future: date > end, data: byDate[iso] })
    }
    columns.push(cells)
  }

  const shown = hover || { iso: endDate, date: end, data: byDate[endDate] }
  const d = shown.data
  const logged = d && d.logged

  let lastMonth = -1
  return (
    <div className="card heatmap-card">
      <div className="card-head">
        <div>
          <h2>🗓️ Last {WEEKS} weeks</h2>
          <p>Each square is a day. Brighter means more of your daily goals were met. Click a day to open it.</p>
        </div>
      </div>
      <div className="heatmap-body">
        <div className="heatmap-scroll">
          <div className="heatmap">
            <div className="hm-days">
              <span>Mon</span><span /><span>Wed</span><span /><span>Fri</span><span /><span />
            </div>
            <div className="hm-grid">
              <div className="hm-months">
                {columns.map((col, i) => {
                  const m = col[0].date.getMonth()
                  const show = m !== lastMonth
                  lastMonth = m
                  return <span key={i}>{show ? col[0].date.toLocaleDateString('en-US', { month: 'short' }) : ''}</span>
                })}
              </div>
              <div className="hm-cols" onMouseLeave={() => setHover(null)}>
                {columns.map((col, i) => (
                  <div key={i} className="hm-col">
                    {col.map(c => c.future ? (
                      <span key={c.iso} className="hm-cell blank" />
                    ) : (
                      <button
                        key={c.iso}
                        type="button"
                        className={`hm-cell lv${levelOf(c.data)}`}
                        aria-label={`${fmtLong(c.date)}, open this day`}
                        onMouseEnter={() => setHover(c)}
                        onFocus={() => setHover(c)}
                        onClick={() => navigate(`/log?date=${c.iso}`)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="hm-readout" aria-live="polite">
          <div className="hm-readout-date">{fmtLong(shown.date)}</div>
          {logged ? (
            <>
              <div className="hm-readout-goals">{goalsMet(d).score} of {goalsMet(d).total} goals met</div>
              <dl>
                <div className="cal"><dt>🔥 Calories</dt><dd>{fmtNum(d.calories)} kcal</dd></div>
                <div className="pro"><dt>🥩 Protein</dt><dd>{Math.round(d.protein)} g</dd></div>
                <div className="wat"><dt>💧 Water</dt><dd>{litres(d.water_ml)} L</dd></div>
                <div className="exe"><dt>🏃‍♀️ Exercise</dt><dd>{d.exercise_mins} min</dd></div>
              </dl>
            </>
          ) : (
            <div className="hm-readout-goals">Nothing logged</div>
          )}
        </div>
      </div>
      <div className="hm-legend">
        Fewer goals
        {[0, 1, 2, 3, 4].map(l => <span key={l} className={`hm-cell lv${l}`} />)}
        More goals
      </div>
    </div>
  )
}

// ---------- page ----------

export default function Dashboard() {
  const { user, logout } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const colors = chartColors(isDark)

  const [range, setRange] = useState('all')
  const [cache, setCache] = useState({})
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')
  const requested = useRef(new Set())

  const load = key => {
    if (requested.current.has(key)) return
    requested.current.add(key)
    getDashboard(key)
      .then(res => setCache(c => ({ ...c, [res.data.range]: res.data })))
      .catch(() => {
        requested.current.delete(key)
        setError('Could not load your dashboard. Check your connection and try again.')
      })
  }

  useEffect(() => {
    load('all')
    api.get('/api/profile/metrics/').then(res => setProfile(res.data)).catch(console.error)
  }, [])

  useEffect(() => { load(range) }, [range])

  const [showInstall, setShowInstall] = useState(false)
  useEffect(() => {
    window.addEventListener('appinstalled', () => setShowInstall(false))
    if (window.deferredInstallPrompt) setShowInstall(true)
    window.addEventListener('beforeinstallprompt', () => setShowInstall(true))
  }, [])

  const installApp = () => {
    if (window.deferredInstallPrompt) {
      window.deferredInstallPrompt.prompt()
      window.deferredInstallPrompt.userChoice.then(() => {
        window.deferredInstallPrompt = null
        setShowInstall(false)
      })
    }
  }

  const data = cache[range]
  const all = cache.all
  const todayRow = all?.days?.[all.days.length - 1]

  let subtitle = ''
  if (data) {
    const start = parseDate(data.start_date)
    const end = parseDate(data.end_date)
    subtitle = range === 'all'
      ? (data.summary.days_logged
          ? `Everything you have logged since ${fmtShort(start)}, ${start.getFullYear()} · ${data.summary.days_logged} days`
          : 'Nothing logged yet')
      : `${fmtShort(start)} to ${fmtShort(end)}`
  }

  const s = data?.summary
  const prev = data?.previous
  const target = profile?.protein_target_g
  const isDemo = user?.email === 'jane.demo@example.com'

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Good {getTimeOfDay()}{user?.username ? `, ${user.username}` : ''}</h1>
          <p>{subtitle || ' '}</p>
        </div>
        <div className="header-actions">
          {isDemo && <span className="demo-tag">✨ Demo account</span>}
          <ThemeToggle variant="inline" />
          <button className="btn-logout" onClick={logout}>Sign out</button>
        </div>
      </div>

      {showInstall && (
        <div className="install-banner">
          <span>📱 Add PCOS Tracker to your home screen</span>
          <button onClick={installApp}>Install</button>
        </div>
      )}

      {profile && (
        <div className="metrics-row">
          <div className="metric-card tone-peach">
            <span className="metric-icon">⚖️</span>
            <div>
              <span className="metric-value">{profile.bmi || '-'}</span>
              <span className="metric-label">BMI</span>
            </div>
          </div>
          <div className="metric-card tone-lav">
            <span className="metric-icon">🥩</span>
            <div>
              <span className="metric-value">{profile.protein_target_g || '-'}g</span>
              <span className="metric-label">Daily protein target</span>
            </div>
          </div>
          <div className="metric-card tone-mint">
            <span className="metric-icon">🍽️</span>
            <div>
              <span className="metric-value">{profile.per_meal_protein_g || '-'}g</span>
              <span className="metric-label">Per meal protein</span>
            </div>
          </div>
          {todayRow && (
            <div className="metric-card highlight tone-rose">
              <span className="metric-icon">📊</span>
              <div>
                <span className="metric-value">{fmtNum(todayRow.calories)}</span>
                <span className="metric-label">Calories today</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="section-bar">
        <h2>Your numbers</h2>
        <RangeToggle value={range} onChange={setRange} />
      </div>

      {error && !data && <div className="dash-error">{error}</div>}
      {!data && !error && <div className="dash-loading"><span className="dash-spinner" />Loading your dashboard...</div>}

      {data && (
        <>
          <div className="kpi-row">
            <Kpi
              emoji="🔥" tone="peach" title="Calories"
              value={s.avg_calories} unit=" kcal a day"
              note="Average on days with food logged"
              change={delta(s.avg_calories, prev?.avg_calories, range)}
            />
            <Kpi
              emoji="🥩" tone="lav" title="Protein"
              value={s.avg_protein} unit=" g a day"
              progress={target ? (s.avg_protein / target) * 100 : undefined}
              note={target ? `${Math.round((s.avg_protein / target) * 100)}% of your ${target} g target` : 'Add your weight in Profile for a target'}
              change={delta(s.avg_protein, prev?.avg_protein, range)}
            />
            <Kpi
              emoji="💧" tone="water" title="Water"
              value={s.avg_water_ml / 1000} decimals={1} unit=" L a day"
              progress={(s.avg_water_ml / WATER_GOAL_ML) * 100}
              note={`${Math.round((s.avg_water_ml / WATER_GOAL_ML) * 100)}% of your ${litres(WATER_GOAL_ML)} L goal`}
              change={delta(s.avg_water_ml, prev?.avg_water_ml, range)}
            />
            <Kpi
              emoji="🏃‍♀️" tone="mint" title="Exercise"
              value={s.total_exercise_mins} unit=" min"
              note={`Active on ${s.active_days} of ${s.days_in_range} days`}
              change={delta(s.total_exercise_mins, prev?.total_exercise_mins, range)}
            />
          </div>

          <div className="main-grid">
            <MetricChart days={data.days} summary={s} profile={profile} colors={colors} navigate={navigate} />
            <Highlights data={data} profile={profile} />
          </div>

          <div className="trio-grid">
            <MealSplit byMeal={data.by_meal} colors={colors} />
            <TopList
              tone="peach"
              title="🥗 Most logged foods"
              subtitle="By number of times logged"
              rows={data.top_foods}
              valueOf={r => r.count}
              noteOf={r => `${r.count} ${r.count === 1 ? 'time' : 'times'}`}
              empty="No food logged in this period."
            />
            <TopList
              tone="mint"
              title="💪 Workouts"
              subtitle="By total minutes"
              rows={data.top_exercises}
              valueOf={r => r.minutes}
              noteOf={r => `${r.minutes} min · ${r.count} ${r.count === 1 ? 'session' : 'sessions'}`}
              empty="No exercise logged in this period."
            />
          </div>

          {all && <Heatmap allDays={all.days} endDate={all.end_date} target={target} navigate={navigate} />}
        </>
      )}

      <div className="nav-grid">
        <Link to="/log" className="nav-card n-rose">
          <span className="nav-icon">📋</span>
          <span className="nav-label">Daily Log</span>
        </Link>
        <Link to="/meals" className="nav-card n-mint">
          <span className="nav-icon">🥗</span>
          <span className="nav-label">Meal Plan</span>
        </Link>
        <Link to="/exercise" className="nav-card n-gold">
          <span className="nav-icon">🏃‍♀️</span>
          <span className="nav-label">Exercise</span>
        </Link>
        <Link to="/onboarding" className="nav-card n-lav">
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">Profile</span>
        </Link>
        <Link to="/settings" className="nav-card n-water">
          <span className="nav-icon">🔔</span>
          <span className="nav-label">Settings</span>
        </Link>
      </div>
    </div>
  )
}
