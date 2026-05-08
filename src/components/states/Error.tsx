import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface ErrorStateProps {
  error: { message: string };
  onRetry?: () => void;
}

export const ErrorState = ({ error, onRetry }: ErrorStateProps) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <AlertCircle className="w-12 h-12 text-red-500" />
    <h3 className="mt-4 text-sm font-semibold">حدث خطأ</h3>
    <p className="mt-2 text-sm text-gray-500 max-w-sm">{error.message}</p>
    {onRetry && (
      <button onClick={onRetry} className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors">
        إعادة المحاولة
      </button>
    )}
  </div>
);
