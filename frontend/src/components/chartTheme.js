// Chart colours. Recharts wants real values for some props, so they live here.
// These match the colour tokens in index.css for each theme.
export function chartColors(isDark) {
  return isDark
    ? {
        calories: '#e8b4a0',
        protein: '#c4b0f0',
        water: '#a0c4e8',
        exercise: '#b4e8a0',
        gold: '#e8d4a0',
        rose: '#e8a0b4',
        text: 'rgba(245,240,235,0.75)',
        muted: 'rgba(245,240,235,0.42)',
        grid: 'rgba(255,255,255,0.06)',
        cursor: 'rgba(255,255,255,0.05)',
        surface: '#161412',
        meals: ['#e8d4a0', '#e8b4a0', '#c4b0f0', '#b4e8a0'],
      }
    : {
        calories: '#c4502f',
        protein: '#6a4cc4',
        water: '#2a74c2',
        exercise: '#1f8a58',
        gold: '#a87300',
        rose: '#c2416e',
        text: 'rgba(43,29,24,0.8)',
        muted: 'rgba(43,29,24,0.55)',
        grid: 'rgba(110,60,40,0.1)',
        cursor: 'rgba(110,60,40,0.06)',
        surface: '#ffffff',
        meals: ['#a87300', '#c4502f', '#6a4cc4', '#1f8a58'],
      }
}
