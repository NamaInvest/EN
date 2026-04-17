'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

function AutoLoginContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'error'>('loading');
    const [error, setError] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setError('رابط الدخول غير صالح.');
            setStatus('error');
            return;
        }

        fetch(`/api/auth/auto-login?token=${encodeURIComponent(token)}`)
            .then(r => r.json())
            .then(data => {
                if (data.success && data.token) {
                    localStorage.setItem('token', data.token);
                    router.replace('/dashboard');
                } else {
                    setError(data.error || 'فشل تسجيل الدخول التلقائي.');
                    setStatus('error');
                }
            })
            .catch(() => {
                setError('تعذر الاتصال بالخادم.');
                setStatus('error');
            });
    }, [searchParams, router]);

    if (status === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white flex-col gap-4" dir="rtl">
                <div className="text-4xl">❌</div>
                <p className="text-red-400 font-bold">{error}</p>
                <a href="/login" className="text-indigo-400 underline text-sm">تسجيل الدخول يدوياً</a>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white flex-col gap-4" dir="rtl">
            <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-300 font-bold">جاري تسجيل الدخول تلقائياً...</p>
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
