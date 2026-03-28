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
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        mono: ['var(--font-jetbrains-mono)', 'JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        headline: ['var(--font-space-grotesk)', 'Space Grotesk', 'system-ui', 'sans-serif'],
        body: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        label: ['var(--font-space-grotesk)', 'Space Grotesk', 'system-ui', 'sans-serif'],
        'data-mono': ['var(--font-jetbrains-mono)', 'JetBrains Mono', 'ui-monospace', 'monospace']
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
          DEFAULT: '#ff716c',
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
        // Neural Command design tokens (from Stitch)
        "background": "#0c0e10",
        "surface": "#0c0e10",
        "surface-container-lowest": "#000000",
        "surface-container-low": "#111416",
        "surface-container": "#171a1c",
        "surface-container-high": "#1d2023",
        "surface-container-highest": "#232629",
        "surface-bright": "#292c30",
        "surface-variant": "#232629",
        "surface-dim": "#0c0e10",
        "surface-tint": "#99f7ff",
        "primary": "#99f7ff",
        "primary-dim": "#00e2ee",
        "primary-container": "#00f1fe",
        "primary-fixed": "#00f1fe",
        "primary-fixed-dim": "#00e2ee",
        "on-primary": "#005f64",
        "on-primary-container": "#00555a",
        "on-primary-fixed": "#004145",
        "on-primary-fixed-variant": "#006065",
        "secondary": "#bf81ff",
        "secondary-dim": "#9c42f4",
        "secondary-container": "#7701d0",
        "secondary-fixed": "#e4c6ff",
        "secondary-fixed-dim": "#dab4ff",
        "on-secondary": "#32005c",
        "on-secondary-container": "#f0dcff",
        "on-secondary-fixed": "#4e008a",
        "on-secondary-fixed-variant": "#7500cc",
        "tertiary": "#ffc965",
        "tertiary-dim": "#ecaa00",
        "tertiary-container": "#feb700",
        "tertiary-fixed": "#feb700",
        "tertiary-fixed-dim": "#ecaa00",
        "on-tertiary": "#5f4200",
        "on-tertiary-container": "#533a00",
        "on-tertiary-fixed": "#392700",
        "on-tertiary-fixed-variant": "#5f4200",
        "error-dim": "#d7383b",
        "error-container": "#9f0519",
        "on-error": "#490006",
        "on-error-container": "#ffa8a3",
        "on-surface": "#f0f0f3",
        "on-surface-variant": "#aaabae",
        "on-background": "#f0f0f3",
        "outline": "#747578",
        "outline-variant": "#46484a",
        "inverse-primary": "#006a70",
        "inverse-surface": "#f9f9fc",
        "inverse-on-surface": "#535558",
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
        }
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT:
          '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        focus: '0 0 0 3px rgba(0, 226, 238, 0.22)',
        'focus-visible': '0 0 0 2px rgb(0 226 238 / 0.36)'
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
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }]
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
        '16': '4rem'
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
