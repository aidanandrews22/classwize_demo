/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'blink': 'blink 1s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      colors: {
        background: '#f5f5f7',
        card: {
          DEFAULT: '#ffffff',
          foreground: '#1d1d1f',
        },
        accent: {
          DEFAULT: '#0071e3',
          hover: '#005bbf',
        },
        highlight: {
          green: 'rgba(52, 199, 89, 0.2)',
          blue: 'rgba(0, 122, 255, 0.2)',
          red: 'rgba(255, 59, 48, 0.2)',
        },
      },
    },
  },
  plugins: [],
}