'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Shield, Building2 } from 'lucide-react';

/**
 * ICE Layout — Cloud-only Admin Panel Guard
 * ICE panel should ONLY be accessible on namainvist.com (production cloud).
 * On localhost/Desktop mode, redirect to /dashboard.
 * All ICE pages require authentication via /api/ice/auth.
 */
export default function IceLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1';
    if (isLocal) {
      router.replace('/dashboard');
      return;
    }

    // Check authentication
    fetch('/api/ice/auth')
      .then(r => r.json())
      .then(d => { setAuthenticated(d.authenticated); setAuthChecking(false); })
      .catch(() => { setAuthenticated(false); setAuthChecking(false); });
  }, [router]);

  // On localhost, show nothing while redirecting
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return null;
    }
  }

  const handleLogin = async () => {
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/ice/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setAuthenticated(true);
      } else {
        setLoginError(data.error || 'فشل تسجيل الدخول');
      }
    } catch { setLoginError('خطأ في الاتصال بالخادم'); }
    finally { setLoginLoading(false); }
  };

  // Loading state
  if (authChecking) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=Noto Sans Arabic:wght@400;700;900&display=swap');
          html { font-size: 24px !important; }
          body { font-family: 'Noto Sans Arabic', sans-serif; }
        ` }} />
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Login page
  if (!authenticated) {
    return (
      <div dir="rtl" className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 relative overflow-hidden">
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=Noto Sans Arabic:wght@400;700;900&display=swap');
          html { font-size: 20px !important; }
          body, button, input { font-family: 'Noto Sans Arabic', sans-serif; }
          .font-outfit { font-family: 'Outfit', sans-serif !important; }
        ` }} />
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-[128px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 rounded-full blur-[128px]" />
        </div>

        <div className="relative z-10 w-full max-w-md mx-4">
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/30">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white mb-2">محرك نما إنفست</h1>
            <p className="text-slate-400 text-sm font-bold">Infrastructure Control Engine</p>
          </div>

          {/* Login Card */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-black text-white mb-1">تسجيل الدخول</h2>
              <p className="text-slate-400 text-xs">أدخل بيانات الدخول للمتابعة</p>
            </div>

            {loginError && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl px-4 py-3 text-rose-400 text-sm font-bold text-center">
                {loginError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">اسم المستخدم</label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={e => setLoginUsername(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="admin"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-base placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">كلمة المرور</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-base placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all"
                />
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={loginLoading || !loginUsername || !loginPassword}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white text-base font-black rounded-2xl shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              {loginLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
              دخول
            </button>
          </div>

          <p className="text-center text-slate-600 text-xs mt-6 font-bold">
            Nama Invest Infrastructure Engine v2.0
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
