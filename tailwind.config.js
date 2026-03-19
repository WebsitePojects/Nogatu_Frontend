/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './portal/index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFFDF5',
          100: '#FFF8E1',
          200: '#FFECB3',
          300: '#FFD54F',
          400: '#FFCA28',
          500: '#F59E0B',
          600: '#D4870A',
          700: '#B8720A',
          800: '#8B5A08',
          900: '#6B4506',
          950: '#4A2F04',
        },
        sidebar: {
          bg: '#1A1207',
          hover: '#2D2010',
          active: '#3A2A15',
        },
        brand: {
          gold: '#D4A528',
          'gold-light': '#E7C679',
          'gold-dark': '#B8860B',
          brown: '#592219',
          'brown-light': '#6d3028',
          'brown-dark': '#3A1000',
          yellow: '#F5C518',
          'yellow-light': '#FFD54F',
          cream: '#FFFDF5',
          ivory: '#FFF8E1',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-down': {
          '0%': { opacity: '0', transform: 'translateY(-30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-left': {
          '0%': { opacity: '0', transform: 'translateX(60px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-right': {
          '0%': { opacity: '0', transform: 'translateX(-60px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-15px) rotate(3deg)' },
        },
        'float-reverse': {
          '0%, 100%': { transform: 'translateY(-10px)' },
          '50%': { transform: 'translateY(10px)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'pulsate': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s ease-out forwards',
        'fade-down': 'fade-down 0.6s ease-out forwards',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'slide-left': 'slide-left 0.7s ease-out forwards',
        'slide-right': 'slide-right 0.7s ease-out forwards',
        'scale-in': 'scale-in 0.5s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 8s ease-in-out infinite',
        'float-reverse': 'float-reverse 7s ease-in-out infinite',
        'gradient-x': 'gradient-x 8s ease infinite',
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
        'spin-slow': 'spin-slow 25s linear infinite',
        'pulsate': 'pulsate 2s infinite',
        'shimmer': 'shimmer 3s linear infinite',
      },
    },
  },
  plugins: [],
};
