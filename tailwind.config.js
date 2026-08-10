/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        noir: {
          950: '#050507',
          900: '#09090d',
          850: '#0d0e14',
          800: '#12141c',
          750: '#171a24',
          700: '#1d2130',
        },
        case: {
          gold: '#f2c14e',
          amber: '#c68c28',
          cream: '#fff6dc',
          muted: '#a6a7b2',
          dim: '#6e707e',
          red: '#ef5d68',
          green: '#66d6a0',
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 24px 80px rgba(0,0,0,.38)',
        gold: '0 16px 60px rgba(242,193,78,.16)',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
