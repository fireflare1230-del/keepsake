/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Keepsake brand palette — matches BRAND spec exactly
        cream:     '#FAF6F0',
        navy:      '#1A2332',
        brand:     '#5E93AC',
        primary:   '#E8A04C',  // amber — main CTA buttons
        secondary: '#8FB39A',  // sage
        success:   '#6B9F71',  // moss
        danger:    '#C56A53',  // rust / alerts
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        chat: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      minHeight: {
        btn: '48px',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
}
