'use client';

/**
 * Unified UI State Components — P4.6 (Upgraded)
 * ─────────────────────────────────────────────────────────────────────────────
 * Production-grade Loading, Empty, Error, Skeleton, and NetworkError states.
 * Includes useAsyncData hook for automatic state management.
 *
 * Usage:
 *   <DataStateWrapper loading={isLoading} error={error} empty={!data.length} emptyIcon="📦">
 *     <YourTable data={data} />
 *   </DataStateWrapper>
 *
 *   const { data, loading, error, refetch } = useAsyncData(() => fetch('/api/sales').then(r => r.json()));
 */

import React, { useState, useEffect, useCallback, ReactNode } from 'react';

// ── Keyframes (injected once) ─────────────────────────────────────────────────
const STYLES = `
  @keyframes nama-spin  { to { transform: rotate(360deg); } }
  @keyframes nama-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  @keyframes nama-fade  { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
`;

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.textContent = STYLES;
  document.head.appendChild(el);
  stylesInjected = true;
}

// ── LoadingState ──────────────────────────────────────────────────────────────
export function LoadingState({
  message = 'جاري التحميل...',
  size = 'md',
  overlay = false,
}: {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  overlay?: boolean;
}) {
  injectStyles();
  const spinnerSize = size === 'sm' ? 28 : size === 'lg' ? 64 : 48;
  const borderWidth = size === 'sm' ? '3px' : '4px';

  const inner = (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: '0.875rem', animation: 'nama-fade 0.3s ease',
    }}>
      <div style={{
        width: spinnerSize, height: spinnerSize,
        border: `${borderWidth} solid rgba(99, 102, 241, 0.15)`,
        borderTop: `${borderWidth} solid #6366f1`,
        borderRadius: '50%', animation: 'nama-spin 0.75s linear infinite',
      }} />
      {message && <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0, fontFamily: 'Noto Sans Arabic, sans-serif' }}>{message}</p>}
    </div>
  );

  if (overlay) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '2rem 3rem', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          {inner}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', minHeight: '250px' }}>
      {inner}
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({
  icon = '📋',
  title = 'لا توجد بيانات',
  description = 'لم يتم العثور على نتائج. جرّب تغيير معايير البحث.',
  action,
  secondaryAction,
}: {
  icon?: string;
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void; variant?: 'primary' | 'secondary' };
  secondaryAction?: { label: string; onClick: () => void };
}) {
  injectStyles();
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '4rem 2rem', minHeight: '280px', gap: '0.875rem', textAlign: 'center',
      animation: 'nama-fade 0.4s ease',
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
      }}>
        {icon}
      </div>
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1f2937', margin: 0, fontFamily: 'Noto Sans Arabic, sans-serif' }}>
        {title}
      </h3>
      <p style={{ color: '#9ca3af', fontSize: '0.875rem', maxWidth: '360px', margin: 0, lineHeight: 1.6, fontFamily: 'Noto Sans Arabic, sans-serif' }}>
        {description}
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {action && (
          <button onClick={action.onClick} style={{
            padding: '0.5rem 1.5rem', background: '#6366f1', color: 'white',
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
            fontFamily: 'Noto Sans Arabic, sans-serif', transition: 'opacity 0.2s',
          }} onMouseOver={e => (e.currentTarget.style.opacity = '0.9')}
             onMouseOut={e  => (e.currentTarget.style.opacity = '1')}>
            {action.label}
          </button>
        )}
        {secondaryAction && (
          <button onClick={secondaryAction.onClick} style={{
            padding: '0.5rem 1.25rem', background: 'transparent', color: '#6b7280',
            border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem',
            fontFamily: 'Noto Sans Arabic, sans-serif',
          }}>
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}

// ── ErrorState ────────────────────────────────────────────────────────────────
export function ErrorState({
  title = 'حدث خطأ',
  message = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
  onRetry,
  code,
  details,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  code?: string | number;
  details?: string;
}) {
  injectStyles();
  const [showDetails, setShowDetails] = useState(false);
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '4rem 2rem', minHeight: '280px', gap: '0.875rem', textAlign: 'center',
      animation: 'nama-fade 0.4s ease',
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%', background: '#fef2f2',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem',
      }}>⚠️</div>
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#dc2626', margin: 0, fontFamily: 'Noto Sans Arabic, sans-serif' }}>
        {title}
      </h3>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', maxWidth: '400px', margin: 0, lineHeight: 1.6, fontFamily: 'Noto Sans Arabic, sans-serif' }}>
        {message}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {code && (
          <code style={{ fontSize: '0.75rem', color: '#9ca3af', background: '#f3f4f6', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
            Error {code}
          </code>
        )}
        {details && (
          <button onClick={() => setShowDetails(p => !p)} style={{
            background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline',
          }}>
            {showDetails ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
          </button>
        )}
      </div>
      {showDetails && details && (
        <pre style={{ fontSize: '0.75rem', color: '#374151', background: '#f9fafb', padding: '0.75rem', borderRadius: '8px', maxWidth: '480px', overflowX: 'auto', textAlign: 'left', direction: 'ltr', margin: 0 }}>
          {details}
        </pre>
      )}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
        {onRetry && (
          <button onClick={onRetry} style={{
            padding: '0.5rem 1.5rem', background: '#ef4444', color: 'white',
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
            fontFamily: 'Noto Sans Arabic, sans-serif',
          }}>
            🔄 إعادة المحاولة
          </button>
        )}
        <button onClick={() => window.location.reload()} style={{
          padding: '0.5rem 1.25rem', background: 'transparent', color: '#6b7280',
          border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem',
        }}>
          تحديث الصفحة
        </button>
      </div>
    </div>
  );
}

// ── NetworkError ──────────────────────────────────────────────────────────────
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="تعذّر الاتصال بالخادم"
      message="تحقق من اتصالك بالإنترنت ثم حاول مرة أخرى."
      onRetry={onRetry}
      code="NETWORK_ERROR"
    />
  );
}

