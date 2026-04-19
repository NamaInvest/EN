'use client';
import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextValue {
    toast: (message: string, type?: ToastType, duration?: number) => string;
    success: (message: string, duration?: number) => string;
    error: (message: string, duration?: number) => string;
    warning: (message: string, duration?: number) => string;
    info: (message: string, duration?: number) => string;
    loading: (message: string) => string;
    dismiss: (id: string) => void;
    dismissAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, string> = {
    success: 'âœ…',
    error:   'â‌Œ',
    warning: 'âڑ ï¸ڈ',
    info:    'â„¹ï¸ڈ',
    loading: 'âڈ³',
};

const COLORS: Record<ToastType, { bg: string; border: string; text: string }> = {
    success: { bg: 'rgba(22,163,74,0.12)',  border: 'rgba(22,163,74,0.4)',  text: '#16a34a' },
    error:   { bg: 'rgba(220,38,38,0.12)',  border: 'rgba(220,38,38,0.4)',  text: '#dc2626' },
    warning: { bg: 'rgba(217,119,6,0.12)',  border: 'rgba(217,119,6,0.4)',  text: '#d97706' },
    info:    { bg: 'rgba(37,99,235,0.12)',   border: 'rgba(37,99,235,0.4)',  text: '#2563eb' },
    loading: { bg: 'rgba(108,99,255,0.12)', border: 'rgba(108,99,255,0.4)', text: '#6c63ff' },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    const dismiss = useCallback((id: string) => {
        if (timers.current[id]) clearTimeout(timers.current[id]);
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const dismissAll = useCallback(() => {
        Object.values(timers.current).forEach(clearTimeout);
        timers.current = {};
        setToasts([]);
    }, []);

    const toast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        setToasts(prev => [...prev.slice(-4), { id, message, type, duration }]);
        if (type !== 'loading' && duration > 0) {
            timers.current[id] = setTimeout(() => dismiss(id), duration);
        }
        return id;
    }, [dismiss]);

    const success = useCallback((m: string, d?: number) => toast(m, 'success', d), [toast]);
    const error   = useCallback((m: string, d?: number) => toast(m, 'error',   d ?? 6000), [toast]);
    const warning = useCallback((m: string, d?: number) => toast(m, 'warning', d), [toast]);
    const info    = useCallback((m: string, d?: number) => toast(m, 'info',    d), [toast]);
    const loading = useCallback((m: string)             => toast(m, 'loading', 0), [toast]);

    return (
        <ToastContext.Provider value={{ toast, success, error, warning, info, loading, dismiss, dismissAll }}>
            {children}
            {/* Toast container */}
            <div style={{
                position: 'fixed',
                bottom: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 999999,
                display: 'flex',
                flexDirection: 'column-reverse',
                gap: '8px',
                alignItems: 'center',
                pointerEvents: 'none',
                width: '100%',
                maxWidth: '480px',
                padding: '0 16px',
            }}>
                {toasts.map(t => {
                    const c = COLORS[t.type];
                    return (
                        <div key={t.id} style={{
                            background: 'var(--bg-card, #1e2130)',
                            border: `1px solid ${c.border}`,
                            borderRight: `4px solid ${c.text}`,
                            borderRadius: '10px',
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            width: '100%',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                            pointerEvents: 'all',
                            direction: 'rtl',
                            fontFamily: "'Lateef', sans-serif",
                            animation: 'toastSlideIn 0.25s ease',
                            backdropFilter: 'blur(12px)',
                        }}>
                            <span style={{ fontSize: '18px', flexShrink: 0 }}>{ICONS[t.type]}</span>
                            <span style={{ flex: 1, fontSize: '14px', fontWeight: '600', color: 'var(--text, #f8fafc)', lineHeight: 1.4 }}>
                                {t.message}
                            </span>
                            <button onClick={() => dismiss(t.id)} style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--text-muted, #94a3b8)', fontSize: '16px', flexShrink: 0,
                                padding: '2px 4px', lineHeight: 1,
                            }}>âœ•</button>
                        </div>
                    );
                })}
            </div>
            <style>{`@keyframes toastSlideIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        // fallback â€” ظ…ط§ ظپظٹظ‡ providerطŒ ظ†ط±ط¬ط¹ ظˆط¸ط§ط¦ظپ طھط³طھط®ط¯ظ… console ظپظ‚ط·
        const noop = (m: string) => { console.log('[Toast]', m); return ''; };
        return {
            toast:      (m, t) => { console.log(`[Toast:${t}]`, m); return ''; },
            success:    noop,
            error:      (m) => { console.error('[Toast:error]', m); return ''; },
            warning:    noop,
            info:       noop,
            loading:    noop,
            dismiss:    () => {},
            dismissAll: () => {},
        };
    }
    return ctx;
}

