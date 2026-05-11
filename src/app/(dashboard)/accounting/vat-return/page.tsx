'use client';
import { useState, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';

interface VATBox { box: number; labelAr: string; labelEn: string; taxableValue: number; taxAmount: number }
interface VATSummary { vatDue: number; vatDeductible: number; netVAT: number; position: 'PAYABLE' | 'REFUND' }

export default function VATReturnPage() {
  const { lang: language } = useTranslation();
  const isAr = language === 'ar';
  const dir  = isAr ? 'rtl' : 'ltr';

  const [period, setPeriod] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(false);
  const [boxes, setBoxes]     = useState<VATBox[]>([]);
  const [summary, setSummary] = useState<VATSummary | null>(null);
  const [status, setStatus]   = useState<'draft'|'final'|null>(null);
  const [msg, setMsg]         = useState<{ type: 'ok'|'err'; text: string } | null>(null);

  const fetchReturn = useCallback(async () => {
    setLoading(true); setMsg(null); setBoxes([]); setSummary(null);
    try {
      const r = await fetch(`/api/accounting/vat-return?tenantId=default&period=${period}`);
      const d = await r.json();
      setBoxes(d.boxes ?? []);
      setSummary(d.summary ?? null);
      setStatus(d.status ?? 'draft');
    } catch (e) { setMsg({ type: 'err', text: String(e) }); }
    setLoading(false);
  }, [period]);

  const finalize = async () => {
    setLoading(true); setMsg(null);
    try {
      const r = await fetch('/api/accounting/vat-return', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: 'default', period, action: 'finalize', userId: 1 }),
      });
      const d = await r.json();
      setMsg({ type: r.ok ? 'ok' : 'err', text: d.message ?? d.error });
      if (r.ok) setStatus('final');
    } catch (e) { setMsg({ type: 'err', text: String(e) }); }
    setLoading(false);
  };

  return (
    <div style={{ padding: 24, direction: dir, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{isAr ? '📋 إقرار ضريبة القيمة المضافة' : '📋 VAT Return (Box 1-12)'}</h1>
      <p style={{ color: '#666', marginBottom: 20, fontSize: 13 }}>{isAr ? 'إقرار ضريبي شهري متوافق مع ZATCA' : 'ZATCA-compliant monthly VAT return'}</p>

      <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{isAr ? 'الفترة:' : 'Period:'}</label>
          <input type="month" value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }} />
        </div>
        <button onClick={fetchReturn} disabled={loading} style={{ padding: '10px 24px', borderRadius: 8, background: '#2196F3', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
          {loading ? '...' : (isAr ? '🔍 عرض' : '🔍 Load')}
        </button>
        {boxes.length > 0 && status === 'draft' && (
          <button onClick={finalize} disabled={loading} style={{ padding: '10px 24px', borderRadius: 8, background: '#FF9800', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
            {isAr ? '✅ إقفال' : '✅ Finalize'}
          </button>
        )}
        {boxes.length > 0 && (
          <button onClick={() => window.open(`/api/accounting/vat-return?tenantId=default&period=${period}&format=csv`, '_blank')}
            style={{ padding: '10px 24px', borderRadius: 8, background: '#4CAF50', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
            {isAr ? '⬇️ CSV' : '⬇️ CSV'}
          </button>
        )}
      </div>

      {msg && <div style={{ padding: '10px 16px', background: msg.type === 'ok' ? '#E8F5E9' : '#FFEBEE', color: msg.type === 'ok' ? '#2E7D32' : '#C62828', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 600 }}>{msg.type === 'ok' ? '✅' : '❌'} {msg.text}</div>}

      {boxes.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '14px 20px', background: '#1A237E', color: '#fff', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700 }}>{isAr ? `إقرار ${period}` : `VAT Return — ${period}`}</span>
            <span style={{ background: status === 'final' ? '#4CAF50' : '#FF9800', padding: '2px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{status === 'final' ? (isAr ? 'مقفل' : 'Final') : (isAr ? 'مسودة' : 'Draft')}</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: '#F5F7FA' }}>
              <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: '#555' }}>Box</th>
              <th style={{ padding: '10px 16px', textAlign: isAr?'right':'left', fontWeight: 600, color: '#555' }}>{isAr?'البيان':'Description'}</th>
              <th style={{ padding: '10px 16px', textAlign: 'end', fontWeight: 600, color: '#555' }}>{isAr?'الوعاء الضريبي':'Taxable Value'}</th>
              <th style={{ padding: '10px 16px', textAlign: 'end', fontWeight: 600, color: '#555' }}>{isAr?'مبلغ الضريبة':'Tax Amount'}</th>
            </tr></thead>
            <tbody>
              {boxes.map((b, i) => (
                <tr key={b.box} style={{ borderBottom: '1px solid #F0F0F0', background: i%2===0?'#fff':'#FAFAFA' }}>
                  <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, color: '#1A237E' }}>{b.box}</td>
                  <td style={{ padding: '10px 16px' }}>{isAr ? b.labelAr : b.labelEn}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'end', fontFamily: 'monospace' }}>{b.taxableValue.toLocaleString('ar-SA')}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'end', fontFamily: 'monospace', fontWeight: 600 }}>{b.taxAmount.toLocaleString('ar-SA')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { label: isAr?'ضريبة المبيعات':'Output VAT', value: summary.vatDue, color: '#F44336' },
            { label: isAr?'ضريبة المشتريات':'Input VAT', value: summary.vatDeductible, color: '#4CAF50' },
            { label: isAr?'صافي الضريبة':'Net VAT', value: Math.abs(summary.netVAT), color: '#2196F3' },
            { label: summary.position==='PAYABLE'?(isAr?'💳 مستحق الدفع':'💳 Payable'):(isAr?'💚 استرداد':'💚 Refund'), value: Math.abs(summary.netVAT), color: summary.position==='PAYABLE'?'#FF9800':'#4CAF50' },
          ].map((c,i) => (
            <div key={i} style={{ background:'#fff', borderRadius:12, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:700, color:c.color }}>{c.value.toLocaleString('ar-SA')}</div>
              <div style={{ fontSize:12, color:'#666', marginTop:4 }}>{isAr?'ر.س':'SAR'}</div>
              <div style={{ fontSize:13, fontWeight:600, marginTop:6 }}>{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {!boxes.length && !loading && (
        <div style={{ textAlign:'center', padding:60, color:'#999', background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📋</div>
          <div>{isAr?'اختر الفترة واضغط "عرض"':'Select period and click Load'}</div>
        </div>
      )}
    </div>
  );
}
