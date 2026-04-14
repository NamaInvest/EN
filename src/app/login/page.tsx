'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { Suspense } from 'react';
import { useTranslation } from "@/lib/i18n";

function LoginForm() {
    const { t } = useTranslation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [companyName, setCompanyName] = useState('Ù†Ù…Ø§ Ø§Ù†ÙØ³Øª');
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/auth/routing';

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
                setError(t('sys.str_4020') + res.status + ')');
                return;
            }

            if (!res.ok) {
                setError(data.error || t('sys.str_4021'));
                return;
            }

            console.log('[LOGIN] Success, saving token...');
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('lastActivity', Date.now().toString());
            
            document.cookie = `token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}`;
            // ÊæÌíå ááÕÝÍÉ ÇáÇÝÊÑÇÖíÉ
            const defaultPage = data.user?.defaultPage;
            window.location.href = defaultPage || '/dashboard';
        } catch (err) {
            console.error('[LOGIN] Error:', err);
            if (err instanceof DOMException && err.name === 'AbortError') {
                setError(t('sys.str_4022'));
            } else {
                setError(t('sys.str_4023') + (err instanceof Error ? err.message : t('sys.str_4024')));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">
                    <div className="login-logo-icon">{t('sys.str_4010')}</div>
                    <div className="login-logo-text">{companyName}</div>
                    <div className="login-subtitle">{t('sys.str_4011')}</div>
                </div>

                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label className="input-label">{t('sys.str_4012')}</label>
                        <input
                            type="text"
                            className="input"
                            placeholder={t('sys.str_4025')}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">{t('sys.str_4013')}</label>
                        <input
                            type="password"
                            className="input"
                            placeholder={t('sys.str_4026')}
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
                                {t('sys.str_4014')}</span>
                        ) : (
                            'ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„'
                        )}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: '#64748b' }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border-color, #e2e8f0)' }}></div>
                        <span style={{ margin: '0 10px', fontSize: '14px', fontWeight: 600 }}>{t('sys.str_4015')}</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border-color, #e2e8f0)' }}></div>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            signIn('google', { callbackUrl: callbackUrl })
                        }}
                        style={{
                            width: '100%',
                            padding: '14px',
                            fontSize: '16px',
                            background: 'white',
                            color: '#334155',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            fontWeight: 600,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#f8f9fa'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
                            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                        </svg>
                        {t('sys.str_4016')}</button>
                    
                </form>

                <div style={{
                    textAlign: 'center', marginTop: '24px', paddingTop: '20px',
                    borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '12px'
                }}>
                    {t('sys.str_4017')}</div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    const { t } = useTranslation();
    return (
        <Suspense fallback={<div style={{minHeight:'100vh',background:'#02040a',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold',fontSize:'1.25rem',fontFamily:'Cairo,sans-serif'}}>{t('sys.str_4018')}</div>}>
            <LoginForm />
        </Suspense>
    );
}
