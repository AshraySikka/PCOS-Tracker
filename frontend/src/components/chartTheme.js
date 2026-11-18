// Chart colours. Recharts needs real values (not CSS variables) for some props,
// so they live here. Light and dark values match the tokens in index.css.
export function chartColors(isDark) {
  return isDark
    ? {
        accent: '#3fc1b3',
        text: '#c3c2b7',
        muted: '#9a988f',
        grid: '#302f2d',
        surface: '#1a1a19',
        cursor: 'rgba(240,239,236,0.06)',
        ref: '#9a988f',
        meals: ['#3987e5', '#d95926', '#199e70', '#c98500'],
      }
    : {
        accent: '#0f766e',
        text: '#52514e',
        muted: '#6b6a65',
        grid: '#e3e1db',
        surface: '#fcfcfb',
        cursor: 'rgba(22,22,21,0.05)',
        ref: '#6b6a65',
        meals: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'],
      }
}
