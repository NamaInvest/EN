'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { ArrowRight, Plus, Building2, Search } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface ProfitCenter {
  id: number;
  code: string;
  name: string;
  nameEn: string | null;
  parentId: number | null;
  isActive: boolean;
  createdAt: string;
}

const formSchema = z.object({
  code: z.string().min(1, 'الرمز مطلوب'),
  name: z.string().min(1, 'الاسم (عربي) مطلوب'),
  nameEn: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ProfitCentersPage() {
  const { lang } = useTranslation();
  const { success: toastSuccess, error: toastError } = useToast();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const [items, setItems] = useState<ProfitCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: {
          code: '',
          name: '',
          nameEn: ''
      }
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/accounting/profit-centers');
      if (res.ok) setItems(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const onSubmit = async (data: FormValues) => {
    setSaving(true);
    try {
      const res = await fetch('/api/accounting/profit-centers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        reset();
        setShowForm(false);
        toastSuccess('تم حفظ مركز الربحية بنجاح');
        fetchItems();
      } else {
        const resData = await res.json();
        toastError(resData.error || 'فشل الحفظ');
      }
    } catch {
      toastError('خطأ في الاتصال');
    } finally {
      setSaving(false);
    }
  };

  const filtered = items.filter(i =>
    !search ||
    i.code.toLowerCase().includes(search.toLowerCase()) ||
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.nameEn || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/accounting" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
          <ArrowRight size={20} /> العودة للمحاسبة
        </Link>
        <h1 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building2 size={24} color="var(--primary)" /> مراكز الربحية
        </h1>
        <div style={{ flex: 1 }} />
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={18} /> إضافة مركز ربحية
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>إضافة مركز ربحية جديد</h3>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'start' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>الرمز *</label>
              <input className={`input ${errors.code ? 'border-red-500' : ''}`} placeholder="مثال: PC001" {...register('code')} />
              {errors.code && <span className="text-red-500 text-xs mt-1 block">{errors.code.message}</span>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>الاسم (عربي) *</label>
              <input className={`input ${errors.name ? 'border-red-500' : ''}`} placeholder="مثال: إدارة المبيعات" {...register('name')} />
              {errors.name && <span className="text-red-500 text-xs mt-1 block">{errors.name.message}</span>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>الاسم (إنجليزي)</label>
              <input className="input" placeholder="e.g. Sales Dept" {...register('nameEn')} />
            </div>
            <div style={{ marginTop: '23px' }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'جاري الحفظ...' : 'حفظ'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Search size={20} color="var(--text-muted)" />
          <input className="input" style={{ flex: 1 }} placeholder="ابحث بالرمز أو الاسم..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <Building2 size={48} opacity={0.2} style={{ marginBottom: '1rem' }} />
          <p>لا توجد مراكز ربحية بعد. أضف أول مركز ربحية من الزر أعلاه.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                <th style={{ padding: '1rem', textAlign: 'right', width: '15%' }}>الرمز</th>
                <th style={{ padding: '1rem', textAlign: 'right', width: '30%' }}>الاسم (عربي)</th>
                <th style={{ padding: '1rem', textAlign: 'right', width: '30%' }}>الاسم (إنجليزي)</th>
                <th style={{ padding: '1rem', textAlign: 'center', width: '15%' }}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--primary)' }}>{item.code}</td>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{item.name}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{item.nameEn || '—'}</td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold',
                      background: item.isActive ? '#22c55e20' : '#ef444420',
                      color: item.isActive ? '#22c55e' : '#ef4444',
                    }}>
                      {item.isActive ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
