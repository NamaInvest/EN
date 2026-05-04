import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    let variantStyles = 'bg-blue-600 text-white hover:bg-blue-700';
    if (variant === 'outline') variantStyles = 'border border-slate-200 bg-transparent hover:bg-slate-100 text-slate-900 dark:border-slate-800 dark:text-slate-100 dark:hover:bg-slate-800';
    if (variant === 'ghost') variantStyles = 'bg-transparent hover:bg-slate-100 text-slate-900 dark:text-slate-100 dark:hover:bg-slate-800';
    if (variant === 'destructive') variantStyles = 'bg-red-600 text-white hover:bg-red-700';

    let sizeStyles = 'h-10 px-4 py-2';
    if (size === 'sm') sizeStyles = 'h-9 px-3 text-xs';
    if (size === 'lg') sizeStyles = 'h-11 px-8';
    if (size === 'icon') sizeStyles = 'h-10 w-10';

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50 disabled:pointer-events-none ${variantStyles} ${sizeStyles} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
