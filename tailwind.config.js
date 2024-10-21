/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#10B981', // Green color for primary actions
        secondary: '#3B82F6', // Blue color for secondary actions
        background: {
          dark: '#111827', // Dark background
          light: '#1F2937', // Lighter background for cards
        },
        text: {
          primary: '#F3F4F6', // Light text for dark backgrounds
          secondary: '#D1D5DB', // Slightly darker text for less emphasis
        },
        accent: '#F59E0B', // Yellow for accents and highlights
      },
    },
  },
  plugins: [],
}