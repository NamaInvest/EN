import React from 'react';

// ─── TableSkeleton ─────────────────────────────────────────────────────────────
export const TableSkeleton = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => (
  <div className="space-y-0 overflow-hidden rounded-md border border-gray-200 dark:border-gray-800">
    {/* Header */}
    <div className="flex gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded flex-1" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 px-4 py-4 border-b last:border-0 border-gray-100 dark:border-gray-800/50">
        {Array.from({ length: cols }).map((_, j) => (
          <div
            key={j}
            className="h-4 bg-gray-100 dark:bg-gray-800 animate-pulse rounded flex-1"
            style={{ animationDelay: `${(i * cols + j) * 50}ms` }}
          />
        ))}
      </div>
    ))}
  </div>
);

// ─── CardSkeleton ─────────────────────────────────────────────────────────────
export const CardSkeleton = () => (
  <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 space-y-3">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-800 animate-pulse rounded w-1/3" />
        <div className="h-5 bg-gray-200 dark:bg-gray-800 animate-pulse rounded w-1/2" />
      </div>
    </div>
  </div>
);

// ─── KpiCardSkeleton ──────────────────────────────────────────────────────────
export const KpiCardSkeleton = () => (
  <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900 space-y-4 animate-pulse">
    <div className="flex justify-between">
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
      <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded-lg" />
    </div>
    <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
    <div className="h-3 bg-gray-100 dark:bg-gray-800/50 rounded w-1/2" />
  </div>
);

// ─── PageSkeleton ─────────────────────────────────────────────────────────────
export const PageSkeleton = () => (
  <div className="p-6 space-y-6 animate-pulse">
    {/* Header */}
    <div className="flex justify-between items-center">
      <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
      <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-28" />
    </div>
    {/* KPI Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <KpiCardSkeleton key={i} />
      ))}
    </div>
    {/* Table */}
    <TableSkeleton rows={8} cols={5} />
  </div>
);

// ─── FormSkeleton ─────────────────────────────────────────────────────────────
export const FormSkeleton = ({ fields = 4 }: { fields?: number }) => (
  <div className="space-y-4 animate-pulse">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-1.5">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
        <div className="h-10 bg-gray-100 dark:bg-gray-800/50 rounded-md border border-gray-200 dark:border-gray-700" />
      </div>
    ))}
    <div className="flex justify-end gap-2 pt-2">
      <div className="h-10 w-24 bg-gray-200 dark:bg-gray-800 rounded-md" />
      <div className="h-10 w-24 bg-blue-200 dark:bg-blue-900/50 rounded-md" />
    </div>
  </div>
);
