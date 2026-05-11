'use client';
import { useState, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';

interface PLSection { name: string; nameAr: string; total: number; accounts: { code: string; name: string; nameAr: string; balance: number; compare?: number }[] }
interface PLSummary { totalRevenue: number; grossProfit: number; grossMargin: string; ebit: number; netIncome: number; netMargin: string }

export default function ProfitLossPage() {
  const { lang: language } = useTranslation();
  const isAr = language === 'ar';
  const dir  = isAr ? 'rtl' : 'ltr';

  const [from, setFrom]       = useState(() => { const d = new Date(new Date().getFullYear(), 0, 1); return d.toISOString().split('T')[0]; });
  const [to, setTo]           = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<PLSection[]>([]);
  const [summary, setSummary]   = useState<PLSummary | null>(null);
  const [msg, setMsg]           = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true); setMsg(null);
    try {
      const r = await fetch(`/api/accounting/profit-loss?tenantId=default&from=${from}&to=${to}`);
      const d = await r.json();
      setSections(d.sections ?? []);
      setSummary(d.summary ?? null);
    } catch (e) { setMsg(String(e)); }
    setLoading(false);
  }, [from, to]);

  const exportCSV = () => window.open(`/api/accounting/profit-loss?tenantId=default&from=${from}&to=${to}&format=csv`, '_blank');

  const fmtSAR = (n: number) => `${n.toLocaleString('ar-SA')} ر.س`;

  return (
    <div style={{ padding: 24, direction: dir, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{isAr ? '📈 قائمة الدخل' : '📈 Profit & Loss Statement'}</h1>
      <p style={{ color: '#666', marginBottom: 20, fontSize: 13 }}>{isAr ? 'قائمة دخل متوافقة مع IFRS/SOCPA مع هوامش الربح' : 'IFRS/SOCPA compliant P&L with margin analysis'}</p>

      {/* Controls */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {[{ label: isAr ? 'من:' : 'From:', val: from, set: setFrom }, { label: isAr ? 'إلى:' : 'To:', val: to, set: setTo }].map(f => (
          <div key={f.label}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{f.label}</label>
            <input type="date" value={f.val} onChange={e => f.set(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }} />
          </div>
        ))}
        <button onClick={fetch_} disabled={loading}
          style={{ padding: '10px 24px', borderRadius: 8, background: '#2196F3', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
          {loading ? '...' : (isAr ? '🔍 عرض' : '🔍 Load')}
        </button>
        {sections.length > 0 && (
          <button onClick={exportCSV} style={{ padding: '10px 24px', borderRadius: 8, background: '#4CAF50', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
            {isAr ? '⬇️ CSV' : '⬇️ CSV'}
          </button>
        )}
      </div>

      {msg && <div style={{ padding: '10px 16px', background: '#FFEBEE', color: '#C62828', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>❌ {msg}</div>}

      {/* KPI Summary Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: isAr ? 'الإيرادات' : 'Revenue', value: fmtSAR(summary.totalRevenue), color: '#2196F3' },
            { label: isAr ? 'مجمل الربح' : 'Gross Profit', value: fmtSAR(summary.grossProfit), color: '#4CAF50' },
            { label: isAr ? 'هامش مجمل' : 'Gross Margin', value: summary.grossMargin, color: '#00BCD4' },
            { label: 'EBIT', value: fmtSAR(summary.ebit), color: summary.ebit >= 0 ? '#FF9800' : '#F44336' },
            { label: isAr ? 'صافي الربح' : 'Net Income', value: fmtSAR(summary.netIncome), color: summary.netIncome >= 0 ? '#4CAF50' : '#F44336' },
          ].map((c, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: c.color }}>{c.value}</div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Sections */}
      {sections.map(sec => (
        <div key={sec.name} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', background: '#F5F7FA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{isAr ? sec.nameAr : sec.name}</span>
            <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#333' }}>{sec.total.toLocaleString('ar-SA')} ر.س</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <tbody>
              {sec.accounts.map(a => (
                <tr key={a.code} style={{ borderBottom: '1px solid #F5F5F5' }}>
                  <td style={{ padding: '8px 20px', color: '#888', width: 80 }}>{a.code}</td>
                  <td style={{ padding: '8px 12px' }}>{isAr ? a.nameAr : a.name}</td>
                  <td style={{ padding: '8px 20px', textAlign: 'end', fontFamily: 'monospace', fontWeight: 600 }}>{a.balance.toLocaleString('ar-SA')}</td>
                  {a.compare !== undefined && (
                    <td style={{ padding: '8px 20px', textAlign: 'end', fontFamily: 'monospace', color: '#999', fontSize: 12 }}>{a.compare.toLocaleString('ar-SA')}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {!sections.length && !loading && (
        <div style={{ textAlign: 'center', padding: 60, color: '#999', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📈</div>
          <div>{isAr ? 'اختر الفترة واضغط "عرض"' : 'Select period and click "Load"'}</div>
        </div>
      )}
    </div>
  );
}
