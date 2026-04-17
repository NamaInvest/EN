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
            '/company-info',
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
            fetch('/api/auth/sync', { method: 'POST' })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setSynced(true);
                    }
                })
                .catch(err => console.error("Sync error:", err));
        }

    }, [pathname, isLoaded, isSignedIn, user, synced]);

    return null;
}
