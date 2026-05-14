'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2 } from 'lucide-react';

/**
 * @description
 * Client component handling the login form state and API submission.
 * Includes interactive feedback, loading states, and error handling.
 */
export default function IceLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ice/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'فشل تسجيل الدخول');
      }

      if (data.requires2FA) {
        // Future implementation: Redirect to 2FA screen or show 2FA input
        router.push('/ice/login/2fa');
      } else {
        router.push('/ice');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-bold text-center">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-bold text-neutral-400 mr-2">البريد الإلكتروني</label>
        <div className="relative">
          <div className="absolute inset-y-0 right-0 pl-3 pr-4 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-neutral-500" />
          </div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full pl-3 pr-12 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-[#0066cc]/50 focus:border-[#0066cc] transition-all text-sm font-medium"
            placeholder="admin@namainvest.com"
            dir="ltr"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-neutral-400 mr-2">كلمة المرور</label>
        <div className="relative">
          <div className="absolute inset-y-0 right-0 pl-3 pr-4 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-neutral-500" />
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full pl-3 pr-12 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-[#0066cc]/50 focus:border-[#0066cc] transition-all text-sm font-medium"
            placeholder="••••••••••••"
            dir="ltr"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-[#0066cc] to-[#0052a3] hover:from-[#0052a3] hover:to-[#004080] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#14161c] focus:ring-[#0066cc] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          'تسجيل الدخول'
        )}
      </button>
    </form>
  );
}
