/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // AlumniConnect brand palette
        navy: {
          50: '#f0f4fa',
          100: '#d9e3f1',
          200: '#b3c7e3',
          300: '#8aa8d3',
          400: '#5c82be',
          500: '#3b62a5',
          600: '#2b4b86',
          700: '#1f3868',
          800: '#16294d',
          900: '#0f1d38',
          950: '#0a1428',
        },
        royal: {
          50: '#eef3ff',
          100: '#dbe6ff',
          200: '#bdd0ff',
          300: '#93b0ff',
          400: '#6285fb',
          500: '#3f61f0',
          600: '#2a44db',
          700: '#2334b0',
          800: '#21308c',
          900: '#1f2f70',
        },
        accent: {
          50: '#e9fbf8',
          100: '#c9f5ee',
          200: '#96eade',
          300: '#5cd8c8',
          400: '#2fbfae',
          500: '#16a394',
          600: '#0f8378',
          700: '#106960',
          800: '#12544e',
          900: '#134641',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e5e9f0',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'Segoe UI',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 29, 56, 0.06), 0 4px 16px rgba(15, 29, 56, 0.06)',
        'card-hover': '0 4px 8px rgba(15, 29, 56, 0.08), 0 12px 32px rgba(15, 29, 56, 0.12)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'slide-in': 'slide-in 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
