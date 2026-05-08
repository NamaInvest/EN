'use client';

/**
 * Unified UI State Components
 * ──────────────────────────────────────────────────────────
 * Standardized Loading, Empty, and Error states across all pages.
 * Ensures consistent UX and reduces duplicate code.
 */

import React from 'react';

// ── Loading State ──
export function LoadingState({ message = 'جاري التحميل...' }: { message?: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '4rem 2rem', minHeight: '300px', gap: '1rem',
    }}>
      <div style={{
        width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTop: '4px solid #6366f1',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>{message}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Empty State ──
export function EmptyState({
  icon = '📋',
  title = 'لا توجد بيانات',
  description = 'لم يتم العثور على نتائج. جرّب تغيير معايير البحث.',
  action,
}: {
  icon?: string;
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '4rem 2rem', minHeight: '300px', gap: '0.75rem', textAlign: 'center',
    }}>
      <span style={{ fontSize: '3rem' }}>{icon}</span>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>{title}</h3>
      <p style={{ color: '#6b7280', fontSize: '0.9rem', maxWidth: '400px', margin: 0 }}>{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: '0.5rem', padding: '0.5rem 1.5rem', background: '#6366f1', color: 'white',
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500,
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// ── Error State ──
export function ErrorState({
  title = 'حدث خطأ',
  message = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
  onRetry,
  code,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  code?: string | number;
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '4rem 2rem', minHeight: '300px', gap: '0.75rem', textAlign: 'center',
    }}>
      <div style={{
        width: '64px', height: '64px', borderRadius: '50%', background: '#fef2f2',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
      }}>⚠️</div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#dc2626', margin: 0 }}>{title}</h3>
      <p style={{ color: '#6b7280', fontSize: '0.9rem', maxWidth: '400px', margin: 0 }}>{message}</p>
      {code && <code style={{ fontSize: '0.8rem', color: '#9ca3af', background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>Error: {code}</code>}
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: '0.5rem', padding: '0.5rem 1.5rem', background: '#ef4444', color: 'white',
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500,
          }}
        >
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}

// ── Permission Denied ──
export function PermissionDenied({ requiredRole }: { requiredRole?: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '4rem 2rem', minHeight: '300px', gap: '0.75rem', textAlign: 'center',
    }}>
      <span style={{ fontSize: '3rem' }}>🔒</span>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>غير مصرّح</h3>
      <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
        ليس لديك صلاحية للوصول لهذه الصفحة.
        {requiredRole && ` الدور المطلوب: ${requiredRole}`}
      </p>
    </div>
  );
}

// ── Skeleton Loader ──
export function SkeletonRow({ columns = 5 }: { columns?: number }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '0.75rem 1rem', animation: 'pulse 1.5s ease-in-out infinite' }}>
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} style={{
          flex: i === 0 ? 2 : 1, height: '16px', background: '#e5e7eb', borderRadius: '4px',
        }} />
      ))}
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} columns={columns} />
      ))}
    </div>
  );
}
