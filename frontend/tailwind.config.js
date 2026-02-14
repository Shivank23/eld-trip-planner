/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'eld-orange': '#f97316',
        'eld-blue': '#1e40af',
        'eld-green': '#16a34a',
        'eld-red': '#dc2626',
        'eld-gray': '#6b7280'
      }
    },
  },
  plugins: [],
}
