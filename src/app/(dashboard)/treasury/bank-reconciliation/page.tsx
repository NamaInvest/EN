'use client';
import { useState, useEffect } from 'react';

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

export default function BankReconciliationPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [form, setForm] = useState({ bankAccountId: '', statementDate: new Date().toISOString().split('T')[0], statementBalance: '' });
    const [session, setSession] = useState<ReconSession | null>(null);
    const [selectedLines, setSelectedLines] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch bank accounts (accounts ending in specific code or having bank subtype)
        // For NamaSoft, usually '1120' is banks, so let's fetch descendants
        fetch('/api/accounting/accounts')
            .then(res => res.json())
            .then((data: any[]) => setAccounts(data.filter(a => a.code.startsWith('112') && a.level > 1)));
    }, []);

    const startReconciliation = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/finance/reconciliations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                const data = await res.json();
                setSession(data);
                setSelectedLines(new Set());
            } else {
                const err = await res.json();
                alert('فشل بدء المطابقة: ' + err.error);
            }
        } catch (e) { console.error(e); }
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
                alert('تمت المطابقة والتسوية بنجاح!');
                setSession(null);
            } else {
                alert('فشل حفظ التسوية');
            }
        } catch (e) {}
        setLoading(false);
    };

    // Calculate cleared balance difference
    const clearedDebit = session?.unclearedLines.filter(l => selectedLines.has(l.id)).reduce((acc, l) => acc + l.debit, 0) || 0;
    const clearedCredit = session?.unclearedLines.filter(l => selectedLines.has(l.id)).reduce((acc, l) => acc + l.credit, 0) || 0;
    const netCleared = clearedDebit - clearedCredit; 
    
    // In NamaSoft, bank is Asset (Debit positive).
    // Statement Balance minus (System Balance - Cleared Uncleared) = 0 if matched
    const isMatched = session?.reconciliation.difference === netCleared; 

    return (<>
        <div className="page-header"><h1 className="page-title">🏦 التسويات البنكية (Bank Reconciliation)</h1></div>
        
        {!session ? (
            <div className="card animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', padding: '30px' }}>
                <h2>بدء مطابقة جديدة</h2>
                <form onSubmit={startReconciliation} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                    <div className="input-group">
                        <label className="input-label">حساب البنك</label>
                        <select className="input" required value={form.bankAccountId} onChange={e => setForm({...form, bankAccountId: e.target.value})}>
                            <option value="">اختر حساب البنك...</option>
                            {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                        </select>
                    </div>
                    <div className="input-group">
                        <label className="input-label">تاريخ كشف الحساب (نهاية المدة)</label>
                        <input type="date" className="input" required value={form.statementDate} onChange={e => setForm({...form, statementDate: e.target.value})} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">الرصيد الفعلي في كشف الحساب (ر.س)</label>
                        <input type="number" step="0.01" className="input" required value={form.statementBalance} onChange={e => setForm({...form, statementBalance: e.target.value})} />
                    </div>
                    <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '10px' }}>
                        {loading ? 'جاري التحميل...' : '⬅️ بدء المطابقة واستدعاء الحركات'}
                    </button>
                </form>
            </div>
        ) : (
            <div className="animate-fade-in">
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                     <div className="card" style={{ flex: 1, backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>الرصيد الدفتري للنظام</div>
                        <h2 style={{ margin: '5px 0 0 0' }}>{session.reconciliation.systemBalance.toLocaleString()} ر.س</h2>
                     </div>
                     <div className="card" style={{ flex: 1, backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>رصيد كشف الحساب البنكي</div>
                        <h2 style={{ margin: '5px 0 0 0' }}>{session.reconciliation.statementBalance.toLocaleString()} ر.س</h2>
                     </div>
                     <div className="card" style={{ flex: 1, backgroundColor: isMatched ? '#10b98115' : 'var(--bg)', border: `1px solid ${isMatched ? '#10b981' : 'var(--border)'}` }}>
                        <div style={{ color: isMatched ? '#10b981' : 'var(--text-muted)', fontSize: '13px' }}>الفارق الفعلي للمطابقة</div>
                        <h2 style={{ margin: '5px 0 0 0', color: isMatched ? '#10b981' : 'var(--text)' }}>
                            {Math.abs(session.reconciliation.difference - netCleared).toLocaleString()} ر.س
                        </h2>
                     </div>
                </div>

                <div className="card" style={{ padding: 0 }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>الحركات المعلقة والمطابقة (Uncleared Items)</h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                             <button onClick={() => setSession(null)} className="btn btn-ghost">إلغاء</button>
                             <button onClick={submitReconciliation} className="btn btn-primary" disabled={loading}>
                                 ✅ تأكيد التسوية ({selectedLines.size} عنصر)
                             </button>
                        </div>
                    </div>
                    <table className="table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}></th>
                                <th>تاريخ القيد</th>
                                <th>رقم القيد</th>
                                <th>البيان والتفاصيل</th>
                                <th>مدين (إيداع)</th>
                                <th>دائن (سحب)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {session.unclearedLines.length === 0 ? <tr><td colSpan={6} style={{ textAlign:'center', padding:'20px' }}>لا توجد حركات معلقة للتسوية</td></tr> : null}
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
