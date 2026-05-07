'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Plus, Layers, Search } from 'lucide-react';
import Link from 'next/link';

interface Segment {
  id: number;
  code: string;
  name: string;
  nameEn: string | null;
  type: string;
  isActive: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  GEO: 'جغرافي',
  PRODUCT_LINE: 'خط إنتاج',
  CHANNEL: 'قناة توزيع',
};

export default function SegmentsPage() {
  const [items, setItems] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ code: '', name: '', nameEn: '', type: 'GEO' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/accounting/segments');
      if (res.ok) setItems(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.name) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/accounting/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ code: '', name: '', nameEn: '', type: 'GEO' });
        setShowForm(false);
        fetchItems();
      } else {
        const data = await res.json();
        setError(data.error || 'فشل الحفظ');
      }
    } catch {
      setError('خطأ في الاتصال');
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
          <Layers size={24} color="var(--primary)" /> القطاعات
        </h1>
        <div style={{ flex: 1 }} />
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={18} /> إضافة قطاع
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>إضافة قطاع جديد</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>الرمز *</label>
              <input className="input" placeholder="مثال: SEG01" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>الاسم (عربي) *</label>
              <input className="input" placeholder="مثال: المنطقة الوسطى" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>الاسم (إنجليزي)</label>
              <input className="input" placeholder="e.g. Central Region" value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>النوع</label>
              <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="GEO">جغرافي</option>
                <option value="PRODUCT_LINE">خط إنتاج</option>
                <option value="CHANNEL">قناة توزيع</option>
              </select>
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </form>
          {error && <div style={{ color: '#ef4444', marginTop: '0.75rem', fontSize: '0.9rem' }}>{error}</div>}
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
          <Layers size={48} opacity={0.2} style={{ marginBottom: '1rem' }} />
          <p>لا توجد قطاعات بعد. أضف أول قطاع من الزر أعلاه.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                <th style={{ padding: '1rem', textAlign: 'right', width: '15%' }}>الرمز</th>
                <th style={{ padding: '1rem', textAlign: 'right', width: '25%' }}>الاسم (عربي)</th>
                <th style={{ padding: '1rem', textAlign: 'right', width: '25%' }}>الاسم (إنجليزي)</th>
                <th style={{ padding: '1rem', textAlign: 'center', width: '20%' }}>النوع</th>
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
                      background: '#3b82f620', color: '#3b82f6',
                    }}>
                      {TYPE_LABELS[item.type] || item.type}
                    </span>
                  </td>
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
