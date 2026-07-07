import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Driven by CSS variables set at runtime from admin theme settings
        // (see src/lib/theme.ts) — defaults live in src/index.css.
        brand: {
          50: 'var(--brand-50)',
          100: 'var(--brand-100)',
          200: 'var(--brand-200)',
          300: 'var(--brand-300)',
          400: 'var(--brand-400)',
          500: 'var(--brand-500)',
          600: 'var(--brand-600)',
          700: 'var(--brand-700)',
          800: 'var(--brand-800)',
          900: 'var(--brand-900)',
        },
      },
      fontFamily: {
        theme: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.6)' },
          '60%': { opacity: '1', transform: 'scale(1.08)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        ringPulse: {
          '0%': { boxShadow: '0 0 0 0 var(--brand-200)' },
          '100%': { boxShadow: '0 0 0 10px transparent' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        checkDraw: {
          '0%': { strokeDashoffset: '48' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fadeIn 0.4s ease-out both',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in-right': 'slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in-left': 'slideInLeft 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        'pop-in': 'popIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
        'ring-pulse': 'ringPulse 1.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
