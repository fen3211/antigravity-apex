/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        xs: '480px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1440px',
      },
      colors: {
        paper: 'rgb(var(--color-paper) / <alpha-value>)',
        pure: 'rgb(var(--color-pure) / <alpha-value>)',
        surface: {
          subtle: 'rgb(var(--color-surface-subtle) / <alpha-value>)',
          hover: 'rgb(var(--color-surface-hover) / <alpha-value>)',
          active: 'rgb(var(--color-surface-active) / <alpha-value>)',
        },
        obsidian: 'rgb(var(--color-obsidian) / <alpha-value>)',
        charcoal: 'rgb(var(--color-charcoal) / <alpha-value>)',
        stone: 'rgb(var(--color-stone) / <alpha-value>)',
        slate: 'rgb(var(--color-slate) / <alpha-value>)',
        graphite: 'rgb(var(--color-graphite) / <alpha-value>)',
        smoke: 'rgb(var(--color-smoke) / <alpha-value>)',
        ash: 'rgb(var(--color-ash) / <alpha-value>)',
        hairline: 'rgb(var(--color-hairline) / <alpha-value>)',
        // Refero status tokens
        terminal: {
          green: 'rgb(var(--color-terminal-green) / <alpha-value>)',
          bg: 'rgb(var(--color-terminal-bg) / <alpha-value>)',
          border: 'rgb(var(--color-terminal-border) / <alpha-value>)',
        },
        warning: {
          text: 'rgb(var(--color-warning-text) / <alpha-value>)',
          bg: 'rgb(var(--color-warning-bg) / <alpha-value>)',
          border: 'rgb(var(--color-warning-border) / <alpha-value>)',
        },
        danger: {
          text: 'rgb(var(--color-danger-text) / <alpha-value>)',
          bg: 'rgb(var(--color-danger-bg) / <alpha-value>)',
          border: 'rgb(var(--color-danger-border) / <alpha-value>)',
        },
        info: {
          text: 'rgb(var(--color-info-text) / <alpha-value>)',
          bg: 'rgb(var(--color-info-bg) / <alpha-value>)',
          border: 'rgb(var(--color-info-border) / <alpha-value>)',
        },
        argon: {
          text: 'rgb(var(--color-argon-text) / <alpha-value>)',
          bg: 'rgb(var(--color-argon-bg) / <alpha-value>)',
          border: 'rgb(var(--color-argon-border) / <alpha-value>)',
        }
      },
      borderRadius: {
        'xs': '4px',
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'dropdown': '0 4px 12px 0 rgba(0, 0, 0, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'modal': '0 12px 32px 0 rgba(0, 0, 0, 0.12), 0 2px 6px 0 rgba(0, 0, 0, 0.06)',
      },
      fontFamily: {
        sans: ['Geist', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(3px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
