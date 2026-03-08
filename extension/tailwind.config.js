/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx}', './src/**/*.html'],
  theme: {
    extend: {
      colors: {
        bg:      '#06060f',
        surface: '#0f0f1a',
        border:  '#1e1e30',
        green:   '#00e87a',
        red:     '#ff3b5c',
        neutral: '#666680',
        accent:  '#7c6aff',
        gold:    '#c49a3c',
        text:    '#e2e2f0',
        muted:   '#555570',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    }
  },
  plugins: []
}
