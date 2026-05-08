import React from 'react';

// ─── TableSkeleton ─────────────────────────────────────────────────────────────
export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-2 w-full">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-12 bg-[var(--bg-card-hover)] animate-pulse rounded w-full" />
    ))}
  </div>
);

// ─── CardSkeleton ─────────────────────────────────────────────────────────────
export const CardSkeleton = () => (
  <div className="space-y-3 p-4 border border-[var(--border)] rounded-lg w-full bg-[var(--bg-card)]">
    <div className="h-4 bg-[var(--bg-card-hover)] animate-pulse rounded w-1/3" />
    <div className="h-8 bg-[var(--bg-card-hover)] animate-pulse rounded w-1/2" />
  </div>
);

// ─── KpiCardSkeleton ──────────────────────────────────────────────────────────
export const KpiCardSkeleton = () => (
  <div className="p-6 border border-[var(--border)] rounded-2xl bg-[var(--bg-card)] space-y-4 animate-pulse">
    <div className="flex justify-between">
      <div className="h-4 bg-[var(--bg-card-hover)] rounded w-1/3" />
      <div className="h-8 w-8 bg-[var(--bg-card-hover)] rounded-lg" />
    </div>
    <div className="h-8 bg-[var(--bg-card-hover)] rounded w-2/3" />
    <div className="h-3 bg-[var(--bg-card-hover)] rounded w-1/2 opacity-50" />
  </div>
);

// ─── PageSkeleton ─────────────────────────────────────────────────────────────
export const PageSkeleton = () => (
  <div className="p-6 space-y-6 animate-pulse">
    <div className="flex justify-between items-center">
      <div className="h-8 bg-[var(--bg-card-hover)] rounded w-1/4" />
      <div className="h-10 bg-[var(--bg-card-hover)] rounded w-28" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <KpiCardSkeleton key={i} />
      ))}
    </div>
    <TableSkeleton rows={8} />
  </div>
);

// ─── FormSkeleton ─────────────────────────────────────────────────────────────
export const FormSkeleton = ({ fields = 4 }: { fields?: number }) => (
  <div className="space-y-4 animate-pulse">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-1.5">
        <div className="h-4 bg-[var(--bg-card-hover)] rounded w-1/4" />
        <div className="h-10 bg-[var(--bg-card-hover)] opacity-60 rounded-md border border-[var(--border)]" />
      </div>
    ))}
    <div className="flex justify-end gap-2 pt-2">
      <div className="h-10 w-24 bg-[var(--bg-card-hover)] rounded-md" />
      <div className="h-10 w-24 bg-[var(--primary)] opacity-40 rounded-md" />
    </div>
  </div>
);
