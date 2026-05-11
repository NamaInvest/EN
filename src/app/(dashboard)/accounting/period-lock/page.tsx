'use client';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';

type Status = 'OPEN' | 'LOCKED' | 'TEMP_UNLOCKED';
interface PeriodRow { period: string; status: Status; lockedBy?: string; lockedAt?: string; reason?: string }

const statusColor: Record<Status, string>  = { OPEN: '#4CAF50', LOCKED: '#F44336', TEMP_UNLOCKED: '#FF9800' };
const statusIcon:  Record<Status, string>  = { OPEN: '🟢', LOCKED: '🔒', TEMP_UNLOCKED: '🔓' };
const statusLabel: Record<Status, Record<'ar'|'en', string>> = {
  OPEN:          { ar: 'مفتوح',        en: 'Open'           },
  LOCKED:        { ar: 'مقفل',         en: 'Locked'         },
  TEMP_UNLOCKED: { ar: 'مفتوح مؤقتاً', en: 'Temp. Unlocked' },
};

export default function PeriodLockPage() {
  const { lang: language } = useTranslation();
  const isAr   = language === 'ar';
  const dir    = isAr ? 'rtl' : 'ltr';

  const [periods, setPeriods]     = useState<PeriodRow[]>([]);
  const [loading, setLoading]     = useState(false);
  const [selected, setSelected]   = useState<string | null>(null);
  const [reason, setReason]       = useState('');
  const [action, setAction]       = useState<'lock' | 'unlock' | null>(null);
  const [msg, setMsg]             = useState<{ type: 'ok'|'err'; text: string } | null>(null);
  const tenantId = 'default';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/accounting/period-lock?tenantId=${tenantId}`);
      const d = await r.json();
      setPeriods(d.periods ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const execute = async () => {
    if (!selected || !action) return;
    setLoading(true); setMsg(null);
    try {
      const r = await fetch('/api/accounting/period-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, period: selected, action, reason, userId: 1 }),
      });
      const d = await r.json();
      setMsg({ type: r.ok ? 'ok' : 'err', text: d.message ?? d.error ?? 'Done' });
      if (r.ok) { await load(); setSelected(null); setReason(''); setAction(null); }
    } catch (e) {
      setMsg({ type: 'err', text: String(e) });
    }
    setLoading(false);
  };

  // Generate last 12 months for display
  const generatePeriods = () => {
    const rows: string[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      rows.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return rows;
  };

  const allPeriods = generatePeriods();
  const periodMap  = new Map(periods.map(p => [p.period, p]));

  return (
    <div style={{ padding: 24, direction: dir, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
        {isAr ? '🔒 إقفال الفترات المحاسبية' : '🔒 Accounting Period Lock'}
      </h1>
      <p style={{ color: '#666', marginBottom: 20, fontSize: 13 }}>
        {isAr ? 'تحكم في إقفال وفتح الفترات المحاسبية — يتطلب صلاحيات CFO/Admin' : 'Control period open/lock status — requires CFO/Admin role'}
      </p>

      {msg && (
        <div style={{ padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 600,
          background: msg.type === 'ok' ? '#E8F5E9' : '#FFEBEE', color: msg.type === 'ok' ? '#2E7D32' : '#C62828' }}>
          {msg.type === 'ok' ? '✅' : '❌'} {msg.text}
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#F5F7FA' }}>
              <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left', fontWeight: 600, color: '#555' }}>{isAr ? 'الفترة' : 'Period'}</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#555' }}>{isAr ? 'الحالة' : 'Status'}</th>
              <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left', fontWeight: 600, color: '#555' }}>{isAr ? 'أُقفل بواسطة' : 'Locked By'}</th>
              <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left', fontWeight: 600, color: '#555' }}>{isAr ? 'السبب' : 'Reason'}</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#555' }}>{isAr ? 'إجراء' : 'Action'}</th>
            </tr>
          </thead>
          <tbody>
            {allPeriods.map((period, i) => {
              const row    = periodMap.get(period);
              const status: Status = row?.status ?? 'OPEN';
              const isSel  = selected === period;
              return (
                <tr key={period} style={{ borderBottom: '1px solid #F0F0F0', background: isSel ? '#E3F2FD' : i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 600, fontFamily: 'monospace' }}>{period}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                    <span style={{ background: statusColor[status] + '20', color: statusColor[status], padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                      {statusIcon[status]} {statusLabel[status][isAr ? 'ar' : 'en']}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', color: '#666', fontSize: 13 }}>{row?.lockedBy ?? '—'}</td>
                  <td style={{ padding: '10px 16px', color: '#666', fontSize: 13 }}>{row?.reason ?? '—'}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      {status === 'OPEN' && (
                        <button onClick={() => { setSelected(period); setAction('lock'); }}
                          style={{ padding: '4px 14px', borderRadius: 6, background: '#F44336', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                          {isAr ? 'إقفال' : 'Lock'}
                        </button>
                      )}
                      {(status === 'LOCKED' || status === 'TEMP_UNLOCKED') && (
                        <button onClick={() => { setSelected(period); setAction('unlock'); }}
                          style={{ padding: '4px 14px', borderRadius: 6, background: '#4CAF50', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                          {isAr ? 'فتح' : 'Unlock'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && action && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 400, direction: dir }}>
            <h3 style={{ marginBottom: 16, fontWeight: 700 }}>
              {action === 'lock' ? (isAr ? '🔒 إقفال الفترة' : '🔒 Lock Period') : (isAr ? '🔓 فتح الفترة' : '🔓 Unlock Period')}: {selected}
            </h3>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, fontSize: 13 }}>{isAr ? 'السبب:' : 'Reason:'}</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
              placeholder={isAr ? 'أدخل سبب الإجراء...' : 'Enter reason...'}
              style={{ width: '100%', borderRadius: 8, border: '1px solid #ddd', padding: '8px 12px', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => { setSelected(null); setAction(null); setReason(''); }}
                style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button onClick={execute} disabled={loading}
                style={{ padding: '8px 20px', borderRadius: 8, background: action === 'lock' ? '#F44336' : '#4CAF50', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                {loading ? '...' : (action === 'lock' ? (isAr ? 'إقفال' : 'Lock') : (isAr ? 'فتح' : 'Unlock'))}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
