/**
 * Keepsake brand tokens (PRD §10.2 / NFR-9).
 *
 * The palette is warm and low-stimulation on purpose: no pure white,
 * no harsh saturation. Every text/background pair used in the app
 * meets WCAG 2.1 AA contrast (>= 4.5:1) — see src/styles/index.css.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Core surfaces & text
        cream: {
          DEFAULT: '#FAF6F0', // app background (never pure white)
          soft: '#F3EDE3',    // cards on cream
          deep: '#EAE1D3',    // borders, wells
        },
        ink: {
          DEFAULT: '#1A2332', // primary text
          soft: '#44506233',  // (rare) translucent ink
          muted: '#4A576B',   // secondary text — 7.2:1 on cream
          faint: '#5D6A7E',   // tertiary text — 5.4:1 on cream
        },
        // Brand accent (dusty blue) — headers, links, Lane
        brand: {
          DEFAULT: '#5E93AC',
          deep: '#3E6E86',    // 4.6:1 on cream — safe for text
          deeper: '#2E5468',  // 7:1 on cream
          wash: '#E7F0F4',    // tinted background
        },
        // Primary action (amber)
        amber: {
          DEFAULT: '#E8A04C',
          deep: '#8A5A1D',    // amber-family text that passes AA on cream
          wash: '#FBEFDD',
        },
        // Secondary action (sage)
        sage: {
          DEFAULT: '#8FB39A',
          deep: '#3F6B4F',    // 5.6:1 on cream
          wash: '#EAF2EC',
        },
        // Success (moss)
        moss: {
          DEFAULT: '#6B9F71',
          deep: '#3D6B44',
          wash: '#E9F2EA',
        },
        // Gentle alerts (rust)
        rust: {
          DEFAULT: '#C56A53',
          deep: '#9A4531',    // 5.5:1 on cream
          wash: '#F7E8E3',
        },
      },
      fontFamily: {
        sans: [
          'Atkinson Hyperlegible',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        display: ['Fraunces', 'Georgia', 'Times New Roman', 'serif'],
      },
      fontWeight: {
        // Atkinson Hyperlegible ships 400/700 only; snap semibold to 700
        // so nothing renders as faux-bold.
        semibold: '700',
      },
      fontSize: {
        // Elderly-friendly scale (NFR-1): body starts at 18px.
        base: ['1.125rem', { lineHeight: '1.7' }],   // 18px
        lg: ['1.25rem', { lineHeight: '1.65' }],     // 20px
        xl: ['1.375rem', { lineHeight: '1.5' }],     // 22px
        '2xl': ['1.625rem', { lineHeight: '1.4' }],  // 26px
        '3xl': ['1.875rem', { lineHeight: '1.3' }],  // 30px
        '4xl': ['2.375rem', { lineHeight: '1.2' }],  // 38px
        '5xl': ['3rem', { lineHeight: '1.12' }],     // 48px
      },
      borderRadius: {
        DEFAULT: '12px', // PRD: rounded 12px corners
        lg: '16px',
        xl: '20px',
        '2xl': '28px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(26, 35, 50, 0.06), 0 4px 16px rgba(26, 35, 50, 0.05)',
        lift: '0 2px 6px rgba(26, 35, 50, 0.08), 0 10px 28px rgba(26, 35, 50, 0.09)',
        press: 'inset 0 2px 4px rgba(26, 35, 50, 0.08)',
      },
      maxWidth: {
        visit: '44rem', // the calm single-column width of the check-in flow
      },
    },
  },
  plugins: [],
}
