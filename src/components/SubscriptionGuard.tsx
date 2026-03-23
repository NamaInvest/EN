'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function SubscriptionGuard() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Exclude generic routes and the master panel from subscription checks
        if (pathname === '/billing-expired' || pathname === '/login' || pathname?.includes('/master-panel')) {
            return;
        }
        
        const enforceSubscription = async () => {
            try {
                const res = await fetch('/api/subscription-status');
                if (res.ok) {
                    const data = await res.json();
                    if (data.active === false) {
                        router.push('/billing-expired');
                    }
                }
            } catch (err) {
                console.warn('Subscription Guard skipped due to fetch error');
            }
        };

        enforceSubscription();
    }, [pathname, router]);

    return null; // Silent invisible component
}
