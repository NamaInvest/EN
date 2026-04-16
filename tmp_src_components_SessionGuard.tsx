'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * SessionGuard â€” checks session validity every 30 seconds.
 * If user logged in on another device, this detects it and forces logout.
 */
export default function SessionGuard() {
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.replace('/login');
                return;
            }

            try {
                const res = await fetch('/api/auth/session', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (!data.valid && data.reason === 'session_replaced') {
                    localStorage.removeItem('token');
                    document.cookie = "auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    localStorage.removeItem('user');
                    alert(t('sys.str_98'));
                    router.replace('/login');
                }
            } catch { /* ignore network errors */ }
        };

        // Check immediately, then every 30 seconds
        checkSession();
        const interval = setInterval(checkSession, 30000);
        return () => clearInterval(interval);
    }, [router]);

    return null; // This component renders nothing
}