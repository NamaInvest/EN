'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Auto-logout after 4 hours of inactivity
const INACTIVITY_TIMEOUT = 4 * 60 * 60 * 1000; // 4 hours in ms

export default function InactivityGuard() {
    const router = useRouter();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const logout = useCallback(() => {
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        localStorage.removeItem('token');
        document.cookie = "auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        localStorage.removeItem('user');
        localStorage.removeItem('lastActivity');
        router.push('/login');
    }, [router]);

    const resetTimer = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(logout, INACTIVITY_TIMEOUT);
        // Save last activity timestamp
        localStorage.setItem('lastActivity', Date.now().toString());
    }, [logout]);

    useEffect(() => {
        // Check if already expired on mount
        const lastActivity = localStorage.getItem('lastActivity');
        if (lastActivity) {
            const elapsed = Date.now() - parseInt(lastActivity);
            if (elapsed >= INACTIVITY_TIMEOUT) {
                logout();
                return;
            }
        }

        // Track user activity events
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
        events.forEach(event => window.addEventListener(event, resetTimer));

        // Start the timer
        resetTimer();

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            events.forEach(event => window.removeEventListener(event, resetTimer));
        };
    }, [resetTimer, logout]);

    return null; // This component renders nothing
}

