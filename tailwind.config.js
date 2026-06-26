/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary — leaf green (logo wreath)
        brand: {
          50:  '#f0f9ec',
          100: '#ddf1d5',
          200: '#bbe3ac',
          300: '#8ecf78',
          400: '#64b74d',
          500: '#489a30',
          600: '#357c22',
          700: '#2a621c',
          800: '#234e1a',
          900: '#1c4117',
          950: '#0d2409',
        },
        // Accent — warm orange (logo flower center)
        warm: {
          50:  '#fff8ed',
          100: '#ffefd0',
          200: '#ffdba0',
          300: '#ffc060',
          400: '#ffa030',
          500: '#f07c20',
          600: '#de5f0e',
          700: '#b8480c',
          800: '#933b10',
          900: '#783210',
          950: '#421506',
        },
        dark: {
          900: '#0c100b',
          800: '#111710',
          700: '#192116',
          600: '#22301e',
          500: '#2e4028',
          400: '#3d5435',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

