'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Suspense } from 'react';

function AutoLoginContent() {
    const searchParams = useSearchParams();
    const { user: clerkUser, isLoaded } = useUser();
    const [msg, setMsg] = useState('جاري تسجيل الدخول...');

    useEffect(() => {
        if (!isLoaded) return; // انتظر تحميل Clerk

        const token = searchParams.get('token');
        const redirect = searchParams.get('redirect') || '/dashboard';

        const goToDashboard = (jwtToken: string, user?: any) => {
            // إذا يوجد مستخدم Clerk، استخدم بياناته للعرض
            const displayUser = {
                ...(user || {}),
                fullName: clerkUser?.fullName || clerkUser?.emailAddresses?.[0]?.emailAddress || user?.fullName || 'Admin',
                email: clerkUser?.emailAddresses?.[0]?.emailAddress || user?.email || '',
                role: user?.role || 'admin',
            };
            localStorage.setItem('token', jwtToken);
            localStorage.setItem('user', JSON.stringify(displayUser));
            document.cookie = `token=${jwtToken}; path=/; max-age=${60 * 60 * 24 * 7}`;
            window.location.replace(redirect);
        };

        const tryAutoLogin = async () => {
            setMsg('جاري التحقق من هويتك...');

            // محاولة 1: تسجيل الدخول بالبريد من Clerk
            const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress;
            if (userEmail) {
                try {
                    const res = await fetch('/api/auth/login-by-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: userEmail }),
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.token) { goToDashboard(data.token, data.user); return; }
                    }
                } catch { /* متابعة */ }
            }

            // محاولة 2: تسجيل الدخول كـ admin
            try {
                setMsg('جاري الدخول كمدير النظام...');
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: 'admin', password: 'admin' }),
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.token) { goToDashboard(data.token, data.user); return; }
                }
            } catch { /* متابعة */ }

            // إذا فشل كل شيء → الـ dashboard مباشرة
            window.location.replace(redirect);
        };

        const run = async () => {
            // إذا يوجد SSO token صريح جرّبه
            if (token) {
                try {
                    const res = await fetch(`/api/auth/auto-login?token=${encodeURIComponent(token)}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.success && data.token) { goToDashboard(data.token, data.user); return; }
                    }
                } catch { /* تابع */ }
            }

            await tryAutoLogin();
        };

        run();
    }, [isLoaded, clerkUser, searchParams]);

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
