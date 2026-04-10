'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function GlobalAuthGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        // Define exact public routes or prefixes
        const publicRoutes = [
            '/login', 
            '/onboarding', 
            '/api', 
            '/_next', 
            '/manifest.json',
            '/sw.js',
            '/workbox-',
            '/favicon.ico',
            '/googlebe8c17f02d7742b4.html'
        ];
        
        // Allow public routes
        if (!pathname || publicRoutes.some(r => pathname.startsWith(r))) {
            setIsAuthenticated(true);
            return;
        }

        // Check token
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }
        
        setIsAuthenticated(true);
    }, [pathname]);

    // Render children normally. If not authenticated, the window.location.href will kick in.
    return <>{children}</>;
}
