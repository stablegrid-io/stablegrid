import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans-editorial)', 'Inter Tight', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif-editorial)', 'Source Serif 4', 'Source Serif Pro', 'Georgia', 'serif'],
        mono: ['var(--font-jetbrains-mono)', 'JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        headline: ['var(--font-serif-editorial)', 'Source Serif 4', 'Source Serif Pro', 'Georgia', 'serif'],
        body: ['var(--font-serif-editorial)', 'Source Serif 4', 'Source Serif Pro', 'Georgia', 'serif'],
        label: ['var(--font-sans-editorial)', 'Inter Tight', 'Inter', 'system-ui', 'sans-serif'],
        'data-mono': ['var(--font-jetbrains-mono)', 'JetBrains Mono', 'ui-monospace', 'monospace'],
        // Editorial Engineering — semantic font roles.
        h1: ['var(--font-serif-editorial)', 'Source Serif 4', 'Source Serif Pro', 'Georgia', 'serif'],
        h2: ['var(--font-serif-editorial)', 'Source Serif 4', 'Source Serif Pro', 'Georgia', 'serif'],
        'body-lg': ['var(--font-serif-editorial)', 'Source Serif 4', 'Source Serif Pro', 'Georgia', 'serif'],
        'ui-label': ['var(--font-sans-editorial)', 'Inter Tight', 'Inter', 'system-ui', 'sans-serif'],
        editorial: ['var(--font-serif-editorial)', 'Source Serif 4', 'Source Serif Pro', 'Georgia', 'serif'],
        'editorial-sans': ['var(--font-sans-editorial)', 'Inter Tight', 'Inter', 'system-ui', 'sans-serif'],
        'editorial-mono': ['var(--font-mono-editorial)', 'IBM Plex Mono', 'ui-monospace', 'monospace']
      },
      colors: {
        brand: {
          50: '#e6feff',
          100: '#b3fcff',
          200: '#80f9ff',
          300: '#4df7ff',
          400: '#1af4ff',
          500: '#00e2ee',
          600: '#006a70',
          700: '#005f64',
          800: '#004145',
          900: '#002022'
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d'
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f'
        },
        error: {
          DEFAULT: '#ffb4ab',
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d'
        },
        // Editorial Engineering design tokens — DARK canvas (warm near-black ink)
        // with cream-toned text and a vibrant Spark accent. Per DESIGN.md spec.
        // The light palette lives under `editorial-light.*` for any component
        // that still needs to opt into the legacy cream paper look.
        "background": "#14140f",
        "surface": "#14140f",
        "surface-container-lowest": "#0f0e0a",
        "surface-container-low": "#1c1c16",
        "surface-container": "#20201a",
        "surface-container-high": "#2b2a24",
        "surface-container-highest": "#36352f",
        "surface-bright": "#3a3933",
        "surface-variant": "#36352f",
        "surface-dim": "#2b2a24",
        "surface-tint": "#ffb59a",
        "primary": "#ffb59a",
        "primary-dim": "#f16527",
        "primary-container": "#f16527",
        "primary-fixed": "#ffdbce",
        "primary-fixed-dim": "#ffb59a",
        "on-primary": "#5a1b00",
        "on-primary-container": "#4f1700",
        "on-primary-fixed": "#370d00",
        "on-primary-fixed-variant": "#802a00",
        "secondary": "#c9c6c2",
        "secondary-dim": "#a8a59f",
        "secondary-container": "#474744",
        "secondary-fixed": "#e5e2de",
        "secondary-fixed-dim": "#c9c6c2",
        "on-secondary": "#31302e",
        "on-secondary-container": "#b7b5b1",
        "on-secondary-fixed": "#1c1c19",
        "on-secondary-fixed-variant": "#474744",
        "tertiary": "#c9c6c0",
        "tertiary-dim": "#a8a59f",
        "tertiary-container": "#93908b",
        "tertiary-fixed": "#e6e2dc",
        "tertiary-fixed-dim": "#c9c6c0",
        "on-tertiary": "#31302d",
        "on-tertiary-container": "#2a2a26",
        "on-tertiary-fixed": "#1c1c18",
        "on-tertiary-fixed-variant": "#484742",
        "error-dim": "#93000a",
        "error-container": "#93000a",
        "on-error": "#690005",
        "on-error-container": "#ffdad6",
        "on-surface": "#e6e2d9",
        "on-surface-variant": "#e1bfb4",
        "on-background": "#e6e2d9",
        "outline": "#a88a80",
        "outline-variant": "#594139",
        "inverse-primary": "#a83a00",
        "inverse-surface": "#e6e2d9",
        "inverse-on-surface": "#31302b",
        // Spark — vibrant orange reserved for CTAs, progress, active states.
        "spark": "#e25a1c",
        "spark-dim": "#c44a10",
        light: {
          bg: '#f9f9fc',
          surface: '#eaecef',
          border: '#c4c6c9',
          hover: '#e4e6e9',
          active: '#dfe1e4',
          muted: '#f0f2f5'
        },
        dark: {
          bg: '#0c1014',
          surface: '#141a1e',
          border: '#2a2e32',
          hover: '#1a2024',
          active: '#222628',
          muted: '#101418'
        },
        text: {
          'light-primary': '#1a1c1e',
          'light-secondary': '#44474a',
          'light-tertiary': '#747779',
          'light-disabled': '#c4c6c9',
          'dark-primary': '#f0f0f3',
          'dark-secondary': '#8a8b8e',
          'dark-tertiary': '#5a5c5f',
          'dark-disabled': '#343638'
        },
        // stablegrid forest-green palette (landing page)
        'grid-ink': '#070c0a',
        'grid-panel': '#0f1712',
        'grid-panel-raised': '#1a2a22',
        'grid-border': '#1f3629',
        'grid-border-dim': '#122824',
        'grid-text': '#9ab8a9',
        'grid-text-dim': '#6f8f7d',
        'grid-glow': '#22b999',
        'grid-glow-bright': '#3ed3b2',
        // Editorial / data-tech palette — Newsprint (light default) + Terminal (dark).
        // Used by `components/editorial/*` and pages migrating to the new identity.
        // DARK editorial — "ink" is now the LIGHT cream text on dark paper.
        // Legacy light variants kept as `ink-dark.*` / `paper-light.*`.
        ink: {
          DEFAULT: '#E8E4D6',     // body text, headlines, hairlines (cream on dark)
          2: '#C9C2B0',           // secondary text
          3: '#A8A59F',           // tertiary, captions
          inverse: '#0E0E0C',     // ink on light fallback panels
          light: '#0E0E0C'        // legacy alias for components stuck on light
        },
        paper: {
          DEFAULT: '#14140F',     // warm near-black page background
          2: '#1C1C16',           // section bands, table zebra
          dark: '#0B0C0A',        // deepest panel
          'dark-2': '#0F0E0A',    // surface-container-lowest
          light: '#F5F1E8',       // legacy cream for opt-in components
          'light-2': '#EDE7D8'    // legacy cream band
        },
        rule: {
          DEFAULT: '#594139',     // 1px hairlines (outline-variant on dark)
          soft: '#2A2A24',        // secondary dividers
          'soft-dark': '#36352F', // even softer rule
          light: '#1A1A18'        // legacy ink rule
        },
        vermillion: {
          DEFAULT: '#E25A1C',     // Spark accent — vibrant orange CTA
          ink: '#C44A10',          // hover, press state
          dark: '#FFB59A',         // light salmon for buttons-on-dark surfaces
          light: '#C8442A'         // legacy vermillion
        },
        'mute-blue': '#2E4A6B',   // code keywords, data series A
        'mute-olive': '#6B6A2E'   // data series B, "stable" kicker
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT:
          '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        focus: '0 0 0 3px rgba(226, 90, 28, 0.32)',
        'focus-visible': '0 0 0 2px rgb(226 90 28 / 0.46)'
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        spinner: 'spin 1s linear infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        // Editorial Engineering — semantic type scale.
        h1: ['42px', { lineHeight: '1.2', fontWeight: '700' }],
        h2: ['30px', { lineHeight: '1.3', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'ui-label': ['14px', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.02em' }],
        'data-mono': ['14px', { lineHeight: '1.5', fontWeight: '400' }]
      },
      spacing: {
        '0.5': '0.125rem',
        '1': '0.25rem',
        '1.5': '0.375rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '5': '1.25rem',
        '6': '1.5rem',
        '8': '2rem',
        '10': '2.5rem',
        '12': '3rem',
        '16': '4rem',
        // Editorial Engineering — Cell-based grid metrics.
        'cell-size': '32px',
        'cell-gap': '8px',
        'margin-page': '48px',
        gutter: '1px'
      },
      borderRadius: {
        none: '0',
        sm: '0px',
        DEFAULT: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        '3xl': '0px',
        full: '9999px'
      }
    }
  },
  plugins: []
};

export default config;
