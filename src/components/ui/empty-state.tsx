import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: LucideIcon;
  illustration?: string;
  variant?: 'no-data' | 'no-results' | 'error' | 'success';
  cta?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  title,
  message,
  icon: Icon,
  illustration,
  variant = 'no-data',
  cta,
  className,
}: EmptyStateProps) {
  // Map variant to some default styles or colors if needed
  const variantStyles = {
    'no-data': 'text-muted-foreground',
    'no-results': 'text-muted-foreground',
    'error': 'text-destructive',
    'success': 'text-green-600',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500',
        className
      )}
      dir="rtl"
    >
      {illustration ? (
        <img
          src={illustration}
          alt={title}
          className="w-48 h-48 mb-6 object-contain opacity-90 transition-transform hover:scale-105"
        />
      ) : Icon ? (
        <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-6">
          <Icon className={cn('w-10 h-10', variantStyles[variant])} />
        </div>
      ) : null}

      <h3 className="text-xl font-bold tracking-tight mb-2 text-foreground">
        {title}
      </h3>

      {message && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
          {message}
        </p>
      )}

      {cta && (
        <Button onClick={cta.onClick} variant="default" className="min-w-[120px]">
          {cta.label}
        </Button>
      )}
    </div>
  );
}
