'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import { Suspense } from 'react';

function AutoLoginContent() {
    const searchParams = useSearchParams();
    const { user: clerkUser, isLoaded } = useUser();
    const { signOut } = useClerk();
    const [msg, setMsg] = useState('جاري التحقق من هويتك...');
    const [showSwitch, setShowSwitch] = useState(false);

    useEffect(() => {
        if (!isLoaded) return;

        const redirect = searchParams.get('redirect') || '/dashboard';
        const currentSubdomain = window.location.hostname.split('.')[0]; // مثل: ahmedalyamicompany

        const goToDashboard = (jwtToken: string, user?: any) => {
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

        const run = async () => {
            const token = searchParams.get('token');
            if (token) {
                setMsg('جاري التحقق من رمز الدخول الموحد...');
                try {
                    const res = await fetch(`/api/auth/auto-login?token=${encodeURIComponent(token)}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.token) {
                            goToDashboard(data.token, data.user);
                            return;
                        }
                    }
                } catch { /* ignore and fallback */ }
            }

            const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress;

            // ── خطوة 1: تحقق من الإيميل قبل أي شي ──────────────────────
            if (userEmail) {
                setMsg('جاري التحقق من صلاحية الوصول...');
                try {
                    // ابحث عن الـ tenant المرتبط بهذا الإيميل
                    const findRes = await fetch('https://namainvist.com/api/tenant/check-status?userId=_&email=' + encodeURIComponent(userEmail), {
                        signal: AbortSignal.timeout(5000),
                    });
                    if (findRes.ok) {
                        const findData = await findRes.json();
                        if (findData.provisioned && findData.subdomain) {
                            const correctSubdomain = findData.subdomain;
                            if (correctSubdomain !== currentSubdomain) {
                                // الإيميل مرتبط بـ subdomain مختلف → حوّل له
                                setMsg(`هذا الحساب مسجل في ${correctSubdomain}. جاري التحويل...`);
                                setTimeout(() => {
                                    window.location.replace(`https://${correctSubdomain}.namainvist.com/auto-login`);
                                }, 1500);
                                return;
                            }
                            // الإيميل صحيح لهذا الـ subdomain → سجّل دخول
                        } else {
                            // إيميل غير مسجّل → حوّل لإنشاء شركة
                            setMsg('إيميلك غير مسجّل. جاري التحويل لإنشاء شركة...');
                            setTimeout(() => {
                                window.location.replace('https://namainvist.com/company-info');
                            }, 2000);
                            return;
                        }
                    }
                } catch { /* تابع */ }
            } else {
                // ما فيه Clerk session → اعرض خيار تسجيل الدخول
                setMsg('يرجى تسجيل الدخول بإيميلك.');
                setShowSwitch(true);
                return;
            }

            // ── خطوة 2: الإيميل صحيح → سجّل دخول بـ login-by-email ─────
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
                } catch { /* تابع */ }
            }

            // ── خطوة 3: fallback → سجّل دخول كـ admin ───────────────────
            try {
                const loginRes = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: 'admin', password: 'admin7773' }),
                });
                if (loginRes.ok) {
                    const data = await loginRes.json();
                    if (data.token) { goToDashboard(data.token, data.user); return; }
                }
            } catch { /* تابع */ }

            // فشل كلي
            setMsg('تعذّر تسجيل الدخول.');
            setShowSwitch(true);
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
            fontFamily: "'Noto Sans Arabic', sans-serif",
        }} dir="rtl">
            <div style={{
                width: '48px',
                height: '48px',
                border: '4px solid #6366f1',
                borderTop: '4px solid transparent',
                borderRadius: '50%',
                animation: showSwitch ? 'none' : 'spin 0.8s linear infinite',
            }} />
            <p style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '16px' }}>{msg}</p>
            {showSwitch && (
                <button
                    onClick={() => { signOut(() => { window.location.href = 'https://namainvist.com/sign-in'; }); }}
                    style={{
                        marginTop: '16px',
                        padding: '12px 24px',
                        background: 'rgba(99, 102, 241, 0.2)',
                        color: '#a5b4fc',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                    }}
                >
                    🔄 تسجيل دخول بإيميل آخر
                </button>
            )}
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
