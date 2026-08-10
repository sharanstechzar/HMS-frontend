/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0f766e',
          dark: '#0b5c56',
          light: '#e6f4f3',
        },
        accent: '#2563eb',
        danger: {
          DEFAULT: '#dc2626',
          light: '#fef2f2',
        },
        warning: {
          DEFAULT: '#d97706',
          light: '#fffbeb',
        },
        success: {
          DEFAULT: '#16a34a',
          light: '#f0fdf4',
        },
        sidebar: {
          bg: '#0b2e33',
          hover: '#123f45',
          text: '#d7e7e6',
          active: '#ffffff',
        },
        surface: '#ffffff',
        background: '#f4f6f8',
        border: '#e2e8f0',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
