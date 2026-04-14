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
        // Define exact public routes or prefixes
        const publicRoutes = [
            '/',            // ← الصفحة الرئيسية عامة دائماً
            '/sign-in', 
            '/sign-up', 
            '/onboarding', 
            '/api', 
            '/_next', 
            '/manifest.json',
            '/sw.js',
            '/workbox-',
            '/favicon.ico',
            '/googlebe8c17f02d7742b4.html'
        ];
        
        // Allow public routes immediately
        if (!pathname || publicRoutes.some(r => pathname === r || (r !== '/' && pathname.startsWith(r)))) {
            return;
        }

        if (isLoaded && isSignedIn && user && !synced) {
             fetch('/api/auth/sync', { method: 'POST' })
               .then(res => res.json())
               .then(data => {
                   if(data.success) {
                       setSynced(true);
                       
                       // Redirect to provisioning ONLY from non-landing pages on the central domain
                       const host = typeof window !== 'undefined' ? window.location.hostname : '';
                       const isMainSite = host === 'namainvist.com' || host === 'www.namainvist.com';
                       const isLandingPath = pathname === '/' || pathname === '';
                       
                       if (isMainSite && !isLandingPath && !pathname?.startsWith('/onboarding/provisioning')) {
                           window.location.href = '/onboarding/provisioning';
                       }
                   }
               })
               .catch(err => console.error("Sync error:", err));
        }

    }, [pathname, isLoaded, isSignedIn, user, synced]);

    return null;
}
