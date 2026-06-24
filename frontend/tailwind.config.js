/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#152D2F',
          deep: '#33544E',
          primary: '#4CAF6A',
          light: '#8BE28A',
        },
        accent: {
          warning: '#F08A4B',
          danger: '#E57A7A',
        },
        ui: {
          bg: '#F7FCFA',
          card: '#D8E1DB',
        },
      },
    },
  },
  plugins: [],
};
