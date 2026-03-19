'use client';
import { useState, useEffect, useCallback } from 'react';

type Tab = 'tree' | 'journal' | 'ledger' | 'trial' | 'income' | 'balance';

interface Account { id: number; code: string; name: string; nameEn: string; type: string; level: number; balance: number; isActive: boolean; }
interface JournalLine { id: number; accountId: number; description: string; debit: number; credit: number; account: { code: string; name: string; type: string } }
interface JournalEntry { id: number; entryNumber: string; entryDate: string; description: string; reference: string; totalDebit: number; totalCredit: number; status: string; lines: JournalLine[] }
interface LedgerLine { id: number; date: string; entryNumber: string; description: string; debit: number; credit: number; balance: number }
interface TrialRow { id: number; code: string; name: string; type: string; level: number; totalDebit: number; totalCredit: number; debitBalance: number; creditBalance: number }
interface StatementItem { code: string; name: string; amount: number }
interface BSItem { code: string; name: string; level: number; balance: number }

const TYPE_LABELS: Record<string, string> = { asset: 'أصول', liability: 'خصوم', equity: 'ملكية', revenue: 'إيرادات', expense: 'مصروفات' };
const TYPE_COLORS: Record<string, string> = { asset: '#22c55e', liability: '#ef4444', equity: '#8b5cf6', revenue: '#3b82f6', expense: '#f59e0b' };

