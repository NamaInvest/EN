'use client';

import React from 'react';
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';

// ─── EmptyState ────────────────────────────────────────────────────────────────
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export const EmptyState = ({
  icon = <Inbox className="w-12 h-12" style={{ color: 'var(--text-muted)' }} />,
  title = 'لا توجد بيانات',
  description = 'لم يتم العثور على نتائج تطابق المعايير المحددة.',
  action,
}: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 text-center" role="status">
    <div className="mb-4 p-4 rounded-2xl" style={{ background: 'var(--bg-card-hover)' }}>
      {icon}
    </div>
    <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>{title}</h3>
    <p className="text-sm max-w-xs" style={{ color: 'var(--text-muted)' }}>{description}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="mt-4 btn btn-primary text-sm"
      >
        {action.label}
      </button>
    )}
  </div>
);

// ─── ErrorState ────────────────────────────────────────────────────────────────
export interface ErrorStateProps {
  error?: { message: string } | string;
  onRetry?: () => void;
}

export const ErrorState = ({ error, onRetry }: ErrorStateProps) => {
  const message = typeof error === 'string' ? error : error?.message ?? 'حدث خطأ غير متوقع';
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center" role="alert">
      <div className="mb-4 p-4 rounded-2xl" style={{ background: 'rgba(225,29,72,0.08)' }}>
        <AlertCircle className="w-12 h-12" style={{ color: 'var(--danger)' }} />
      </div>
      <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>حدث خطأ</h3>
      <p className="text-sm max-w-xs" style={{ color: 'var(--text-muted)' }}>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 btn btn-ghost text-sm">
          إعادة المحاولة
        </button>
      )}
    </div>
  );
};

// ─── LoadingState ──────────────────────────────────────────────────────────────
export const LoadingState = ({ message = 'جاري التحميل...' }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center" role="status" aria-live="polite">
    <Loader2 className="w-10 h-10 animate-spin mb-4" style={{ color: 'var(--primary)' }} />
    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{message}</p>
  </div>
);
