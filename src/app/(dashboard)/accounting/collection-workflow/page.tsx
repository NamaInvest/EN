'use client';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';

type CollStatus = 'NEW'|'PROMISED'|'PARTIAL'|'ESCALATED'|'LEGAL'|'WRITTEN_OFF'|'COLLECTED';
const STATUS_COLOR: Record<CollStatus, string> = { NEW: '#9E9E9E', PROMISED: '#2196F3', PARTIAL: '#00BCD4', ESCALATED: '#FF9800', LEGAL: '#F44336', WRITTEN_OFF: '#795548', COLLECTED: '#4CAF50' };
const STATUS_AR:    Record<CollStatus, string> = { NEW: 'جديد', PROMISED: 'وعد دفع', PARTIAL: 'مدفوع جزئياً', ESCALATED: 'مصعَّد', LEGAL: 'قانوني', WRITTEN_OFF: 'مشطوب', COLLECTED: 'محصَّل' };

interface UrgentInv { id: number; invoiceNo: string; customerName: string; customerPhone: string; remainingAmount: number; dueDate: string; daysPastDue: number; collectionStatus: CollStatus; dunningLevel: number }
interface Summary { total: number; byStatus: Partial<Record<CollStatus, number>>; totalOutstanding: number }

export default function CollectionWorkflowPage() {
  const { lang: language } = useTranslation();
  const isAr = language === 'ar';
  const dir  = isAr ? 'rtl' : 'ltr';

  const [invoices, setInvoices]   = useState<UrgentInv[]>([]);
  const [summary, setSummary]     = useState<Summary | null>(null);
  const [loading, setLoading]     = useState(false);
  const [selectedInv, setSelectedInv] = useState<UrgentInv | null>(null);
  const [action, setAction]       = useState('CALL');
  const [notes, setNotes]         = useState('');
  const [amount, setAmount]       = useState('');
  const [promiseDate, setPromiseDate] = useState('');
  const [msg, setMsg]             = useState<{type:'ok'|'err'; text:string}|null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/accounting/collection-workflow?tenantId=default');
      const d = await r.json();
      setInvoices(d.urgentInvoices ?? []);
      setSummary(d.summary ?? null);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const recordAction = async () => {
    if (!selectedInv) return;
    setMsg(null);
    try {
      const r = await fetch('/api/accounting/collection-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 'default', action, invoiceId: selectedInv.id, userId: 1,
          notes: notes || undefined,
          amount: amount ? parseFloat(amount) : undefined,
          promiseDate: promiseDate || undefined,
        }),
      });
      const d = await r.json();
      setMsg({ type: r.ok ? 'ok' : 'err', text: d.message ?? d.error });
      if (r.ok) { setSelectedInv(null); setNotes(''); setAmount(''); setPromiseDate(''); await load(); }
    } catch (e) { setMsg({ type: 'err', text: String(e) }); }
  };

  const ACTIONS = ['CALL','EMAIL','VISIT','PROMISE','LEGAL_NOTICE','WRITE_OFF','PAYMENT_RECEIVED'];
  const ACTIONS_AR: Record<string,string> = { CALL:'اتصال', EMAIL:'بريد إلكتروني', VISIT:'زيارة', PROMISE:'وعد دفع', LEGAL_NOTICE:'إشعار قانوني', WRITE_OFF:'شطب', PAYMENT_RECEIVED:'استلام دفعة' };

  return (
    <div style={{ padding: 24, direction: dir, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{isAr ? '💼 إدارة التحصيل' : '💼 Collection Workflow'}</h1>
      <p style={{ color: '#666', marginBottom: 20, fontSize: 13 }}>{isAr ? 'تتبع الذمم المتأخرة ووعود الدفع والتصعيد القانوني' : 'Track overdue AR, promise-to-pay, and legal escalation'}</p>

      {/* Summary by status */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10, marginBottom: 20 }}>
          {(Object.keys(STATUS_AR) as CollStatus[]).map(s => (
            <div key={s} style={{ background: '#fff', borderRadius: 10, padding: '12px 8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center', borderTop: `3px solid ${STATUS_COLOR[s]}` }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: STATUS_COLOR[s] }}>{summary.byStatus[s] ?? 0}</div>
              <div style={{ fontSize: 11, color: '#666', marginTop: 3 }}>{isAr ? STATUS_AR[s] : s}</div>
            </div>
          ))}
        </div>
      )}

      {/* Outstanding total */}
      {summary && (
        <div style={{ background: '#1A237E', borderRadius: 12, padding: '16px 24px', color: '#fff', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600 }}>{isAr ? 'إجمالي الذمم المتأخرة' : 'Total Outstanding AR'}</span>
          <span style={{ fontSize: 22, fontWeight: 700 }}>{summary.totalOutstanding.toLocaleString('ar-SA')} {isAr ? 'ر.س' : 'SAR'}</span>
        </div>
      )}

      {/* Invoices table */}
      {msg && <div style={{ padding: '10px 16px', background: msg.type === 'ok' ? '#E8F5E9' : '#FFEBEE', color: msg.type === 'ok' ? '#2E7D32' : '#C62828', borderRadius: 8, marginBottom: 12, fontSize: 13, fontWeight: 600 }}>{msg.type === 'ok' ? '✅' : '❌'} {msg.text}</div>}

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F5F7FA' }}>
              {[isAr?'رقم الفاتورة':'Invoice', isAr?'العميل':'Customer', isAr?'المبلغ المتبقي':'Remaining', isAr?'تاريخ الاستحقاق':'Due Date', isAr?'أيام التأخر':'DPD', isAr?'الحالة':'Status', isAr?'إجراء':'Action'].map(h => (
                <th key={h} style={{ padding: '11px 14px', textAlign: isAr ? 'right' : 'left', fontWeight: 600, color: '#555' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#999' }}>...</td></tr>}
            {!loading && invoices.map(inv => (
              <tr key={inv.id} style={{ borderBottom: '1px solid #F0F0F0' }}>
                <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1A237E' }}>{inv.invoiceNo}</td>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ fontWeight: 600 }}>{inv.customerName}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>{inv.customerPhone}</div>
                </td>
                <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#F44336' }}>{inv.remainingAmount.toLocaleString('ar-SA')}</td>
                <td style={{ padding: '10px 14px', color: '#666' }}>{inv.dueDate?.split('T')[0]}</td>
                <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                  <span style={{ background: inv.daysPastDue > 90 ? '#FFEBEE' : inv.daysPastDue > 30 ? '#FFF3E0' : '#F5F5F5', color: inv.daysPastDue > 90 ? '#C62828' : inv.daysPastDue > 30 ? '#E65100' : '#666', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>
                    {inv.daysPastDue}
                  </span>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ background: STATUS_COLOR[inv.collectionStatus] + '20', color: STATUS_COLOR[inv.collectionStatus], padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                    {isAr ? STATUS_AR[inv.collectionStatus] : inv.collectionStatus}
                  </span>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <button onClick={() => setSelectedInv(inv)} style={{ padding: '4px 12px', borderRadius: 6, background: '#2196F3', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                    {isAr ? 'تسجيل' : 'Record'}
                  </button>
                </td>
              </tr>
            ))}
            {!loading && invoices.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#4CAF50', fontWeight: 600 }}>✅ {isAr ? 'لا توجد فواتير متأخرة' : 'No overdue invoices'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Action Modal */}
      {selectedInv && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 420, direction: dir }}>
            <h3 style={{ marginBottom: 4, fontWeight: 700 }}>{isAr ? '📝 تسجيل نشاط تحصيل' : '📝 Record Collection Activity'}</h3>
            <div style={{ color: '#666', fontSize: 13, marginBottom: 16 }}>{selectedInv.invoiceNo} — {selectedInv.customerName}</div>
            <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4 }}>{isAr ? 'النشاط:' : 'Action:'}</label>
            <select value={action} onChange={e => setAction(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', marginBottom: 12 }}>
              {ACTIONS.map(a => <option key={a} value={a}>{isAr ? ACTIONS_AR[a] : a}</option>)}
            </select>
            {action === 'PROMISE' && (
              <>
                <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4 }}>{isAr ? 'مبلغ الوعد:' : 'Promise Amount:'}</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', marginBottom: 12, boxSizing: 'border-box' }} />
                <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4 }}>{isAr ? 'تاريخ الوعد:' : 'Promise Date:'}</label>
                <input type="date" value={promiseDate} onChange={e => setPromiseDate(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', marginBottom: 12 }} />
              </>
            )}
            <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 4 }}>{isAr ? 'ملاحظات:' : 'Notes:'}</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', resize: 'vertical', boxSizing: 'border-box', marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedInv(null)} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>{isAr ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={recordAction} style={{ padding: '8px 20px', borderRadius: 8, background: '#2196F3', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>{isAr ? 'حفظ' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