export default function AccountingPage() {
    const [tab, setTab] = useState<Tab>('tree');
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [journals, setJournals] = useState<JournalEntry[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<number>(0);
    const [ledgerData, setLedgerData] = useState<{ account: Account; lines: LedgerLine[]; totalDebit: number; totalCredit: number; closingBalance: number } | null>(null);
    const [trialData, setTrialData] = useState<{ rows: TrialRow[]; grandTotalDebit: number; grandTotalCredit: number; isBalanced: boolean } | null>(null);
    const [incomeData, setIncomeData] = useState<{ revenue: { items: StatementItem[]; total: number }; expenses: { items: StatementItem[]; total: number }; netProfit: number } | null>(null);
    const [balanceData, setBalanceData] = useState<{ assets: { items: BSItem[]; total: number }; liabilities: { items: BSItem[]; total: number }; equity: { items: BSItem[]; total: number }; isBalanced: boolean } | null>(null);
    const [loading, setLoading] = useState(false);
    const [showAddAccount, setShowAddAccount] = useState(false);
    const [showAddJournal, setShowAddJournal] = useState(false);
    const [newAccount, setNewAccount] = useState({ code: '', name: '', type: 'asset', level: 1 });
    const [journalLines, setJournalLines] = useState([{ accountCode: '', debit: 0, credit: 0, description: '' }, { accountCode: '', debit: 0, credit: 0, description: '' }]);
    const [journalDesc, setJournalDesc] = useState('');
    const [expandedEntry, setExpandedEntry] = useState<number | null>(null);

    // Load accounts
    const loadAccounts = useCallback(async () => {
        try {
            const res = await fetch('/api/accounting/accounts');
            if (res.ok) setAccounts(await res.json());
        } catch (e) { console.error(e); }
    }, []);

    // Load data based on tab
    useEffect(() => {
        if (tab === 'tree') loadAccounts();
        if (tab === 'journal') loadJournals();
        if (tab === 'trial') loadTrialBalance();
        if (tab === 'income') loadIncomeStatement();
        if (tab === 'balance') loadBalanceSheet();
    }, [tab, loadAccounts]);

    async function loadJournals() {
        setLoading(true);
        try { const r = await fetch('/api/accounting/journal'); if (r.ok) setJournals(await r.json()); } catch (e) { console.error(e); }
        setLoading(false);
    };

    const loadLedger = async (accountId: number) => {
        setLoading(true);
        setSelectedAccount(accountId);
        try { const r = await fetch(`/api/accounting/ledger?accountId=${accountId}`); if (r.ok) setLedgerData(await r.json()); } catch (e) { console.error(e); }
        setLoading(false);
    };

    async function loadTrialBalance() {
        setLoading(true);
        try { const r = await fetch('/api/accounting/trial-balance'); if (r.ok) setTrialData(await r.json()); } catch (e) { console.error(e); }
        setLoading(false);
    };

    async function loadIncomeStatement() {
        setLoading(true);
        try { const r = await fetch('/api/accounting/income-statement'); if (r.ok) setIncomeData(await r.json()); } catch (e) { console.error(e); }
        setLoading(false);
    };

    async function loadBalanceSheet() {
        setLoading(true);
        try { const r = await fetch('/api/accounting/balance-sheet'); if (r.ok) setBalanceData(await r.json()); } catch (e) { console.error(e); }
        setLoading(false);
    };

    // Add account
    const handleAddAccount = async () => {
        const res = await fetch('/api/accounting/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newAccount) });
        if (res.ok) { setShowAddAccount(false); setNewAccount({ code: '', name: '', type: 'asset', level: 1 }); loadAccounts(); }
        else { const e = await res.json(); alert(e.error); }
    };

    const handleInitAccounts = async () => {
        if (!confirm('سيتم إضافة الدليل المحاسبي الافتراضي. هل تريد المتابعة؟')) return;
        setLoading(true);
        const res = await fetch('/api/accounting/accounts/init', { method: 'POST' });
        if (res.ok) {
            const data = await res.json();
            alert(data.message);
            loadAccounts();
        } else {
            alert('فشل تهيئة الحسابات');
        }
        setLoading(false);
    };

    // Add journal entry
    const handleAddJournal = async () => {
        const totalD = journalLines.reduce((s, l) => s + l.debit, 0);
        const totalC = journalLines.reduce((s, l) => s + l.credit, 0);
        if (Math.abs(totalD - totalC) > 0.01) { alert(`القيد غير متوازن: مدين ${totalD} ≠ دائن ${totalC}`); return; }
        const res = await fetch('/api/accounting/journal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description: journalDesc, lines: journalLines.filter(l => l.debit > 0 || l.credit > 0) }) });
        if (res.ok) { setShowAddJournal(false); setJournalDesc(''); setJournalLines([{ accountCode: '', debit: 0, credit: 0, description: '' }, { accountCode: '', debit: 0, credit: 0, description: '' }]); loadJournals(); }
        else { const e = await res.json(); alert(e.error); }
    };

    const fmt = (n: number) => n.toLocaleString('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const tabs: { key: Tab; label: string; icon: string }[] = [
        { key: 'tree', label: 'شجرة الحسابات', icon: '🌳' },
        { key: 'journal', label: 'القيود اليومية', icon: '📋' },
        { key: 'ledger', label: 'دفتر الأستاذ', icon: '📒' },
        { key: 'trial', label: 'ميزان المراجعة', icon: '⚖️' },
        { key: 'income', label: 'قائمة الدخل', icon: '📊' },
        { key: 'balance', label: 'الميزانية', icon: '🏦' },
    ];

    return (<><div className="page-header"><h1 className="page-title">📊 المحاسبة</h1></div>
        <div className="page-content animate-fade-in">
            {/* Tabs */}
            <div className="tabs" style={{ flexWrap: 'wrap', gap: '4px' }}>
                {tabs.map(t => (
                    <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* ===== شجرة الحسابات ===== */}
            {tab === 'tree' && (
                <div className="card">
                    <div className="toolbar">
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{accounts.length} حساب</span>
                        <div className="toolbar-spacer" />
                        {accounts.length === 0 && (
                            <button className="btn btn-sm" style={{ background: '#3b82f620', color: '#3b82f6' }} onClick={handleInitAccounts} disabled={loading}>
                                🔄 تهيئة الدليل الافتراضي
                            </button>
                        )}
                        <button className="btn btn-primary btn-sm" onClick={() => setShowAddAccount(true)}>➕ حساب جديد</button>
                    </div>
                    {showAddAccount && (
                        <div style={{ padding: '16px', background: 'rgba(108,99,255,0.05)', borderRadius: '8px', marginBottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                            <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>الكود</label><input value={newAccount.code} onChange={e => setNewAccount({ ...newAccount, code: e.target.value })} placeholder="1110" style={{ width: '80px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }} /></div>
                            <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>الاسم</label><input value={newAccount.name} onChange={e => setNewAccount({ ...newAccount, name: e.target.value })} placeholder="اسم الحساب" style={{ width: '180px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }} /></div>
                            <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>النوع</label>
                                <select value={newAccount.type} onChange={e => setNewAccount({ ...newAccount, type: e.target.value })} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                    <option value="asset">أصول</option><option value="liability">خصوم</option><option value="equity">ملكية</option><option value="revenue">إيرادات</option><option value="expense">مصروفات</option>
                                </select>
                            </div>
                            <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>المستوى</label><input type="number" value={newAccount.level} onChange={e => setNewAccount({ ...newAccount, level: parseInt(e.target.value) })} min={0} max={3} style={{ width: '60px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }} /></div>
                            <button className="btn btn-primary btn-sm" onClick={handleAddAccount}>حفظ</button>
                            <button className="btn btn-sm" onClick={() => setShowAddAccount(false)}>إلغاء</button>
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        {accounts.map(a => (
                            <div key={a.id} onClick={() => { setSelectedAccount(a.id); setTab('ledger'); loadLedger(a.id); }}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', paddingRight: `${14 + a.level * 28}px`, background: a.level === 0 ? 'rgba(108,99,255,0.06)' : 'transparent', borderRadius: '6px', fontWeight: a.level === 0 ? '700' : '400', fontSize: a.level === 0 ? '15px' : '13px', cursor: a.level > 0 ? 'pointer' : 'default', transition: 'background 0.2s' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'monospace', minWidth: '50px' }}>{a.code}</span>
                                <span style={{ flex: 1 }}>{a.level > 0 ? '└─ ' : ''}{a.name}</span>
                                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: TYPE_COLORS[a.type] + '20', color: TYPE_COLORS[a.type] }}>{TYPE_LABELS[a.type]}</span>
                                {a.balance !== 0 && <span style={{ fontSize: '12px', fontFamily: 'monospace', color: a.balance >= 0 ? '#22c55e' : '#ef4444' }}>{fmt(a.balance)}</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ===== القيود اليومية ===== */}
            {tab === 'journal' && (
                <div>
                    <div className="toolbar">
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{journals.length} قيد</span>
                        <div className="toolbar-spacer" />
                        <button className="btn btn-primary" onClick={() => setShowAddJournal(true)}>➕ قيد يدوي</button>
                    </div>
                    {showAddJournal && (
                        <div className="card" style={{ marginBottom: '16px' }}>
                            <h3 style={{ marginBottom: '12px' }}>📋 قيد جديد</h3>
                            <input value={journalDesc} onChange={e => setJournalDesc(e.target.value)} placeholder="وصف القيد" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', marginBottom: '12px' }} />
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead><tr style={{ background: 'rgba(108,99,255,0.05)' }}>
                                    <th style={{ padding: '8px', textAlign: 'right' }}>كود الحساب</th><th style={{ padding: '8px', textAlign: 'right' }}>الوصف</th>
                                    <th style={{ padding: '8px', textAlign: 'right' }}>مدين</th><th style={{ padding: '8px', textAlign: 'right' }}>دائن</th><th></th>
                                </tr></thead>
                                <tbody>{journalLines.map((l, i) => (
                                    <tr key={i}>
                                        <td style={{ padding: '4px' }}><input value={l.accountCode} onChange={e => { const nl = [...journalLines]; nl[i].accountCode = e.target.value; setJournalLines(nl); }} placeholder="1110" style={{ width: '80px', padding: '6px', borderRadius: '4px', border: '1px solid var(--border)' }} /></td>
                                        <td style={{ padding: '4px' }}><input value={l.description} onChange={e => { const nl = [...journalLines]; nl[i].description = e.target.value; setJournalLines(nl); }} placeholder="بيان" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border)' }} /></td>
                                        <td style={{ padding: '4px' }}><input type="number" value={l.debit || ''} onChange={e => { const nl = [...journalLines]; nl[i].debit = parseFloat(e.target.value) || 0; setJournalLines(nl); }} style={{ width: '100px', padding: '6px', borderRadius: '4px', border: '1px solid var(--border)' }} /></td>
                                        <td style={{ padding: '4px' }}><input type="number" value={l.credit || ''} onChange={e => { const nl = [...journalLines]; nl[i].credit = parseFloat(e.target.value) || 0; setJournalLines(nl); }} style={{ width: '100px', padding: '6px', borderRadius: '4px', border: '1px solid var(--border)' }} /></td>
                                        <td style={{ padding: '4px' }}><button onClick={() => setJournalLines(journalLines.filter((_, j) => j !== i))} style={{ color: '#ef4444', cursor: 'pointer', background: 'none', border: 'none' }}>✕</button></td>
                                    </tr>
                                ))}
                                    <tr style={{ background: 'rgba(108,99,255,0.05)', fontWeight: 'bold' }}>
                                        <td colSpan={2} style={{ padding: '8px', textAlign: 'right' }}>الإجمالي</td>
                                        <td style={{ padding: '8px' }}>{fmt(journalLines.reduce((s, l) => s + l.debit, 0))}</td>
                                        <td style={{ padding: '8px' }}>{fmt(journalLines.reduce((s, l) => s + l.credit, 0))}</td>
                                        <td></td>
                                    </tr></tbody>
                            </table>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                <button className="btn btn-sm" onClick={() => setJournalLines([...journalLines, { accountCode: '', debit: 0, credit: 0, description: '' }])}>➕ سطر</button>
                                <div className="toolbar-spacer" />
                                <button className="btn btn-sm" onClick={() => setShowAddJournal(false)}>إلغاء</button>
                                <button className="btn btn-primary btn-sm" onClick={handleAddJournal}>✅ حفظ القيد</button>
                            </div>
                        </div>
                    )}
                    {loading ? <div className="card"><div className="empty-state"><div className="empty-state-text">جاري التحميل...</div></div></div> :
                        journals.length === 0 ? <div className="card"><div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-text">لا توجد قيود يومية<br /><small>ستظهر القيود تلقائياً عند إصدار الفواتير</small></div></div></div> :
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {journals.map(j => (
                                    <div key={j.id} className="card" style={{ padding: '12px', cursor: 'pointer' }} onClick={() => setExpandedEntry(expandedEntry === j.id ? null : j.id)}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                            <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--primary)' }}>{j.entryNumber}</span>
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{j.entryDate}</span>
                                            <span style={{ flex: 1 }}>{j.description}</span>
                                            {j.reference && <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(108,99,255,0.1)' }}>{j.reference}</span>}
                                            <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>{fmt(j.totalDebit)}</span>
                                        </div>
                                        {expandedEntry === j.id && (
                                            <table style={{ width: '100%', marginTop: '12px', borderCollapse: 'collapse' }}>
                                                <thead><tr style={{ background: 'rgba(108,99,255,0.05)', fontSize: '12px' }}><th style={{ padding: '6px', textAlign: 'right' }}>الحساب</th><th style={{ padding: '6px', textAlign: 'right' }}>البيان</th><th style={{ padding: '6px', textAlign: 'right' }}>مدين</th><th style={{ padding: '6px', textAlign: 'right' }}>دائن</th></tr></thead>
                                                <tbody>{j.lines.map(l => (
                                                    <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                        <td style={{ padding: '6px', fontSize: '12px' }}><span style={{ fontFamily: 'monospace' }}>{l.account.code}</span> {l.account.name}</td>
                                                        <td style={{ padding: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>{l.description}</td>
                                                        <td style={{ padding: '6px', fontFamily: 'monospace', color: l.debit > 0 ? '#22c55e' : 'var(--text-muted)' }}>{l.debit > 0 ? fmt(l.debit) : '-'}</td>
                                                        <td style={{ padding: '6px', fontFamily: 'monospace', color: l.credit > 0 ? '#ef4444' : 'var(--text-muted)' }}>{l.credit > 0 ? fmt(l.credit) : '-'}</td>
                                                    </tr>
                                                ))}</tbody>
                                            </table>
                                        )}
                                    </div>
                                ))}
                            </div>
                    }
                </div>
            )}

            {/* ===== دفتر الأستاذ ===== */}
            {tab === 'ledger' && (
                <div>
                    <div className="toolbar" style={{ marginBottom: '12px' }}>
                        <select value={selectedAccount} onChange={e => loadLedger(parseInt(e.target.value))} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', minWidth: '250px' }}>
                            <option value={0}>اختر حساباً...</option>
                            {accounts.filter(a => a.level > 0).map(a => (<option key={a.id} value={a.id}>{a.code} - {a.name}</option>))}
                        </select>
                    </div>
                    {loading ? <div className="card"><div className="empty-state"><div className="empty-state-text">جاري التحميل...</div></div></div> :
                        !ledgerData ? <div className="card"><div className="empty-state"><div className="empty-state-icon">📒</div><div className="empty-state-text">اختر حساباً لعرض حركاته</div></div></div> :
                            <div className="card">
                                <h3 style={{ marginBottom: '12px' }}>{ledgerData.account.code} - {ledgerData.account.name}</h3>
                                {ledgerData.lines.length === 0 ? <div className="empty-state"><div className="empty-state-text">لا توجد حركات لهذا الحساب</div></div> :
                                    <><table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead><tr style={{ background: 'rgba(108,99,255,0.05)', fontSize: '12px' }}>
                                            <th style={{ padding: '8px', textAlign: 'right' }}>التاريخ</th><th style={{ padding: '8px', textAlign: 'right' }}>رقم القيد</th><th style={{ padding: '8px', textAlign: 'right' }}>البيان</th>
                                            <th style={{ padding: '8px', textAlign: 'right' }}>مدين</th><th style={{ padding: '8px', textAlign: 'right' }}>دائن</th><th style={{ padding: '8px', textAlign: 'right' }}>الرصيد</th>
                                        </tr></thead>
                                        <tbody>{ledgerData.lines.map(l => (
                                            <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '8px', fontSize: '12px' }}>{l.date}</td>
                                                <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '12px' }}>{l.entryNumber}</td>
                                                <td style={{ padding: '8px', fontSize: '12px' }}>{l.description}</td>
                                                <td style={{ padding: '8px', fontFamily: 'monospace', color: l.debit > 0 ? '#22c55e' : 'var(--text-muted)' }}>{l.debit > 0 ? fmt(l.debit) : '-'}</td>
                                                <td style={{ padding: '8px', fontFamily: 'monospace', color: l.credit > 0 ? '#ef4444' : 'var(--text-muted)' }}>{l.credit > 0 ? fmt(l.credit) : '-'}</td>
                                                <td style={{ padding: '8px', fontFamily: 'monospace', fontWeight: 'bold', color: l.balance >= 0 ? '#22c55e' : '#ef4444' }}>{fmt(l.balance)}</td>
                                            </tr>
                                        ))}</tbody>
                                    </table>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(108,99,255,0.05)', borderRadius: '6px', marginTop: '12px', fontWeight: 'bold' }}>
                                            <span>إجمالي مدين: {fmt(ledgerData.totalDebit)}</span>
                                            <span>إجمالي دائن: {fmt(ledgerData.totalCredit)}</span>
                                            <span>الرصيد: <span style={{ color: ledgerData.closingBalance >= 0 ? '#22c55e' : '#ef4444' }}>{fmt(ledgerData.closingBalance)}</span></span>
                                        </div></>}
                            </div>}
                </div>
            )}

            {/* ===== ميزان المراجعة ===== */}
            {tab === 'trial' && (
                <div className="card">
                    {loading ? <div className="empty-state"><div className="empty-state-text">جاري التحميل...</div></div> :
                        !trialData ? <div className="empty-state"><div className="empty-state-icon">⚖️</div><div className="empty-state-text">لا توجد بيانات</div></div> :
                            <><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3>⚖️ ميزان المراجعة</h3>
                                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '13px', background: trialData.isBalanced ? '#22c55e20' : '#ef444420', color: trialData.isBalanced ? '#22c55e' : '#ef4444' }}>
                                    {trialData.isBalanced ? '✅ متوازن' : '⚠️ غير متوازن'}
                                </span>
                            </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead><tr style={{ background: 'rgba(108,99,255,0.05)' }}><th style={{ padding: '8px', textAlign: 'right' }}>الكود</th><th style={{ padding: '8px', textAlign: 'right' }}>الحساب</th><th style={{ padding: '8px', textAlign: 'right' }}>رصيد مدين</th><th style={{ padding: '8px', textAlign: 'right' }}>رصيد دائن</th></tr></thead>
                                    <tbody>{trialData.rows.map(r => (
                                        <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '12px' }}>{r.code}</td>
                                            <td style={{ padding: '8px' }}>{r.name}</td>
                                            <td style={{ padding: '8px', fontFamily: 'monospace', color: r.debitBalance > 0 ? '#22c55e' : 'var(--text-muted)' }}>{r.debitBalance > 0 ? fmt(r.debitBalance) : '-'}</td>
                                            <td style={{ padding: '8px', fontFamily: 'monospace', color: r.creditBalance > 0 ? '#ef4444' : 'var(--text-muted)' }}>{r.creditBalance > 0 ? fmt(r.creditBalance) : '-'}</td>
                                        </tr>
                                    ))}
                                        <tr style={{ background: 'rgba(108,99,255,0.08)', fontWeight: 'bold' }}>
                                            <td colSpan={2} style={{ padding: '10px' }}>الإجمالي</td>
                                            <td style={{ padding: '10px', fontFamily: 'monospace' }}>{fmt(trialData.grandTotalDebit)}</td>
                                            <td style={{ padding: '10px', fontFamily: 'monospace' }}>{fmt(trialData.grandTotalCredit)}</td>
                                        </tr></tbody>
                                </table></>}
                </div>
            )}

            {/* ===== قائمة الدخل ===== */}
            {tab === 'income' && (
                <div className="card">
                    {loading ? <div className="empty-state"><div className="empty-state-text">جاري التحميل...</div></div> :
                        !incomeData ? <div className="empty-state"><div className="empty-state-icon">📊</div><div className="empty-state-text">لا توجد بيانات</div></div> :
                            <><h3 style={{ marginBottom: '16px' }}>📊 قائمة الدخل</h3>
                                <div style={{ background: '#3b82f610', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                                    <h4 style={{ color: '#3b82f6', marginBottom: '8px' }}>الإيرادات</h4>
                                    {incomeData.revenue.items.map((r, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', fontSize: '13px' }}>
                                            <span>{r.code} - {r.name}</span><span style={{ fontFamily: 'monospace' }}>{fmt(r.amount)}</span>
                                        </div>
                                    ))}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', fontWeight: 'bold', borderTop: '1px solid #3b82f630', marginTop: '8px' }}>
                                        <span>إجمالي الإيرادات</span><span style={{ fontFamily: 'monospace', color: '#3b82f6' }}>{fmt(incomeData.revenue.total)}</span>
                                    </div>
                                </div>
                                <div style={{ background: '#f59e0b10', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                                    <h4 style={{ color: '#f59e0b', marginBottom: '8px' }}>المصروفات</h4>
                                    {incomeData.expenses.items.map((e, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', fontSize: '13px' }}>
                                            <span>{e.code} - {e.name}</span><span style={{ fontFamily: 'monospace' }}>{fmt(e.amount)}</span>
                                        </div>
                                    ))}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', fontWeight: 'bold', borderTop: '1px solid #f59e0b30', marginTop: '8px' }}>
                                        <span>إجمالي المصروفات</span><span style={{ fontFamily: 'monospace', color: '#f59e0b' }}>{fmt(incomeData.expenses.total)}</span>
                                    </div>
                                </div>
                                <div style={{ background: incomeData.netProfit >= 0 ? '#22c55e15' : '#ef444415', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '14px', marginBottom: '4px' }}>{incomeData.netProfit >= 0 ? '✅ صافي الربح' : '⚠️ صافي الخسارة'}</div>
                                    <div style={{ fontSize: '28px', fontWeight: 'bold', fontFamily: 'monospace', color: incomeData.netProfit >= 0 ? '#22c55e' : '#ef4444' }}>{fmt(Math.abs(incomeData.netProfit))} ر.س</div>
                                </div></>}
                </div>
            )}

            {/* ===== الميزانية العمومية ===== */}
            {tab === 'balance' && (
                <div className="card">
                    {loading ? <div className="empty-state"><div className="empty-state-text">جاري التحميل...</div></div> :
                        !balanceData ? <div className="empty-state"><div className="empty-state-icon">🏦</div><div className="empty-state-text">لا توجد بيانات</div></div> :
                            <><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3>🏦 الميزانية العمومية</h3>
                                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '13px', background: balanceData.isBalanced ? '#22c55e20' : '#ef444420', color: balanceData.isBalanced ? '#22c55e' : '#ef4444' }}>
                                    {balanceData.isBalanced ? '✅ متوازنة' : '⚠️ غير متوازنة'}
                                </span>
                            </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div style={{ background: '#22c55e10', padding: '12px', borderRadius: '8px' }}>
                                        <h4 style={{ color: '#22c55e', marginBottom: '8px' }}>الأصول</h4>
                                        {balanceData.assets.items.map((a, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', fontSize: '13px' }}>
                                                <span>{a.code} - {a.name}</span><span style={{ fontFamily: 'monospace' }}>{fmt(a.balance)}</span>
                                            </div>
                                        ))}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', fontWeight: 'bold', borderTop: '2px solid #22c55e30', marginTop: '8px' }}>
                                            <span>إجمالي الأصول</span><span style={{ fontFamily: 'monospace', color: '#22c55e', fontSize: '16px' }}>{fmt(balanceData.assets.total)}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ background: '#ef444410', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                                            <h4 style={{ color: '#ef4444', marginBottom: '8px' }}>الخصوم</h4>
                                            {balanceData.liabilities.items.map((l, i) => (
                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', fontSize: '13px' }}>
                                                    <span>{l.code} - {l.name}</span><span style={{ fontFamily: 'monospace' }}>{fmt(l.balance)}</span>
                                                </div>
                                            ))}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', fontWeight: 'bold', borderTop: '1px solid #ef444430', marginTop: '8px' }}>
                                                <span>إجمالي الخصوم</span><span style={{ fontFamily: 'monospace', color: '#ef4444' }}>{fmt(balanceData.liabilities.total)}</span>
                                            </div>
                                        </div>
                                        <div style={{ background: '#8b5cf610', padding: '12px', borderRadius: '8px' }}>
                                            <h4 style={{ color: '#8b5cf6', marginBottom: '8px' }}>حقوق الملكية</h4>
                                            {balanceData.equity.items.map((e, i) => (
                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', fontSize: '13px' }}>
                                                    <span>{e.code} - {e.name}</span><span style={{ fontFamily: 'monospace' }}>{fmt(e.balance)}</span>
                                                </div>
                                            ))}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', fontWeight: 'bold', borderTop: '1px solid #8b5cf630', marginTop: '8px' }}>
                                                <span>إجمالي الملكية</span><span style={{ fontFamily: 'monospace', color: '#8b5cf6' }}>{fmt(balanceData.equity.total)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div></>}
                </div>
            )}

        </div></>);
}
