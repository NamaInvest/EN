import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.design-token' });

/**
 * NamaSoft ERP — Unified Design Tokens
 * Source of truth for all colors, spacing, typography, and shadows.
 * Use these in components instead of ad-hoc Tailwind values.
 */

export const tokens = {
  colors: {
    primary:  { 50: '#EFF6FF', 100: '#DBEAFE', 500: '#2563EB', 600: '#1D4ED8', 900: '#1E3A8A' },
    success:  { 50: '#ECFDF5', 500: '#059669', 600: '#047857' },
    danger:   { 50: '#FFF1F2', 500: '#E11D48', 600: '#BE123C' },
    warning:  { 50: '#FFFBEB', 500: '#D97706', 600: '#B45309' },
    info:     { 50: '#EFF6FF', 500: '#0284C7', 600: '#0369A1' },
    purple:   { 50: '#F5F3FF', 500: '#7C3AED', 600: '#6D28D9' },
    neutral: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
      950: '#020617',
    },
  },

  spacing: {
    xs:  '0.25rem',   // 4px
    sm:  '0.5rem',    // 8px
    md:  '1rem',      // 16px
    lg:  '1.5rem',    // 24px
    xl:  '2rem',      // 32px
    '2xl': '3rem',    // 48px
  },

  typography: {
    fontFamily: {
      sans: '"Noto Sans Arabic", system-ui, sans-serif',
    },
    fontSize: {
      xs:   '0.75rem',
      sm:   '0.875rem',
      base: '1rem',
      lg:   '1.125rem',
      xl:   '1.25rem',
      '2xl':'1.5rem',
      '3xl':'1.875rem',
    },
    fontWeight: {
      normal:   400,
      medium:   500,
      semibold: 600,
      bold:     700,
      extrabold:800,
    },
  },

  radii: {
    sm:   '0.375rem',  // rounded-md
    md:   '0.5rem',    // rounded-lg
    lg:   '0.75rem',   // rounded-xl
    xl:   '1rem',      // rounded-2xl
    full: '9999px',    // rounded-full
  },

  shadows: {
    sm:  '0 1px 2px rgba(0,0,0,0.05)',
    md:  '0 4px 6px rgba(0,0,0,0.07)',
    lg:  '0 10px 15px rgba(0,0,0,0.1)',
    xl:  '0 20px 25px rgba(0,0,0,0.1)',
  },

  transitions: {
    fast:   'all 0.15s ease',
    normal: 'all 0.2s ease',
    slow:   'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },

  zIndex: {
    base:    1,
    dropdown: 10,
    sticky:  20,
    fixed:   30,
    modal:   50,
    toast:   100,
  },
} as const;

export type TokenColors = typeof tokens.colors;
export type TokenSpacing = typeof tokens.spacing;
