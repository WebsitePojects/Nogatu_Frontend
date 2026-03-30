/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './portal/index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep dark obsidian backgrounds
        obsidian: {
          950: '#060504',
          900: '#0D0B07',
          800: '#141009',
          700: '#1C160D',
          600: '#241D12',
          500: '#2E2618',
        },
        // Premium gold scale
        gold: {
          50:  '#FFFEF0',
          100: '#FFF9CC',
          200: '#FFEE80',
          300: '#FFD700',
          400: '#F5C800',
          500: '#D4AF37',
          600: '#B8960C',
          700: '#9A7B0A',
          800: '#7A6108',
          900: '#5C4806',
          950: '#3D3004',
        },
        // Champagne / warm accent tones
        champagne: {
          50:  '#FFFDF7',
          100: '#FFF8E8',
          200: '#FFE9B0',
          300: '#F7D06B',
          400: '#EDB84A',
          500: '#D4950E',
        },
        // Sidebar tokens
        sidebar: {
          bg:     '#080604',
          hover:  '#1A1610',
          active: '#221C0F',
        },
        // Brand tokens
        brand: {
          gold:         '#D4AF37',
          'gold-light': '#F2D06B',
          'gold-dark':  '#9A7B0A',
          'gold-bright':'#FFD700',
          amber:        '#F59E0B',
          copper:       '#B87333',
          champagne:    '#F7E7CE',
          cream:        '#FFFDF5',
          // Legacy brown compat
          brown:        '#592219',
          'brown-light':'#6d3028',
          'brown-dark': '#3A1000',
        },
        // Legacy primary → mapped to gold scale
        primary: {
          50:  '#FFFDF0',
          100: '#FFF8CC',
          200: '#FFE566',
          300: '#FFD700',
          400: '#F5C800',
          500: '#D4AF37',
          600: '#B8960C',
          700: '#9A7B0A',
          800: '#7A6108',
          900: '#5C4806',
          950: '#3D3004',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        brand:   ['Cinzel', 'Times New Roman', 'serif'],
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-down': {
          '0%':   { opacity: '0', transform: 'translateY(-30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-left': {
          '0%':   { opacity: '0', transform: 'translateX(60px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-right': {
          '0%':   { opacity: '0', transform: 'translateX(-60px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-20px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%':      { transform: 'translateY(-15px) rotate(3deg)' },
        },
        'float-reverse': {
          '0%, 100%': { transform: 'translateY(-10px)' },
          '50%':      { transform: 'translateY(10px)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%':      { opacity: '0.7', transform: 'scale(1.05)' },
        },
        'spin-slow': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'pulsate': {
          '0%':   { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'gold-shimmer': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        'glow-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(212,175,55,0.12), 0 0 40px rgba(212,175,55,0.06)',
          },
          '50%': {
            boxShadow: '0 0 32px rgba(212,175,55,0.28), 0 0 64px rgba(212,175,55,0.14)',
          },
        },
        'liquid': {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%':      { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
        },
        'bar-fill': {
          '0%':   { width: '0%' },
          '100%': { width: 'var(--bar-width)' },
        },
      },
      animation: {
        'fade-up':      'fade-up 0.7s ease-out forwards',
        'fade-down':    'fade-down 0.6s ease-out forwards',
        'fade-in':      'fade-in 0.5s ease-out forwards',
        'slide-left':   'slide-left 0.7s ease-out forwards',
        'slide-right':  'slide-right 0.7s ease-out forwards',
        'scale-in':     'scale-in 0.5s ease-out forwards',
        'float':        'float 6s ease-in-out infinite',
        'float-slow':   'float-slow 8s ease-in-out infinite',
        'float-reverse':'float-reverse 7s ease-in-out infinite',
        'gradient-x':   'gradient-x 8s ease infinite',
        'pulse-glow':   'pulse-glow 4s ease-in-out infinite',
        'spin-slow':    'spin-slow 25s linear infinite',
        'pulsate':      'pulsate 2s infinite',
        'shimmer':      'shimmer 3s linear infinite',
        'gold-shimmer': 'gold-shimmer 5s ease infinite',
        'glow-pulse':   'glow-pulse 3s ease-in-out infinite',
        'liquid':       'liquid 8s ease-in-out infinite',
        'bar-fill':     'bar-fill 0.9s ease-out forwards',
      },
      backdropBlur: {
        xs:   '2px',
        '4xl':'60px',
      },
      boxShadow: {
        'gold':      '0 4px 24px rgba(212,175,55,0.2), inset 0 1px 0 rgba(212,175,55,0.15)',
        'gold-lg':   '0 8px 40px rgba(212,175,55,0.28), inset 0 1px 0 rgba(212,175,55,0.2)',
        'gold-sm':   '0 2px 12px rgba(212,175,55,0.15)',
        'glass':     '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glass-lg':  '0 16px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
        'obsidian':  '0 4px 20px rgba(0,0,0,0.65)',
      },
    },
  },
  plugins: [],
};
