import { _t } from '@/lib/server-t';
'use client';
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';

export default async function DocViewPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const params = useParams();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/docs/${(await params).slug}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (r.ok) {
          const d = await r.json();
          setContent(d.content || d.text || '');
        } else {
          setContent(_t('# خطأ\nالمستند غير موجود.', '# Error\nDocument not found.'));
        }
      } catch {
        setContent(_t('# خطأ\nفشل في تحميل المستند.', '# Error\nFailed to load document.'));
      } finally { setLoading(false); }
    })();
  }, [(await params).slug]);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
      <Link href="/docs" style={{ textDecoration: 'none' }}>
        <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
          <ArrowLeft size={16} /> {_t('العودة للمستندات', 'Back to Docs')}
        </button>
      </Link>

      <div className="card" style={{ padding: '32px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{_t('جاري التحميل...', 'Loading...')}</div>
        ) : (
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '14px', lineHeight: 1.8, margin: 0, color: 'var(--text-primary)' }}>
            {content}
          </pre>
        )}
      </div>
    </div>
  );
}
