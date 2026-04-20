'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * ICE Layout — Cloud-only Admin Panel Guard
 * ICE panel should ONLY be accessible on namainvist.com (production cloud).
 * On localhost/Desktop mode, redirect to /dashboard.
 */
export default function IceLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1';
    if (isLocal) {
      router.replace('/dashboard');
    }
  }, [router]);

  // On localhost, show nothing while redirecting
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return null;
    }
  }

  return <>{children}</>;
}
