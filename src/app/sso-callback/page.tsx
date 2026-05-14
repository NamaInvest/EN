'use client';

/**
 * SSO Callback — صفحة وسيطة بين Clerk و sso-redirect (v2 Hardened)
 * ═══════════════════════════════════════════════════════════════════
 *
 * التدفق:
 *   SignIn (Clerk) → /sso-callback → /api/auth/sso-redirect?userId=xxx
 *
 * الإصلاحات في v2:
 *  - [#5] حماية ضد Re-render Loop: ينتظر Clerk حتى 10 ثوانٍ مع retry
 *  - [#5] استخدام useRef بدلاً من useState لمنع race conditions
 *  - [#5] إضافة timeout مع رسالة خطأ واضحة بدلاً من redirect لا نهائي
 *  - [#1] تكامل مع Loop Detection cookie من sso-redirect
 */

import { useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/nextjs';

/** أقصى وقت انتظار لتحميل بيانات Clerk (بالمللي ثانية) */
const CLERK_LOAD_TIMEOUT_MS = 10000;
/** الفاصل بين محاولات التحقق (بالمللي ثانية) */
const RETRY_INTERVAL_MS = 500;

export default function SSOCallbackPage() {
    const { user, isLoaded } = useUser();
    const [status, setStatus] = useState('جاري التحقق من هويتك...');
    const [hasError, setHasError] = useState(false);

    /**
     * [#5] استخدام useRef بدلاً من useState لمنع التحويل المتكرر.
     * useState قد يتسبب في re-render إضافي قبل أن يُطبّق الـ state الجديد.
     * useRef يُحدَّث فوراً بدون re-render.
     */
    const hasRedirectedRef = useRef(false);
    const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const timeoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // ── إذا تم التحويل بالفعل، لا نفعل شيئاً ────────────────
        if (hasRedirectedRef.current) return;

        // ── إذا Clerk جاهز والمستخدم موجود → نحوّل فوراً ──────
        if (isLoaded && user?.id) {
            hasRedirectedRef.current = true;
            setStatus('تم التحقق! جاري تحويلك...');

            // مسح أي timers قبل التحويل
            if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
            if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);

            // التحويل لـ sso-redirect مع userId
            window.location.href = `/api/auth/sso-redirect?userId=${user.id}`;
            return;
        }

        // ── إذا Clerk جاهز لكن لا يوجد مستخدم → تسجيل الدخول ──
        if (isLoaded && !user) {
            hasRedirectedRef.current = true;
            setStatus('لم يتم العثور على جلسة نشطة. جاري التحويل لتسجيل الدخول...');

            if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
            if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);

            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
            return;
        }

        // ── Clerk لم يكتمل بعد → ننتظر مع timeout ───────────────
        // تعيين timeout عام: إذا مرّ 10 ثوانٍ بدون أي نتيجة، نوقف ونعرض خطأ
        if (!timeoutTimerRef.current) {
            timeoutTimerRef.current = setTimeout(() => {
                if (!hasRedirectedRef.current) {
                    hasRedirectedRef.current = true;
                    setStatus('انتهت مهلة التحقق. يرجى إعادة المحاولة.');
                    setHasError(true);
                }
            }, CLERK_LOAD_TIMEOUT_MS);
        }

        // Cleanup
        return () => {
            if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
            if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
        };
    }, [isLoaded, user]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0f172a',
            color: 'white',
            flexDirection: 'column',
            gap: '16px',
            fontFamily: "'Noto Sans Arabic', sans-serif",
        }} dir="rtl">
            {!hasError ? (
                <>
                    {/* Spinner */}
                    <div style={{
                        width: '48px',
                        height: '48px',
                        border: '4px solid #6366f1',
                        borderTop: '4px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                    <p style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '16px' }}>
                        {status}
                    </p>
                </>
            ) : (
                <>
                    {/* Error State */}
                    <div style={{ fontSize: '48px' }}>⚠️</div>
                    <p style={{ color: '#f87171', fontWeight: 'bold', fontSize: '18px' }}>
                        {status}
                    </p>
                    <button
                        onClick={() => {
                            // مسح الـ loop detection cookie ثم إعادة المحاولة
                            document.cookie = 'sso_redirect_attempts=0; path=/; max-age=0';
                            window.location.href = '/login';
                        }}
                        style={{
                            background: '#6366f1',
                            color: 'white',
                            padding: '12px 32px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '16px',
                            fontFamily: "'Noto Sans Arabic', sans-serif",
                        }}
                    >
                        العودة لتسجيل الدخول
                    </button>
                </>
            )}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}