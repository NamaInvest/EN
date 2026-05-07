'use client';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function BankReconciliationPage() {
  const { lang: language } = useTranslation();
  const isAr = language === 'ar';
  const [step, setStep] = useState(1);
  const [bankAccount, setBankAccount] = useState('');
  const [statementRows, setStatementRows] = useState<any[]>([]);
  const [matched, setMatched] = useState<any[]>([]);
  const [unmatched, setUnmatched] = useState<any[]>([]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const lines = (reader.result as string).split('\n').filter(Boolean);
      const rows = lines.slice(1).map((l, i) => { const cols = l.split(','); return { id: i, date: cols[0], desc: cols[1], debit: parseFloat(cols[2] || '0'), credit: parseFloat(cols[3] || '0'), matched: false }; });
      setStatementRows(rows);
      setStep(2);
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ padding: 24, direction: isAr ? 'rtl' : 'ltr' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>{isAr ? '🏦 تسوية البنك' : '🏦 Bank Reconciliation'}</h1>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: step >= s ? '#2196F3' : '#e0e0e0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{s}</div>
            <span style={{ fontSize: 13, color: step >= s ? '#333' : '#999' }}>
              {s === 1 ? (isAr ? 'رفع الكشف' : 'Upload') : s === 2 ? (isAr ? 'المطابقة' : 'Match') : (isAr ? 'الملخص' : 'Summary')}
            </span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>{isAr ? 'حساب البنك:' : 'Bank Account:'}</label>
          <select value={bankAccount} onChange={e => setBankAccount(e.target.value)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', marginBottom: 16, width: 300 }}>
            <option value="">{isAr ? '— اختر —' : '— Select —'}</option>
            <option value="rajhi">{isAr ? 'الراجحي' : 'Al Rajhi'}</option>
            <option value="ahli">{isAr ? 'الأهلي' : 'SNB'}</option>
            <option value="bilad">{isAr ? 'البلاد' : 'Albilad'}</option>
          </select>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>{isAr ? 'كشف البنك (CSV):' : 'Bank Statement (CSV):'}</label>
          <input type="file" accept=".csv" onChange={handleUpload} />
        </div>
      )}

      {step === 2 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <h3 style={{ marginBottom: 12, color: '#2196F3' }}>{isAr ? '📄 كشف البنك' : '📄 Bank Statement'}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ background: '#E3F2FD' }}>
                  <th style={{ padding: 8 }}>{isAr ? 'التاريخ' : 'Date'}</th>
                  <th style={{ padding: 8 }}>{isAr ? 'الوصف' : 'Description'}</th>
                  <th style={{ padding: 8 }}>{isAr ? 'مدين' : 'Debit'}</th>
                  <th style={{ padding: 8 }}>{isAr ? 'دائن' : 'Credit'}</th>
                </tr></thead>
                <tbody>
                  {statementRows.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f0f0f0', background: r.matched ? '#E8F5E9' : '#fff' }}>
                      <td style={{ padding: 8 }}>{r.date}</td>
                      <td style={{ padding: 8 }}>{r.desc}</td>
                      <td style={{ padding: 8, color: '#F44336' }}>{r.debit || ''}</td>
                      <td style={{ padding: 8, color: '#4CAF50' }}>{r.credit || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <h3 style={{ marginBottom: 12, color: '#FF9800' }}>{isAr ? '📋 قيود النظام' : '📋 System Entries'}</h3>
              <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>{isAr ? 'جاري جلب القيود المطابقة...' : 'Fetching matching entries...'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={() => setStep(1)} style={{ padding: '8px 24px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>{isAr ? '← رجوع' : '← Back'}</button>
            <button onClick={() => setStep(3)} style={{ padding: '8px 24px', borderRadius: 8, background: '#4CAF50', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>{isAr ? 'إكمال التسوية ←' : 'Complete →'}</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2>{isAr ? 'تمت التسوية' : 'Reconciliation Complete'}</h2>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', margin: '24px 0' }}>
            <div style={{ background: '#E8F5E9', borderRadius: 12, padding: '16px 32px' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#4CAF50' }}>{statementRows.length}</div>
              <div style={{ color: '#666' }}>{isAr ? 'إجمالي الحركات' : 'Total Rows'}</div>
            </div>
            <div style={{ background: '#E3F2FD', borderRadius: 12, padding: '16px 32px' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#2196F3' }}>{matched.length || 0}</div>
              <div style={{ color: '#666' }}>{isAr ? 'متطابقة' : 'Matched'}</div>
            </div>
            <div style={{ background: '#FFF3E0', borderRadius: 12, padding: '16px 32px' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#FF9800' }}>{unmatched.length || statementRows.length}</div>
              <div style={{ color: '#666' }}>{isAr ? 'غير متطابقة' : 'Unmatched'}</div>
            </div>
          </div>
          <button onClick={() => { setStep(1); setStatementRows([]); }} style={{ padding: '10px 32px', borderRadius: 8, background: '#2196F3', color: '#fff', border: 'none', cursor: 'pointer' }}>
            {isAr ? 'تسوية جديدة' : 'New Reconciliation'}
          </button>
        </div>
      )}
    </div>
  );
}
