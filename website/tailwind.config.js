/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:        '#0B1F17',
        'bg-2':    '#0F2A1E',
        'bg-3':    '#142F22',
        surface:   '#1A3D2B',
        border:    '#2A5240',
        green:     '#7EC8A4',
        'green-2': '#5BAF87',
        gold:      '#D4A86A',
        'gold-2':  '#C49555',
        text:      '#E8F5EE',
        muted:     '#7A9E8A',
      },
      fontFamily: {
        mono:    ['"Space Mono"', 'monospace'],
        display: ['"DM Serif Display"', 'serif'],
        body:    ['"DM Sans"', 'sans-serif'],
      },
      animation: {
        'fade-up':    'fadeUp 0.7s ease forwards',
        'fade-in':    'fadeIn 0.5s ease forwards',
        'candle':     'candleFloat 3s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'scan':       'scan 8s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: 0, transform: 'translateY(24px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: 0 },
          '100%': { opacity: 1 },
        },
        candleFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: 0.4 },
          '50%':      { opacity: 0.9 },
        },
        scan: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(400%)' },
        },
      },
    },
  },
  plugins: [],
}