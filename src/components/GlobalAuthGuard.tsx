'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useUser, useAuth } from "@clerk/nextjs";

export default function GlobalAuthGuard() {
    const pathname = usePathname();
    const { isLoaded, isSignedIn, user } = useUser();
    const { getToken } = useAuth();
    const [synced, setSynced] = useState(false);

    useEffect(() => {
        const publicRoutes = [
            '/',
            '/sign-in',
            '/sign-up',
            '/login',
            '/sso-callback',       // [#8] صفحة SSO callback الوسيطة
            '/auto-login',         // [#8] دخول تلقائي بعد SSO
            '/auth',               // [#8] صفحة auth/routing
            '/company-info',
            '/pricing',            // [#8] صفحة الأسعار العامة
            '/billing-expired',    // صفحة انتهاء الاشتراك
            '/api',
            '/_next',
            '/manifest.json',
            '/sw.js',
            '/workbox-',
            '/favicon.ico',
            '/googlebe8c17f02d7742b4.html'
        ];

        if (!pathname || publicRoutes.some(r => pathname === r || (r !== '/' && pathname.startsWith(r)))) {
            return;
        }

        if (isLoaded && isSignedIn && user && !synced) {
            // Skip sync on tenant subdomains (it's forbidden by the API anyway)
            if (window.location.hostname !== 'namainvist.com' && window.location.hostname !== 'www.namainvist.com' && !window.location.hostname.startsWith('localhost')) {
                setSynced(true);
                return;
            }

            fetch('/api/auth/sync', { method: 'POST' })
                .then(res => res.json())
                .then(data => {
                    setSynced(true);
                })
                .catch(err => {
                    console.error("Sync error:", err);
                    setSynced(true);
                });
        }

    }, [pathname, isLoaded, isSignedIn, user, synced]);

    return null;
}
