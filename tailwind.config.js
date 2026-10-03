/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#060a16', 900: '#0a1020', 800: '#101a33', 700: '#1a2748' },
        brand: { DEFAULT: '#5b7cff', soft: '#8aa2ff', violet: '#8b5cf6' },
      },
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        rise: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'none' } },
        fade: { from: { opacity: 0 }, to: { opacity: 1 } },
        bar: { '0%,100%': { transform: 'scaleY(.35)' }, '50%': { transform: 'scaleY(1)' } },
      },
      animation: { rise: 'rise .5s ease-out both', fade: 'fade .4s ease-out both', bar: 'bar 1.2s ease-in-out infinite' },
    },
  },
  plugins: [],
};