// ── PermissionDenied ──────────────────────────────────────────────────────────
export function PermissionDenied({ requiredRole }: { requiredRole?: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '4rem 2rem', minHeight: '280px', gap: '0.875rem', textAlign: 'center',
      animation: 'nama-fade 0.4s ease',
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem',
      }}>🔒</div>
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1f2937', margin: 0, fontFamily: 'Noto Sans Arabic, sans-serif' }}>
        غير مصرّح بالوصول
      </h3>
      <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0, fontFamily: 'Noto Sans Arabic, sans-serif' }}>
        ليس لديك صلاحية للوصول لهذه الصفحة.
        {requiredRole && ` (مطلوب: ${requiredRole})`}
      </p>
    </div>
  );
}

// ── Skeleton Components ───────────────────────────────────────────────────────
export function SkeletonBox({ width = '100%', height = 16, radius = 6 }: { width?: string | number; height?: number; radius?: number }) {
  injectStyles();
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%', animation: 'nama-pulse 1.5s ease-in-out infinite',
    }} />
  );
}

export function SkeletonRow({ columns = 5 }: { columns?: number }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '0.875rem 1rem', alignItems: 'center' }}>
      {Array.from({ length: columns }).map((_, i) => (
        <SkeletonBox key={i} width={i === 0 ? '35%' : `${Math.floor(65 / (columns - 1))}%`} height={14} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} columns={columns} />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div style={{ padding: '1.25rem', border: '1px solid #f0f0f0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <SkeletonBox height={20} width="60%" />
      <SkeletonBox height={14} width="90%" />
      <SkeletonBox height={14} width="75%" />
      <SkeletonBox height={36} radius={8} />
    </div>
  );
}

// ── DataStateWrapper ──────────────────────────────────────────────────────────
export function DataStateWrapper({
  loading,
  error,
  empty,
  children,
  loadingMessage,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyAction,
  onRetry,
  skeleton,
}: {
  loading: boolean;
  error?: Error | string | null;
  empty?: boolean;
  children: ReactNode;
  loadingMessage?: string;
  emptyIcon?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; onClick: () => void };
  onRetry?: () => void;
  skeleton?: ReactNode;
}) {
  if (loading) return skeleton ? <>{skeleton}</> : <LoadingState message={loadingMessage} />;
  if (error)   return <ErrorState message={typeof error === 'string' ? error : error.message} onRetry={onRetry} />;
  if (empty)   return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  return <>{children}</>;
}

// ── useAsyncData Hook ─────────────────────────────────────────────────────────
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: any[] = [],
): {
  data:    T | null;
  loading: boolean;
  error:   Error | null;
  refetch: () => void;
} {
  const [data,    setData]    = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<Error | null>(null);
  const [tick,    setTick]    = useState(0);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcher()
      .then(result => { if (!cancelled) { setData(result); setLoading(false); } })
      .catch(err  => { if (!cancelled) { setError(err instanceof Error ? err : new Error(String(err))); setLoading(false); } });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  return { data, loading, error, refetch };
}
