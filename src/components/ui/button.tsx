'use client';

import React from 'react';
import { tokens } from '@/lib/design-tokens';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'destructive' | 'ghost' | 'outline' | 'success' | 'default';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  icon?: React.ReactNode;
  ariaLabel?: string;
}

const variantMap: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:     'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md',
  default:     'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md',  // alias for primary
  secondary:   'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700',
  danger:      'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',                   // alias for danger
  success:     'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
  ghost:       'bg-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
  outline:     'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800',
};

const sizeMap: Record<NonNullable<ButtonProps['size']>, string> = {
  sm:   'h-8 px-3 text-xs gap-1.5',
  md:   'h-10 px-4 text-sm gap-2',
  lg:   'h-12 px-6 text-base gap-2',
  icon: 'h-10 w-10 p-0',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', loading = false, icon, ariaLabel, children, disabled, ...props }, ref) => {
    const variantClass = variantMap[variant];
    const sizeClass = sizeMap[size];

    return (
      <button
        ref={ref}
        aria-label={ariaLabel ?? (typeof children === 'string' ? children : undefined)}
        aria-busy={loading ? 'true' : undefined}
        disabled={disabled || loading}
        className={[
          'inline-flex items-center justify-center rounded-md font-medium transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-[0.98]',
          variantClass,
          sizeClass,
          className,
        ].join(' ')}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        ) : icon ? (
          <span aria-hidden="true">{icon}</span>
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
