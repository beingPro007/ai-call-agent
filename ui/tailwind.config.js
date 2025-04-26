/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary': {
          50: '#eef4ff',
          100: '#d9e5ff',
          200: '#bcd2ff',
          300: '#91b5fe',
          400: '#608dfc',
          500: '#3b64f6',
          600: '#2549eb',
          700: '#1d38d8',
          800: '#1e32af',
          900: '#1e328a',
          950: '#172054',
        },
        'secondary': {
          50: '#f3f0ff',
          100: '#e9e4ff',
          200: '#d6ccff',
          300: '#baa6ff',
          400: '#9c75ff',
          500: '#8446fe',
          600: '#792ef5',
          700: '#6822dd',
          800: '#581db8',
          900: '#481b96',
          950: '#2c0f68',
        },
        'accent': {
          50: '#edfcf7',
          100: '#d3f8e9',
          200: '#aaf0d8',
          300: '#74e3c1',
          400: '#41cfa8',
          500: '#20b590',
          600: '#139076',
          700: '#117363',
          800: '#125b51',
          900: '#134b43',
          950: '#042a26',
        },
        'neutral': {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'shine': 'shine 2.5s linear infinite',
        'gradient': 'gradient 8s linear infinite',
        'appear': 'appear 1s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        shine: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        appear: {
          '0%': { opacity: 0, transform: 'scale(0.98)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-subtle': 'linear-gradient(to right, #f8fafc, #f1f5f9, #f8fafc)',
        'gradient-shine': 'linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent)'
      },
      boxShadow: {
        'modern': '0 10px 30px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
        'modern-lg': '0 20px 40px -5px rgba(0, 0, 0, 0.05), 0 10px 15px -5px rgba(0, 0, 0, 0.02)',
        'premium': '0 20px 50px -12px rgba(0, 0, 0, 0.1), 0 10px 24px -8px rgba(0, 0, 0, 0.06)',
        'inner-glow': 'inset 0 2px 20px 0 rgba(255, 255, 255, 0.3)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
    },
  },
  plugins: [],
}; 