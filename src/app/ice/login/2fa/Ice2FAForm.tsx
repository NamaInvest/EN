'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Loader2 } from 'lucide-react';

export default function Ice2FAForm() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ice/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'فشل التحقق من الرمز');
      }

      // Successful verification
      router.push('/ice');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleVerify} className="space-y-5">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-bold text-center">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-bold text-neutral-400 mr-2">رمز التحقق (TOTP)</label>
        <div className="relative">
          <div className="absolute inset-y-0 right-0 pl-3 pr-4 flex items-center pointer-events-none">
            <KeyRound className="h-5 w-5 text-neutral-500" />
          </div>
          <input
            type="text"
            required
            maxLength={6}
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/[^0-9]/g, ''))}
            className="block w-full pl-3 pr-12 py-3 bg-[#0a0a0f] border border-white/10 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-center text-xl tracking-[0.5em] font-bold"
            placeholder="000000"
            dir="ltr"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || token.length !== 6}
        className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-cyan-600 to-[#0066cc] hover:from-cyan-500 hover:to-[#0052a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#14161c] focus:ring-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          'تأكيد الدخول'
        )}
      </button>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => router.push('/ice/login')}
          className="text-xs text-neutral-500 hover:text-white transition-colors"
        >
          العودة لتسجيل الدخول
        </button>
      </div>
    </form>
  );
}
