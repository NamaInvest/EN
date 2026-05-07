import { _t } from '@/lib/server-t';
'use client';
import { useState, useEffect } from 'react';
import { ArrowRight, Plus, Layers, Search } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

interface Segment {
  id: number;
  code: string;
  name: string;
  nameEn: string | null;
  type: string;
  isActive: boolean;
}

export default function SegmentsPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const { success: ts, error: te } = useToast();
  const [items, setItems] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ code: '', name: '', nameEn: '', type: 'GEO' });
  const [saving, setSaving] = useState(false);

  const TYPE_LABELS: Record<string, string> = {
    GEO: _t('جغرافي', 'Geographic'),
    PRODUCT_LINE: _t('خط إنتاج', 'Product Line'),
    CHANNEL: _t('قناة توزيع', 'Distribution Channel'),
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/accounting/segments', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      if (res.ok) setItems(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.name) return;
    setSaving(true);
    try {
      const res = await fetch('/api/accounting/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ code: '', name: '', nameEn: '', type: 'GEO' });
        setShowForm(false);
        fetchItems();
        ts(_t('تم الحفظ بنجاح', 'Saved successfully'));
      } else {
        const data = await res.json();
        te(data.error || _t('فشل الحفظ', 'Save failed'));
      }
    } catch { te(_t('خطأ في الاتصال', 'Connection error')); }
    finally { setSaving(false); }
  };

  const filtered = items.filter(i =>
    !search ||
    i.code.toLowerCase().includes(search.toLowerCase()) ||
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.nameEn || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={28} color="var(--primary)" /> {_t('القطاعات', 'Segments')}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>{_t('إدارة القطاعات المحاسبية', 'Manage accounting segments')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> {_t('إضافة قطاع', 'Add Segment')}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700' }}>{_t('إضافة قطاع جديد', 'Add New Segment')}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>{_t('الرمز', 'Code')} *</label>
              <input className="input" placeholder={_t('مثال: SEG01', 'e.g. SEG01')} value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>{_t('الاسم (عربي)', 'Name (Arabic)')} *</label>
              <input className="input" placeholder={_t('المنطقة الوسطى', 'Central Region')} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>{_t('الاسم (إنجليزي)', 'Name (English)')}</label>
              <input className="input" placeholder="e.g. Central Region" value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>{_t('النوع', 'Type')}</label>
              <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="GEO">{_t('جغرافي', 'Geographic')}</option>
                <option value="PRODUCT_LINE">{_t('خط إنتاج', 'Product Line')}</option>
                <option value="CHANNEL">{_t('قناة توزيع', 'Distribution Channel')}</option>
              </select>
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? _t('جاري الحفظ...', 'Saving...') : _t('حفظ', 'Save')}
            </button>
          </form>
        </div>
      )}

      <div className="card" style={{ marginBottom: '16px', padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Search size={18} color="var(--text-muted)" />
          <input className="input" style={{ flex: 1, border: 'none' }} placeholder={_t('ابحث بالرمز أو الاسم...', 'Search by code or name...')} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{_t('جاري التحميل...', 'Loading...')}</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <Layers size={48} opacity={0.2} style={{ marginBottom: '12px' }} />
          <p>{_t('لا توجد قطاعات بعد', 'No segments yet')}</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>{_t('الرمز', 'Code')}</th>
                <th>{_t('الاسم (عربي)', 'Name (Arabic)')}</th>
                <th>{_t('الاسم (إنجليزي)', 'Name (English)')}</th>
                <th style={{ textAlign: 'center' }}>{_t('النوع', 'Type')}</th>
                <th style={{ textAlign: 'center' }}>{_t('الحالة', 'Status')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--primary)' }}>{item.code}</td>
                  <td style={{ fontWeight: '600' }}>{item.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{item.nameEn || '—'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', background: '#3b82f620', color: '#3b82f6' }}>
                      {TYPE_LABELS[item.type] || item.type}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', background: item.isActive ? '#22c55e20' : '#ef444420', color: item.isActive ? '#22c55e' : '#ef4444' }}>
                      {item.isActive ? _t('نشط', 'Active') : _t('غير نشط', 'Inactive')}
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
