'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';
import { z } from 'zod';
import { Form, FormField } from '@/components/forms';

interface Return { id: number; returnNo: number; date: string; subtotal: number; taxValue: number; total: number; notes: string }

const returnSchema = z.object({
  originalInvoiceId: z.string().optional(),
  subtotal: z.coerce.number().min(0.01, 'المبلغ مطلوب'),
  notes: z.string().optional(),
});

type ReturnFormValues = z.infer<typeof returnSchema>;

export default function PurchaseReturnsPage() {
  const { t } = useTranslation();
  const { error: toastError, success: toastSuccess } = useToast();
  const [returns, setReturns] = useState<Return[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);
  
  async function load() { 
    setLoading(true); 
    try { 
      const r = await fetch('/api/purchase-returns'); 
      if (r.ok) setReturns(await r.json()); 
    } catch (e: any) { toastError(e?.message || 'حدث خطأ'); } 
    setLoading(false); 
  }

  const handleSave = async (data: ReturnFormValues) => { 
    setSaving(true);
    try {
      const r = await fetch('/api/purchase-returns', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(data) 
      }); 
      if (r.ok) { 
        setShowAdd(false); 
        toastSuccess('تم حفظ المرتجع بنجاح');
        load(); 
      } else {
        const d = await r.json();
        toastError(d.error || 'حدث خطأ');
      }
    } catch {
      toastError('حدث خطأ في الاتصال');
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n: number) => Number(n || 0).toLocaleString('en-SA', { minimumFractionDigits: 2 });

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">{t('sys.str_965')}</h1>
      </div>
      <div className="page-content animate-fade-in">
        <div className="toolbar">
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{returns.length} {t('sys.str_966')}</span>
          <div className="toolbar-spacer" />
          <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? t('fin.str_206') : t('sys.str_967')}
          </button>
        </div>

        {showAdd && (
          <div className="card mb-4 p-4">
            <h3 className="font-bold mb-4">{t('sys.str_967')}</h3>
            <Form schema={returnSchema} defaultValues={{ originalInvoiceId: '', subtotal: 0, notes: '' }} onSubmit={handleSave}>
              <div className="flex gap-4 flex-wrap items-end">
                <div className="flex-1 min-w-[200px]">
                  <FormField name="originalInvoiceId" label={t('sys.str_968')} dir="ltr" />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <FormField name="subtotal" type="number" label={t('sys.str_969')} dir="ltr" step="0.01" />
                </div>
                <div className="flex-[2] min-w-[300px]">
                  <FormField name="notes" label={t('sys.str_465')} />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? '...' : t('fin.str_205')}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>
                    {t('fin.str_206')}
                  </button>
                </div>
              </div>
            </Form>
          </div>
        )}

        <div className="card">
          {loading ? <div className="empty-state"><div className="empty-state-text">{t('sys.str_168')}</div></div> :
          returns.length === 0 ? <div className="empty-state"><div className="empty-state-icon">🔄</div><div className="empty-state-text">{t('sys.str_970')}</div></div> :
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(108,99,255,0.05)' }}>
                <th style={{ padding: '8px', textAlign: 'right' }}>#</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>{t('fin.str_232')}</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>{t('sys.str_463')}</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>{t('sys.str_946')}</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>{t('sys.str_66')}</th>
              </tr>
            </thead>
            <tbody>
              {returns.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px', fontFamily: 'monospace' }}>{r.returnNo}</td>
                  <td style={{ padding: '8px', fontSize: '12px' }}>{new Date(r.date).toLocaleDateString('en-GB')}</td>
                  <td style={{ padding: '8px', fontFamily: 'monospace' }}>{fmt(r.subtotal)}</td>
                  <td style={{ padding: '8px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{fmt(r.taxValue)}</td>
                  <td style={{ padding: '8px', fontFamily: 'monospace', fontWeight: 'bold' }}>{fmt(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>}
        </div>
      </div>
    </>
  );
}
