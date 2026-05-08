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
  icon = <Inbox className="w-12 h-12 text-gray-400 dark:text-gray-600" />,
  title = 'لا توجد بيانات',
  description = 'لم يتم العثور على نتائج تطابق المعايير المحددة.',
  action,
}: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 text-center" role="status">
    <div className="mb-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
      {icon}
    </div>
    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">{description}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
      <div className="mb-4 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20">
        <AlertCircle className="w-12 h-12 text-red-500" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">حدث خطأ</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
        >
          إعادة المحاولة
        </button>
      )}
    </div>
  );
};

// ─── LoadingState ──────────────────────────────────────────────────────────────
export const LoadingState = ({ message = 'جاري التحميل...' }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center" role="status" aria-live="polite">
    <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
    <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
  </div>
);
