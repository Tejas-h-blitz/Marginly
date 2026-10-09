/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // High-precision financial instrument neutral scale
        surface: {
          light: '#ffffff',
          'light-subtle': '#f9fafb',
          'light-muted': '#f3f4f6',
          dark: '#111215',
          'dark-subtle': '#16181d',
          'dark-muted': '#1c1f26',
        },
        border: {
          light: '#e5e7eb',
          'light-subtle': '#f3f4f6',
          dark: '#262930',
          'dark-subtle': '#1e2026',
        },
        accent: {
          // Warning & Whale concentration accent (used sparingly)
          warning: '#f59e0b',
          'warning-subtle': 'rgba(245, 158, 11, 0.12)',
          negative: '#ef4444',
          'negative-subtle': 'rgba(239, 68, 68, 0.12)',
          healthy: '#10b981',
          'healthy-subtle': 'rgba(16, 185, 129, 0.12)',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      }
    },
  },
  plugins: [],
}
