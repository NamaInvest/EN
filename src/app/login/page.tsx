'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [companyName, setCompanyName] = useState('نما انفست');
    const router = useRouter();

    useEffect(() => {
        fetch('/api/settings').then(r => r.ok ? r.json() : []).then(data => {
            const name = data.find?.((s: { key: string }) => s.key === 'company_name');
            if (name?.value) setCompanyName(name.value);
        }).catch(() => { });

        // Temporary 1-hour auto-login bypass
        const bypassExpiry = new Date('2026-03-20T01:10:00+03:00').getTime();
        if (Date.now() < bypassExpiry && !localStorage.getItem('token')) {
            setUsername('admin');
            setPassword('admin');
            setTimeout(() => {
                const btn = document.getElementById('login-btn-auto');
                if (btn) btn.click();
            }, 800);
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            console.log('[LOGIN] Starting login...');

            // Generate or retrieve device token
            let deviceToken = localStorage.getItem('deviceToken');
            if (!deviceToken) {
                deviceToken = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                    const r = (Math.random() * 16) | 0;
                    const v = c === 'x' ? r : (r & 0x3) | 0x8;
                    return v.toString(16);
                });
                localStorage.setItem('deviceToken', deviceToken);
            }
            const deviceName = navigator.userAgent.substring(0, 50);

            console.log('[LOGIN] Sending fetch...');

            // Add timeout to prevent infinite hang
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, deviceToken, deviceName }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            console.log('[LOGIN] Response status:', res.status);

            let data;
            try {
                data = await res.json();
            } catch {
                setError('الخادم أرسل رد غير صالح (status: ' + res.status + ')');
                return;
            }

            if (!res.ok) {
                setError(data.error || 'خطأ في تسجيل الدخول');
                return;
            }

            console.log('[LOGIN] Success, saving token...');
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('lastActivity', Date.now().toString());
            document.cookie = `token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}`;
            window.location.href = '/dashboard';
        } catch (err) {
            console.error('[LOGIN] Error:', err);
            if (err instanceof DOMException && err.name === 'AbortError') {
                setError('انتهت مهلة الاتصال بالخادم - حاول مرة أخرى');
            } else {
                setError('خطأ في الاتصال: ' + (err instanceof Error ? err.message : 'تحقق من الشبكة'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">
                    <div className="login-logo-icon">ن</div>
                    <div className="login-logo-text">{companyName}</div>
                    <div className="login-subtitle">نظام نقاط البيع والمحاسبة المتكامل</div>
                </div>

                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label className="input-label">اسم المستخدم</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="أدخل اسم المستخدم"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">كلمة المرور</label>
                        <input
                            type="password"
                            className="input"
                            placeholder="أدخل كلمة المرور"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            marginBottom: '16px',
                            color: '#F87171',
                            fontSize: '13px',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        id="login-btn-auto"
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ width: '100%', padding: '14px', fontSize: '16px', marginTop: '8px' }}
                    >
                        {loading ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <span className="login-spinner" />
                                جاري الدخول...
                            </span>
                        ) : (
                            'تسجيل الدخول'
                        )}
                    </button>
                </form>

                <div style={{
                    textAlign: 'center', marginTop: '24px', paddingTop: '20px',
                    borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '12px'
                }}>
                    الحساب الافتراضي: admin / admin
                </div>
            </div>
        </div>
    );
}
