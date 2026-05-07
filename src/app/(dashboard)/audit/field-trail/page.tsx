'use client';
import { useState, useEffect } from 'react';
import { Shield, Search } from 'lucide-react';
import { useToast } from '@/components/Toast';

const actionColors: any = { CREATE: '#22C55E', UPDATE: '#3B82F6', DELETE: '#EF4444' };

export default function FieldAuditTrail() {
  const { error: toastError } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableFilter, setTableFilter] = useState('');
  const [recordFilter, setRecordFilter] = useState('');

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (tableFilter) p.set('tableName', tableFilter);
      if (recordFilter) p.set('recordId', recordFilter);
      const r = await fetch(`/api/audit/field-trail?${p}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      if (r.ok) setLogs(await r.json());
    } catch (e: any) { toastError(e?.message); } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}><Shield size={28} color="var(--primary)" /> سجل التدقيق المتقدم</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>تتبع على مستوى الحقل مع مقارنة القيم</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: '12px', marginBottom: '20px' }}>
        {[{ l: 'إجمالي', v: logs.length, c: '#3B82F6' }, { l: 'إنشاء', v: logs.filter(x => x.action === 'CREATE').length, c: '#22C55E' }, { l: 'تعديل', v: logs.filter(x => x.action === 'UPDATE').length, c: '#F97316' }, { l: 'حذف', v: logs.filter(x => x.action === 'DELETE').length, c: '#EF4444' }].map((k, i) => (
          <div key={i} className="card" style={{ padding: '14px', textAlign: 'center' }}><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{k.l}</div><div style={{ fontSize: '22px', fontWeight: '900', color: k.c }}>{k.v}</div></div>
        ))}
      </div>

      <div className="card" style={{ padding: '14px', marginBottom: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 180px' }}><label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>الجدول</label><input className="input" value={tableFilter} onChange={e => setTableFilter(e.target.value)} placeholder="Invoice..." /></div>
        <div style={{ flex: '1 1 120px' }}><label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>رقم السجل</label><input className="input" type="number" dir="ltr" value={recordFilter} onChange={e => setRecordFilter(e.target.value)} /></div>
        <button className="btn btn-primary" onClick={load} style={{ height: '40px', display: 'flex', alignItems: 'center', gap: '6px' }}><Search size={16} /> بحث</button>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>جاري التحميل...</div> : (
        <div className="card" style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead><tr style={{ borderBottom: '2px solid var(--border)' }}>
              {['الإجراء', 'الجدول', 'السجل', 'الحقل', 'القديمة', 'الجديدة', 'المستخدم', 'التاريخ'].map(h => <th key={h} style={{ padding: '10px', textAlign: 'right', fontWeight: '700', color: 'var(--text-muted)', fontSize: '11px' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px' }}><span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '700', background: (actionColors[l.action] || '#94A3B8') + '20', color: actionColors[l.action] }}>{l.action}</span></td>
                  <td style={{ padding: '10px', fontWeight: '600', fontFamily: 'monospace', fontSize: '12px' }}>{l.tableName}</td>
                  <td style={{ padding: '10px', fontFamily: 'monospace' }}>#{l.recordId}</td>
                  <td style={{ padding: '10px', fontWeight: '600' }}>{l.fieldName}</td>
                  <td style={{ padding: '10px', color: '#EF4444', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px' }}>{l.oldValue || '-'}</td>
                  <td style={{ padding: '10px', color: '#22C55E', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px' }}>{l.newValue || '-'}</td>
                  <td style={{ padding: '10px', fontSize: '12px' }}>{l.userName || '-'}</td>
                  <td style={{ padding: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(l.createdAt).toLocaleString('en-GB')}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>لا توجد سجلات</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
