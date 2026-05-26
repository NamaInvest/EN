'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface Account { id: number; name: string; code: string; }
interface Line {
  id: number;
  description: string;
  debit: number;
  credit: number;
  entry: {
    entryNumber: string;
    entryDate: string;
    reference: string;
  }
}
interface ReconSession {
  reconciliation: { id: number; systemBalance: number; statementBalance: number; difference: number };
  unclearedLines: Line[];
}

const formSchema = z.object({
  bankAccountId: z.string().min(1, 'Bank account is required'),
  statementDate: z.string().min(1, 'Statement date is required'),
  statementBalance: z.number()
});

type FormValues = z.infer<typeof formSchema>;

export default function BankReconciliationPage() {
  const { t } = useTranslation();
  const { error: toastError, success: toastSuccess } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [session, setSession] = useState<ReconSession | null>(null);
  const [selectedLines, setSelectedLines] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bankAccountId: '',
      statementDate: new Date().toISOString().split('T')[0],
      statementBalance: undefined
    }
  });

  useEffect(() => {
    fetch('/api/accounting/accounts')
      .then(res => res.json())
      .then((data: any) => {
        if (Array.isArray(data)) {
          setAccounts(data.filter(a => a.code.startsWith('112') && a.level > 1));
        } else {
          console.error("Failed to load accounts:", data);
          toastError(data?.error || 'حدث خطأ في جلب الحسابات');
        }
      })
      .catch(e => {
        console.error("Error fetching accounts:", e);
        toastError('خطأ في الاتصال بالخادم');
      });
  }, []);

  const startReconciliation = async (data: FormValues) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/finance/reconciliations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const resData = await res.json();
        setSession(resData);
        setSelectedLines(new Set());
      } else {
        const err = await res.json();
        toastError(t('sys.str_2720') + ' ' + (err.error || ''));
      }
    } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
    setLoading(false);
  };

  const toggleLine = (id: number) => {
    const newSet = new Set(selectedLines);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedLines(newSet);
  };

  const submitReconciliation = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/finance/reconciliations/${session.reconciliation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reconciledLineIds: Array.from(selectedLines) })
      });
      if (res.ok) {
        toastSuccess(t('sys.str_2721'));
        setSession(null);
      } else {
        toastError(t('stock.str_2638'));
      }
    } catch (e) {
      toastError('حدث خطأ أثناء الاتصال بالخادم');
    }
    setLoading(false);
  };

  const clearedDebit = session?.unclearedLines.filter(l => selectedLines.has(l.id)).reduce((acc, l) => acc + l.debit, 0) || 0;
  const clearedCredit = session?.unclearedLines.filter(l => selectedLines.has(l.id)).reduce((acc, l) => acc + l.credit, 0) || 0;
  const netCleared = clearedDebit - clearedCredit; 
  
  const isMatched = session?.reconciliation.difference === netCleared; 

  return (<>
    <div className="page-header"><h1 className="page-title">{t('sys.str_2704')}</h1></div>
    
    {!session ? (
      <div className="card animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', padding: '30px' }}>
        <h2>{t('sys.str_2705')}</h2>
        <form onSubmit={handleSubmit(startReconciliation)} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
          <div className="input-group">
            <label className="input-label">{t('sys.str_2706')}</label>
            <select className={`input ${errors.bankAccountId ? 'border-red-500' : ''}`} {...register('bankAccountId')}>
              <option value="">{t('sys.str_2707')}</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
            </select>
            {errors.bankAccountId && <span className="text-red-500 text-xs mt-1">{errors.bankAccountId.message}</span>}
          </div>
          <div className="input-group">
            <label className="input-label">{t('sys.str_2708')}</label>
            <input type="date" className={`input ${errors.statementDate ? 'border-red-500' : ''}`} {...register('statementDate')} />
            {errors.statementDate && <span className="text-red-500 text-xs mt-1">{errors.statementDate.message}</span>}
          </div>
          <div className="input-group">
            <label className="input-label">{t('sys.str_2709')}</label>
            <input type="number" step="0.01" className={`input ${errors.statementBalance ? 'border-red-500' : ''}`} {...register('statementBalance', { valueAsNumber: true })} />
            {errors.statementBalance && <span className="text-red-500 text-xs mt-1">{errors.statementBalance.message}</span>}
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '10px' }}>
            {loading ? t('sys.str_168') : t('sys.str_2722')}
          </button>
        </form>
      </div>
    ) : (
      <div className="animate-fade-in">
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <div className="card" style={{ flex: 1, backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{t('sys.str_2710')}</div>
            <h2 style={{ margin: '5px 0 0 0' }}>{session.reconciliation.systemBalance.toLocaleString()} {t('sys.str_68')}</h2>
          </div>
          <div className="card" style={{ flex: 1, backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{t('sys.str_2711')}</div>
            <h2 style={{ margin: '5px 0 0 0' }}>{session.reconciliation.statementBalance.toLocaleString()} {t('sys.str_68')}</h2>
          </div>
          <div className="card" style={{ flex: 1, backgroundColor: isMatched ? '#10b98115' : 'var(--bg)', border: `1px solid ${isMatched ? '#10b981' : 'var(--border)'}` }}>
            <div style={{ color: isMatched ? '#10b981' : 'var(--text-muted)', fontSize: '13px' }}>{t('sys.str_2712')}</div>
            <h2 style={{ margin: '5px 0 0 0', color: isMatched ? '#10b981' : 'var(--text)' }}>
              {Math.abs(session.reconciliation.difference - netCleared).toLocaleString()} {t('sys.str_68')}</h2>
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>{t('sys.str_2713')}</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setSession(null)} className="btn btn-ghost">{t('fin.str_206')}</button>
              <button onClick={submitReconciliation} className="btn btn-primary" disabled={loading}>
                {t('sys.str_2714')} {selectedLines.size} {t('sys.str_2224')}</button>
            </div>
          </div>
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>{t('sys.str_2715')}</th>
                <th>{t('fin.str_233')}</th>
                <th>{t('sys.str_2716')}</th>
                <th>{t('sys.str_2717')}</th>
                <th>{t('sys.str_2718')}</th>
              </tr>
            </thead>
            <tbody>
              {session.unclearedLines.length === 0 ? <tr><td colSpan={6} style={{ textAlign:'center', padding:'20px' }}>{t('sys.str_2719')}</td></tr> : null}
              {session.unclearedLines.map(line => (
                <tr key={line.id} style={{ backgroundColor: selectedLines.has(line.id) ? '#3b82f610' : 'transparent', cursor: 'pointer' }} onClick={() => toggleLine(line.id)}>
                  <td>
                    <input type="checkbox" checked={selectedLines.has(line.id)} readOnly style={{ width: '18px', height: '18px' }} />
                  </td>
                  <td>{line.entry.entryDate}</td>
                  <td><strong>{line.entry.entryNumber}</strong></td>
                  <td>{line.description || line.entry.reference}</td>
                  <td style={{ color: '#10b981', fontWeight: 'bold' }}>{line.debit > 0 ? line.debit.toLocaleString() : '-'}</td>
                  <td style={{ color: '#ef4444', fontWeight: 'bold' }}>{line.credit > 0 ? line.credit.toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </>);
}
