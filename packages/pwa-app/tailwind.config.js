/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'xero-blue': '#13B5EA',
        // Arc Forge dark theme
        'arc': {
          'bg-primary': '#0a0e14',
          'bg-secondary': '#0f1419',
          'bg-tertiary': '#1a1f29',
          'border': '#2d333d',
          'border-subtle': '#1e2329',
          'text-primary': '#c9d1d9',
          'text-secondary': '#8b949e',
          'text-tertiary': '#6e7681',
          'text-dim': '#484f58',
          'accent': '#7eb88e',
          'accent-dim': '#5a8a6a',
        },
      },
      fontFamily: {
        'sans': ['Plus Jakarta Sans', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Inconsolata', 'monospace'],
      },
    },
  },
  plugins: [],
}
