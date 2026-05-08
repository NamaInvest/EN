'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';
import { z } from 'zod';
import { Form, FormField } from '@/components/forms';

interface Currency {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string | null;
  symbol: string | null;
  exchangeRate: number;
  isDefault: boolean;
  isActive: boolean;
}

const currencySchema = z.object({
  code: z.string().min(2, 'الرمز مطلوب').max(5, 'رمز العملة طويل جداً').toUpperCase(),
  nameAr: z.string().min(2, 'الاسم بالعربية مطلوب'),
  nameEn: z.string().optional(),
  symbol: z.string().optional(),
  exchangeRate: z.number().min(0.00001, 'سعر الصرف يجب أن يكون أكبر من صفر'),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true)
});

type CurrencyFormValues = z.infer<typeof currencySchema>;

export default function CurrenciesPage() {
  const { t } = useTranslation();
  const { error: toastError, success: toastSuccess } = useToast();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  async function fetchData() {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/settings/currencies', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCurrencies(await res.json());
    } catch (err: any) { toastError(err?.message || 'حدث خطأ'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (data: CurrencyFormValues) => {
    const token = localStorage.getItem('token');
    try {
      if (editId) {
        const res = await fetch(`/api/settings/currencies/${editId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(data),
        });
        if (res.ok) { toastSuccess(t('sys.str_2531')); setShowModal(false); fetchData(); }
        else { const d = await res.json(); toastError(d.error || 'حدث خطأ'); }
      } else {
        const res = await fetch('/api/settings/currencies', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(data),
        });
        if (res.ok) { toastSuccess(t('sys.str_2532')); setShowModal(false); fetchData(); }
        else { const d = await res.json(); toastError(d.error || 'حدث خطأ'); }
      }
    } catch { toastError(t('sys.str_419')); }
  };

  const deleteCurrency = async (c: Currency) => {
    if (!confirm(`هل أنت متأكد من حذف العملة "${c.nameAr}"؟`)) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/settings/currencies/${c.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { toastSuccess(t('sys.str_488')); fetchData(); }
      else { const d = await res.json(); toastError(d.error || 'حدث خطأ'); }
    } catch { toastError(t('sys.str_419')); }
  };

  const openEdit = (c: Currency) => {
    setEditId(c.id);
    setShowModal(true);
  };

  const openAdd = () => {
    setEditId(null);
    setShowModal(true);
  };

  const editItem = currencies.find(c => c.id === editId);

  const defaultValues: Partial<CurrencyFormValues> = editItem ? {
    code: editItem.code,
    nameAr: editItem.nameAr,
    nameEn: editItem.nameEn || '',
    symbol: editItem.symbol || '',
    exchangeRate: editItem.exchangeRate,
    isDefault: editItem.isDefault,
    isActive: editItem.isActive
  } : {
    code: '', nameAr: '', nameEn: '', symbol: '', exchangeRate: 1.0, isDefault: false, isActive: true
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">{t('sys.str_2513')}</h1>
        <button className="btn btn-primary" onClick={openAdd}>{t('sys.str_2514')}</button>
      </div>

      <div className="page-content animate-fade-in">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t('sys.str_2515')}</th>
                <th>{t('sys.str_2516')}</th>
                <th>{t('sys.str_2517')}</th>
                <th>{t('sys.str_2518')}</th>
                <th>{t('sys.str_2519')}</th>
                <th>{t('sys.str_2520')}</th>
                <th>{t('fin.str_227')}</th>
                <th>{t('sys.str_435')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>{t('sys.str_168')}</td></tr>
              : currencies.length === 0 ? <tr><td colSpan={9}><div className="empty-state"><div className="empty-state-text">{t('sys.str_2521')}</div></div></td></tr>
              : currencies.map((c, i) => (
                <tr key={c.id}>
                  <td>{i + 1}</td>
                  <td><span className="badge badge-outline" dir="ltr">{c.code}</span></td>
                  <td style={{ fontWeight: 'bold' }}>{c.nameAr}</td>
                  <td dir="ltr">{c.nameEn || '-'}</td>
                  <td>{c.symbol || '-'}</td>
                  <td dir="ltr" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{c.exchangeRate}</td>
                  <td>
                    {c.isDefault ? <span className="badge badge-warning">{t('sys.str_2522')}</span> : '-'}
                  </td>
                  <td>
                    <span className={`badge ${c.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {c.isActive ? t('sys.str_2510') : t('sys.str_654')}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)} style={{ color: 'var(--primary)', fontSize: '13px' }}>✏️</button>
                    {!c.isDefault && (
                      <button className="btn btn-ghost btn-sm" onClick={() => deleteCurrency(c)} style={{ color: 'var(--danger)', fontSize: '13px' }}>🗑️</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editId ? t('sys.str_2533') : t('sys.str_2514')}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <Form schema={currencySchema} defaultValues={defaultValues} onSubmit={handleSave} className="space-y-4 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="code" label={t('sys.str_2523')} dir="ltr" placeholder="SAR, USD, EUR" />
                <FormField name="exchangeRate" type="number" label={t('sys.str_2524')} dir="ltr" step="0.00001" />
              </div>

              <FormField name="nameAr" label={t('sys.str_2525')} placeholder={t('sys.str_117')} />
              <FormField name="nameEn" label={t('sys.str_2526')} dir="ltr" placeholder="Saudi Riyal" />
              <FormField name="symbol" label={t('sys.str_2527')} dir="ltr" placeholder={t('sys.str_2534')} />

              <div className="flex gap-6 mt-4 p-4 bg-gray-50 rounded-lg">
                <FormField name="isActive" type="checkbox" label={t('sys.str_2528')} />
                <FormField name="isDefault" type="checkbox" label={t('sys.str_2529')} />
              </div>

              <div className="modal-footer mt-6 pt-4 border-t">
                <button type="submit" className="btn btn-primary">{t('sys.str_484')}</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('fin.str_206')}</button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </>
  );
}
