'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Plus, Hash, Search, RefreshCw, Settings2 } from 'lucide-react';
import Link from 'next/link';

interface NumberSequence {
  id: number;
  code: string;
  name: string;
  prefix: string;
  suffix: string;
  padLength: number;
  lastNumber: number;
  resetPeriod: string;
  isActive: boolean;
}

export default function NumberSequencesPage() {
  const [items, setItems] = useState<NumberSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ code: '', name: '', prefix: '', suffix: '', padLength: 6, resetPeriod: 'NEVER' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/number-sequences');
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
      const res = await fetch('/api/settings/number-sequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ code: '', name: '', prefix: '', suffix: '', padLength: 6, resetPeriod: 'NEVER' });
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

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/settings/number-sequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed' }),
      });
      if (res.ok) fetchItems();
    } catch { /* ignore */ } finally {
      setSeeding(false);
    }
  };

  const previewNumber = (seq: NumberSequence) => {
    const next = seq.lastNumber + 1;
    const padded = String(next).padStart(seq.padLength, '0');
    return `${seq.prefix}${padded}${seq.suffix}`;
  };

  const filtered = items.filter(i =>
    !search ||
    i.code.toLowerCase().includes(search.toLowerCase()) ||
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <Link href="/settings" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
          <ArrowRight size={20} /> العودة للإعدادات
        </Link>
        <h1 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Hash size={24} color="var(--primary)" /> تسلسل الترقيم
        </h1>
        <div style={{ flex: 1 }} />
        <button
          className="btn"
          onClick={handleSeed}
          disabled={seeding}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Settings2 size={16} /> {seeding ? 'جاري التهيئة...' : 'تهيئة الافتراضي'}
        </button>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={18} /> إضافة تسلسل
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>إضافة تسلسل ترقيم جديد</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>الرمز *</label>
              <input className="input" placeholder="مثال: INV" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>الاسم *</label>
              <input className="input" placeholder="فواتير المبيعات" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>البادئة (Prefix)</label>
              <input className="input" placeholder="INV-" value={form.prefix} onChange={e => setForm({ ...form, prefix: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>اللاحقة (Suffix)</label>
              <input className="input" placeholder="" value={form.suffix} onChange={e => setForm({ ...form, suffix: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>طول الرقم</label>
              <input className="input" type="number" min={3} max={12} value={form.padLength} onChange={e => setForm({ ...form, padLength: parseInt(e.target.value) || 6 })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>إعادة التعيين</label>
              <select className="input" value={form.resetPeriod} onChange={e => setForm({ ...form, resetPeriod: e.target.value })}>
                <option value="NEVER">بدون إعادة تعيين</option>
                <option value="YEARLY">سنوياً</option>
                <option value="MONTHLY">شهرياً</option>
              </select>
            </div>
            <div style={{ gridColumn: 'span 3', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn" type="button" onClick={() => setShowForm(false)}>إلغاء</button>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'جاري الحفظ...' : 'حفظ'}
              </button>
            </div>
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
          <Hash size={48} opacity={0.2} style={{ marginBottom: '1rem' }} />
          <p>لا توجد تسلسلات ترقيم. اضغط &quot;تهيئة الافتراضي&quot; لإنشاء التسلسلات الأساسية.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                <th style={{ padding: '1rem', textAlign: 'right', width: '10%' }}>الرمز</th>
                <th style={{ padding: '1rem', textAlign: 'right', width: '20%' }}>الاسم</th>
                <th style={{ padding: '1rem', textAlign: 'right', width: '15%' }}>البادئة</th>
                <th style={{ padding: '1rem', textAlign: 'center', width: '10%' }}>الطول</th>
                <th style={{ padding: '1rem', textAlign: 'center', width: '12%' }}>آخر رقم</th>
                <th style={{ padding: '1rem', textAlign: 'right', width: '18%' }}>الرقم التالي</th>
                <th style={{ padding: '1rem', textAlign: 'center', width: '15%' }}>إعادة التعيين</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--primary)' }}>{item.code}</td>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{item.name}</td>
                  <td style={{ padding: '1rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{item.prefix || '—'}</td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>{item.padLength}</td>
                  <td style={{ padding: '1rem', textAlign: 'center', fontFamily: 'monospace' }}>{item.lastNumber}</td>
                  <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 'bold', color: '#22c55e' }}>
                    <RefreshCw size={14} style={{ display: 'inline', marginLeft: '0.5rem' }} />
                    {previewNumber(item)}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold',
                      background: item.resetPeriod === 'NEVER' ? '#64748b20' : '#3b82f620',
                      color: item.resetPeriod === 'NEVER' ? '#64748b' : '#3b82f6',
                    }}>
                      {item.resetPeriod === 'NEVER' ? 'بدون' : item.resetPeriod === 'YEARLY' ? 'سنوي' : 'شهري'}
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
