'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PriceQuotesLegacyRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/sales/quotations');
  }, [router]);

  return (
    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
      جاري إعادة التوجيه إلى الصفحة الجديدة لعروض الأسعار...
    </div>
  );
}