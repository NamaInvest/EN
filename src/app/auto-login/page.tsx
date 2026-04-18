'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

function AutoLoginContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [msg, setMsg] = useState('جاري تسجيل الدخول تلقائياً...');

    useEffect(() => {
        const token = searchParams.get('token');
        const redirect = searchParams.get('redirect') || '/dashboard';

        const goToDashboard = (jwtToken: string, user?: any) => {
            localStorage.setItem('token', jwtToken);
            if (user) localStorage.setItem('user', JSON.stringify(user));
            // Set cookie for middleware
            document.cookie = `token=${jwtToken}; path=/; max-age=${60 * 60 * 24 * 7}`;
            window.location.replace(redirect);
        };

        const tryDirectLogin = async () => {
            // محاولة تسجيل دخول مباشر بـ admin
            setMsg('جاري تسجيل الدخول...');
            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: 'admin', password: 'admin' }),
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.token) { goToDashboard(data.token, data.user); return; }
                }
            } catch { /* ignore */ }

            // fallback: توجيه لصفحة الدخول اليدوي
            window.location.replace('/login');
        };

        const run = async () => {
            // الخطوة 1: إذا يوجد SSO token جرّبه أولاً
            if (token) {
                try {
                    const res = await fetch(`/api/auth/auto-login?token=${encodeURIComponent(token)}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.success && data.token) {
                            goToDashboard(data.token, data.user);
                            return;
                        }
                    }
                } catch { /* SSO failed, try direct login */ }
            }

            // الخطوة 2: SSO فشل أو لا يوجد token → تسجيل دخول مباشر
            await tryDirectLogin();
        };

        run();
    }, [searchParams, router]);

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
            fontFamily: 'Cairo, sans-serif',
        }} dir="rtl">
            <div style={{
                width: '48px',
                height: '48px',
                border: '4px solid #6366f1',
                borderTop: '4px solid transparent',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '16px' }}>{msg}</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

export default function AutoLoginPage() {
    return (
        <Suspense>
            <AutoLoginContent />
        </Suspense>
    );
}
