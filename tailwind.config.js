/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./options.html",
    "./options.js"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07), 0 2px 6px 0 rgba(0, 0, 0, 0.02)',
        'glass-hover': '0 16px 40px 0 rgba(31, 38, 135, 0.12), 0 4px 12px 0 rgba(0, 0, 0, 0.04)',
        'glass-dark': '0 12px 40px 0 rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.06)',
        'glass-dark-hover': '0 20px 50px 0 rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.12)',
        'btn-brand': '0 4px 14px 0 rgba(79, 70, 229, 0.35)',
      }
    }
  }
};
