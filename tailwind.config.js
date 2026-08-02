/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0a1730',
          900: '#0e1f3d',
          800: '#132a52',
          700: '#1c3866',
        },
        gold: {
          500: '#b8935a',
          400: '#c9a876',
          300: '#dcc399',
        },
        cream: '#f5f2ea',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
