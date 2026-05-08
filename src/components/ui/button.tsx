import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', loading = false, disabled, children, ...props }, ref) => {
    // Variant styles — maintain original Ocean Glass design
    let variantStyles = 'bg-blue-600 text-white hover:bg-blue-700';
    if (variant === 'outline')     variantStyles = 'border border-slate-200 bg-transparent hover:bg-slate-100 text-slate-900 dark:border-slate-800 dark:text-slate-100 dark:hover:bg-slate-800';
    if (variant === 'ghost')       variantStyles = 'bg-transparent hover:bg-slate-100 text-slate-900 dark:text-slate-100 dark:hover:bg-slate-800';
    if (variant === 'destructive') variantStyles = 'bg-red-600 text-white hover:bg-red-700';
    if (variant === 'primary')     variantStyles = 'bg-blue-600 text-white hover:bg-blue-700';
    if (variant === 'secondary')   variantStyles = 'border border-slate-200 bg-transparent hover:bg-slate-100 text-slate-900 dark:border-slate-800 dark:text-slate-100 dark:hover:bg-slate-800';
    if (variant === 'danger')      variantStyles = 'bg-red-600 text-white hover:bg-red-700';
    if (variant === 'success')     variantStyles = 'bg-emerald-600 text-white hover:bg-emerald-700';

    let sizeStyles = 'h-10 px-4 py-2';
    if (size === 'sm')   sizeStyles = 'h-9 px-3 text-xs';
    if (size === 'lg')   sizeStyles = 'h-11 px-8';
    if (size === 'icon') sizeStyles = 'h-10 w-10';

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50 disabled:pointer-events-none ${variantStyles} ${sizeStyles} ${className}`}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
