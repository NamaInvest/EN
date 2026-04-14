'use client';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

type Tab = 'tree' | 'journal' | 'ledger' | 'trial' | 'income' | 'balance' | 'cost_centers';

interface Account { id: number; code: string; name: string; nameEn: string; type: string; level: number; balance: number; isActive: boolean; parentId: number; }
interface JournalLine { id: number; accountId: number; costCenterId?: number; description: string; debit: number; credit: number; account: { code: string; name: string; type: string }; costCenter?: { name: string } }
interface JournalEntry { id: number; entryNumber: string; entryDate: string; description: string; reference: string; totalDebit: number; totalCredit: number; status: string; lines: JournalLine[] }
interface LedgerLine { id: number; date: string; entryNumber: string; description: string; debit: number; credit: number; balance: number }
interface TrialRow { id: number; code: string; name: string; type: string; level: number; totalDebit: number; totalCredit: number; debitBalance: number; creditBalance: number }
interface StatementItem { code: string; name: string; amount: number }
interface BSItem { code: string; name: string; level: number; balance: number }
interface CostCenter { id: number; code: string; name: string; isActive: boolean; }

const TYPE_LABELS: Record<string, string> = { asset: 'أصول', liability: 'خصوم', equity: 'ملكية', revenue: 'إيرادات', expense: 'مصروفات' };
const TYPE_COLORS: Record<string, string> = { asset: '#22c55e', liability: '#ef4444', equity: '#8b5cf6', revenue: '#3b82f6', expense: '#f59e0b' };

export default function AccountingPage() {
    const { t } = useTranslation();
    const { error: toastError, success: toastSuccess } = useToast();
    const [tab, setTab] = useState<Tab>('tree');
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [journals, setJournals] = useState<JournalEntry[]>([]);
    const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
    const [newCostCenter, setNewCostCenter] = useState({ code: '', name: '', isActive: true });
    const [selectedAccount, setSelectedAccount] = useState<number>(0);
    const [ledgerData, setLedgerData] = useState<{ account: Account; lines: LedgerLine[]; totalDebit: number; totalCredit: number; closingBalance: number } | null>(null);
    const [trialData, setTrialData] = useState<{ rows: TrialRow[]; grandTotalDebit: number; grandTotalCredit: number; isBalanced: boolean } | null>(null);
    const [incomeData, setIncomeData] = useState<{ revenue: { items: StatementItem[]; total: number }; expenses: { items: StatementItem[]; total: number }; netProfit: number } | null>(null);
    const [balanceData, setBalanceData] = useState<{ assets: { items: BSItem[]; total: number }; liabilities: { items: BSItem[]; total: number }; equity: { items: BSItem[]; total: number }; isBalanced: boolean } | null>(null);
    const [loading, setLoading] = useState(false);
    const [showAddAccount, setShowAddAccount] = useState(false);
    const [showAddJournal, setShowAddJournal] = useState(false);
    const [newAccount, setNewAccount] = useState({ code: '', name: '', type: 'asset', level: 1, parentId: 0 });
    const [expandedTreeNodes, setExpandedTreeNodes] = useState<Set<number>>(new Set());
    
    const [journalLines, setJournalLines] = useState([{ accountCode: '', costCenterId: 0, debit: 0, credit: 0, description: '' }, { accountCode: '', costCenterId: 0, debit: 0, credit: 0, description: '' }]);
    const [journalDesc, setJournalDesc] = useState('');
    const [expandedEntry, setExpandedEntry] = useState<number | null>(null);

    const toggleTreeNode = (id: number) => {
        const newSet = new Set(expandedTreeNodes);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedTreeNodes(newSet);
    };
    const loadAccounts = useCallback(async () => {
        try {
            const res = await fetch('/api/accounting/accounts');
            if (res.ok) setAccounts(await res.json());
        } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
    }, []);

    const loadCostCenters = useCallback(async () => {
        try { const res = await fetch('/api/accounting/cost-centers'); if (res.ok) setCostCenters(await res.json()); } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
    }, []);

    // Load data based on tab
    useEffect(() => {
        loadCostCenters();
        if (tab === 'tree') loadAccounts();
        if (tab === 'journal') loadJournals();
        if (tab === 'trial') loadTrialBalance();
        if (tab === 'income') loadIncomeStatement();
        if (tab === 'balance') loadBalanceSheet();
    }, [tab, loadAccounts, loadCostCenters]);

    async function loadJournals() {
        setLoading(true);
        try { const r = await fetch('/api/accounting/journal'); if (r.ok) setJournals(await r.json()); } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
        setLoading(false);
    };

    const loadLedger = async (accountId: number) => {
        setLoading(true);
        setSelectedAccount(accountId);
        try { const r = await fetch(`/api/accounting/ledger?accountId=${accountId}`); if (r.ok) setLedgerData(await r.json()); } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
        setLoading(false);
    };

    async function loadTrialBalance() {
        setLoading(true);
        try { 
            const r = await fetch('/api/accounting/trial-balance'); 
            if (r.ok) {
                const data = await r.json();
                if (data.accounts) {
                    const rows = data.accounts.map((acc: any) => ({
                        id: acc.id, code: acc.code, name: acc.name, type: acc.type, level: acc.level,
                        totalDebit: acc.periodDebit, totalCredit: acc.periodCredit,
                        debitBalance: acc.netBalance > 0 ? acc.netBalance : 0,
                        creditBalance: acc.netBalance < 0 ? Math.abs(acc.netBalance) : 0
                    })).filter((r: any) => r.debitBalance > 0 || r.creditBalance > 0);
                    
                    const grandTotalDebit = rows.reduce((s: number, r: any) => s + r.debitBalance, 0);
                    const grandTotalCredit = rows.reduce((s: number, r: any) => s + r.creditBalance, 0);
                    
                    setTrialData({ rows, grandTotalDebit, grandTotalCredit, isBalanced: Math.abs(grandTotalDebit - grandTotalCredit) < 0.01 });
                } else {
                    setTrialData(data);
                }
            } 
        } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
        setLoading(false);
    };

    async function loadIncomeStatement() {
        setLoading(true);
        try { const r = await fetch('/api/accounting/income-statement'); if (r.ok) setIncomeData(await r.json()); } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
        setLoading(false);
    };

    async function loadBalanceSheet() {
        setLoading(true);
        try { const r = await fetch('/api/accounting/balance-sheet'); if (r.ok) setBalanceData(await r.json()); } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
        setLoading(false);
    };

    const handleAddAccount = async () => {
        const res = await fetch('/api/accounting/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newAccount) });
        if (res.ok) { 
            setShowAddAccount(false); 
            setNewAccount({ code: '', name: '', type: 'asset', level: 1, parentId: 0 }); 
            loadAccounts(); 
        }
        else { const e = await res.json(); alert(e.error); }
    };

    const openAddSubAccount = (parentAcc: Account) => {
        const childrenCount = accounts.filter(a => a.parentId === parentAcc.id).length;
        const potentialCode = `${parentAcc.code}${(childrenCount + 1).toString().padStart(2, '0')}`;
        setNewAccount({
            code: potentialCode, name: '', type: parentAcc.type, 
            level: parentAcc.level + 1, parentId: parentAcc.id
        });
        setShowAddAccount(true);
        const newSet = new Set(expandedTreeNodes);
        newSet.add(parentAcc.id);
        setExpandedTreeNodes(newSet);
    };

    const handleInitAccounts = async () => {
        if (!confirm(t('fin.str_254'))) return;
        setLoading(true);
        const res = await fetch('/api/accounting/accounts/init', { method: 'POST' });
        if (res.ok) {
            const data = await res.json();
            alert(data.message);
            loadAccounts();
        } else {
            alert(t('fin.str_255'));
        }
        setLoading(false);
    };

    const handleAddCostCenter = async () => {
        const res = await fetch('/api/accounting/cost-centers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCostCenter) });
        if (res.ok) { setNewCostCenter({ code: '', name: '', isActive: true }); loadCostCenters(); }
        else { const e = await res.json(); alert(e.error || 'Failed'); }
    };

    // Add journal entry
    const handleAddJournal = async () => {
        const totalD = journalLines.reduce((s, l) => s + l.debit, 0);
        const totalC = journalLines.reduce((s, l) => s + l.credit, 0);
        if (Math.abs(totalD - totalC) > 0.01) { alert(`القيد غير متوازن: مدين ${totalD} ≠ دائن ${totalC}`); return; }
        const res = await fetch('/api/accounting/journal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description: journalDesc, lines: journalLines.filter(l => l.debit > 0 || l.credit > 0) }) });
        if (res.ok) { setShowAddJournal(false); setJournalDesc(''); setJournalLines([{ accountCode: '', costCenterId: 0, debit: 0, credit: 0, description: '' }, { accountCode: '', costCenterId: 0, debit: 0, credit: 0, description: '' }]); loadJournals(); }
        else { const e = await res.json(); alert(e.error); }
    };

    const fmt = (n: number) => n.toLocaleString('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const tabs: { key: Tab; label: string; icon: string }[] = [
        { key: 'tree', label: t('fin.str_256'), icon: '🌳' },
        { key: 'journal', label: t('fin.str_257'), icon: '📋' },
        { key: 'ledger', label: t('fin.str_258'), icon: '📒' },
        { key: 'trial', label: t('fin.str_259'), icon: '⚖️' },
        { key: 'income', label: t('fin.str_260'), icon: '📊' },
        { key: 'balance', label: t('fin.str_261'), icon: '🏦' },
        { key: 'cost_centers', label: t('fin.str_262'), icon: '🏢' },
    ];

    return (<><div className="page-header"><h1 className="page-title">{t('fin.str_192')}</h1></div>
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
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{accounts.length} {t('fin.str_193')}</span>
                        <div className="toolbar-spacer" />
                        {accounts.length === 0 && (
                            <button className="btn btn-sm" style={{ background: '#3b82f620', color: '#3b82f6' }} onClick={handleInitAccounts} disabled={loading}>
                                {t('fin.str_194')}</button>
                        )}
                        <button className="btn btn-primary btn-sm" onClick={() => setShowAddAccount(true)}>{t('fin.str_195')}</button>
                    </div>
                    {showAddAccount && (
                        <div style={{ padding: '16px', background: 'rgba(108,99,255,0.05)', borderRadius: '8px', marginBottom: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                            <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>{t('fin.str_196')}</label><input disabled value={accounts.find(a => a.id === newAccount.parentId)?.name || t('fin.str_263')} style={{ width: '120px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: '#eee' }} /></div>
                            <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>{t('fin.str_197')}</label><input value={newAccount.code} onChange={e => setNewAccount({ ...newAccount, code: e.target.value })} placeholder="1110" style={{ width: '80px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }} /></div>
                            <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>{t('fin.str_198')}</label><input value={newAccount.name} onChange={e => setNewAccount({ ...newAccount, name: e.target.value })} placeholder={t('fin.str_264')} style={{ width: '180px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }} /></div>
                            <div><label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>{t('fin.str_199')}</label>
                                <select disabled={newAccount.parentId > 0} value={newAccount.type} onChange={e => setNewAccount({ ...newAccount, type: e.target.value })} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: newAccount.parentId > 0 ? '#eee' : '#fff' }}>
                                    <option value="asset">{t('fin.str_200')}</option><option value="liability">{t('fin.str_201')}</option><option value="equity">{t('fin.str_202')}</option><option value="revenue">{t('fin.str_203')}</option><option value="expense">{t('fin.str_204')}</option>
                                </select>
                            </div>
                            <button className="btn btn-primary btn-sm" onClick={handleAddAccount}>{t('fin.str_205')}</button>
                            <button className="btn btn-sm" onClick={() => {setShowAddAccount(false); setNewAccount({ code: '', name: '', type: 'asset', level: 1, parentId: 0 });}}>{t('fin.str_206')}</button>
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                        {accounts.filter(a => a.parentId === 0).map(rootAcc => {
                            const renderNode = (acc: Account, indentStart: number) => {
                                const children = accounts.filter(child => child.parentId === acc.id);
                                const hasChildren = children.length > 0;
                                const isExpanded = expandedTreeNodes.has(acc.id);

                                const calculateRecursiveBalance = (nodeId: number): number => {
                                    const nAcc = accounts.find(a => a.id === nodeId);
                                    const nChilds = accounts.filter(a => a.parentId === nodeId);
                                    let bal = nAcc?.balance || 0;
                                    for (const c of nChilds) bal += calculateRecursiveBalance(c.id);
                                    return bal;
                                };
                                const rollup = calculateRecursiveBalance(acc.id);

                                return (
                                    <div key={acc.id} style={{ display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ 
                                            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', 
                                            paddingRight: `${14 + indentStart * 24}px`, 
                                            background: acc.level === 1 ? 'rgba(108,99,255,0.06)' : (hasChildren ? 'var(--bg-card-hover)' : 'var(--bg-card)'),
                                            borderBottom: '1px solid var(--border)', cursor: 'pointer',
                                            transition: 'background 0.2s'
                                        }} onClick={() => { if(hasChildren) toggleTreeNode(acc.id); else { setSelectedAccount(acc.id); setTab('ledger'); loadLedger(acc.id); } }}>
                                            <span style={{ width: '24px', textAlign: 'center', color: 'var(--primary)', fontSize: '14px' }} onClick={(e) => { e.stopPropagation(); toggleTreeNode(acc.id); }}>
                                                {hasChildren ? (isExpanded ? '▼' : '▶') : '•'}
                                            </span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'monospace', minWidth: '60px' }}>{acc.code}</span>
                                            <span style={{ flex: 1, fontWeight: hasChildren ? '700' : '500', fontSize: hasChildren ? '14px' : '13px' }}>
                                                {acc.name}
                                            </span>
                                            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: TYPE_COLORS[acc.type] + '20', color: TYPE_COLORS[acc.type] }}>
                                                {TYPE_LABELS[acc.type]}
                                            </span>
                                            <span style={{ fontSize: '13px', fontFamily: 'monospace', color: rollup >= 0 ? '#22c55e' : '#ef4444', minWidth: '80px', textAlign: 'left', fontWeight: hasChildren ? 'bold' : 'normal' }}>
                                                {rollup !== 0 ? fmt(rollup) : '-'}
                                            </span>
                                            <button className="btn btn-sm" style={{ padding: '4px 8px', fontSize: '11px', background: '#eef2ff', color: '#4f46e5' }} onClick={(e) => { e.stopPropagation(); openAddSubAccount(acc); }}>
                                                {t('fin.str_207')}</button>
                                        </div>
                                        {isExpanded && hasChildren && (
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                {children.map(c => renderNode(c, indentStart + 1))}
                                            </div>
                                        )}
                                    </div>
                                );
                            };
                            return renderNode(rootAcc, 0);
                        })}
                    </div>
                </div>
            )}

            {/* ===== القيود اليومية ===== */}
            {tab === 'journal' && (
                <div>
                    <div className="toolbar">
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{journals.length} {t('fin.str_208')}</span>
                        <div className="toolbar-spacer" />
                        <button className="btn btn-primary" onClick={() => setShowAddJournal(true)}>{t('fin.str_209')}</button>
                    </div>
                    {showAddJournal && (
                        <div className="card" style={{ marginBottom: '16px' }}>
                            <h3 style={{ marginBottom: '12px' }}>{t('fin.str_210')}</h3>
                            <input value={journalDesc} onChange={e => setJournalDesc(e.target.value)} placeholder={t('fin.str_265')} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', marginBottom: '12px' }} />
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead><tr style={{ background: 'rgba(108,99,255,0.05)' }}>
                                    <th style={{ padding: '8px', textAlign: 'right' }}>{t('fin.str_211')}</th><th style={{ padding: '8px', textAlign: 'right' }}>{t('fin.str_212')}</th><th style={{ padding: '8px', textAlign: 'right' }}>{t('fin.str_213')}</th>
                                    <th style={{ padding: '8px', textAlign: 'right' }}>{t('fin.str_214')}</th><th style={{ padding: '8px', textAlign: 'right' }}>{t('fin.str_215')}</th><th></th>
                                </tr></thead>
                                <tbody>{journalLines.map((l, i) => (
                                    <tr key={i}>
                                        <td style={{ padding: '4px' }}><input value={l.accountCode} onChange={e => { const nl = [...journalLines]; nl[i].accountCode = e.target.value; setJournalLines(nl); }} placeholder="1110" style={{ width: '80px', padding: '6px', borderRadius: '4px', border: '1px solid var(--border)' }} /></td>
                                        <td style={{ padding: '4px' }}><input value={l.description} onChange={e => { const nl = [...journalLines]; nl[i].description = e.target.value; setJournalLines(nl); }} placeholder={t('fin.str_266')} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border)' }} /></td>
                                        <td style={{ padding: '4px' }}>
                                            <select value={l.costCenterId || 0} onChange={e => { const nl = [...journalLines]; nl[i].costCenterId = parseInt(e.target.value); setJournalLines(nl); }} style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                                                <option value={0}>{t('fin.str_216')}</option>
                                                {costCenters.filter(c => c.isActive).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </td>
                                        <td style={{ padding: '4px' }}><input type="number" value={l.debit || ''} onChange={e => { const nl = [...journalLines]; nl[i].debit = parseFloat(e.target.value) || 0; setJournalLines(nl); }} style={{ width: '100px', padding: '6px', borderRadius: '4px', border: '1px solid var(--border)' }} /></td>
                                        <td style={{ padding: '4px' }}><input type="number" value={l.credit || ''} onChange={e => { const nl = [...journalLines]; nl[i].credit = parseFloat(e.target.value) || 0; setJournalLines(nl); }} style={{ width: '100px', padding: '6px', borderRadius: '4px', border: '1px solid var(--border)' }} /></td>
                                        <td style={{ padding: '4px' }}><button onClick={() => setJournalLines(journalLines.filter((_, j) => j !== i))} style={{ color: '#ef4444', cursor: 'pointer', background: 'none', border: 'none' }}>✕</button></td>
                                    </tr>
                                ))}
                                    <tr style={{ background: 'rgba(108,99,255,0.05)', fontWeight: 'bold' }}>
                                        <td colSpan={3} style={{ padding: '8px', textAlign: 'right' }}>{t('sys.str_66')}</td>
                                        <td style={{ padding: '8px' }}>{fmt(journalLines.reduce((s, l) => s + l.debit, 0))}</td>
                                        <td style={{ padding: '8px' }}>{fmt(journalLines.reduce((s, l) => s + l.credit, 0))}</td>
                                        <td></td>
                                    </tr></tbody>
                            </table>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                <button className="btn btn-sm" onClick={() => setJournalLines([...journalLines, { accountCode: '', costCenterId: 0, debit: 0, credit: 0, description: '' }])}>{t('fin.str_217')}</button>
                                <div className="toolbar-spacer" />
                                <button className="btn btn-sm" onClick={() => setShowAddJournal(false)}>{t('fin.str_206')}</button>
                                <button className="btn btn-primary btn-sm" onClick={handleAddJournal}>{t('fin.str_218')}</button>
                            </div>
                        </div>
                    )}
                    {loading ? <div className="card"><div className="empty-state"><div className="empty-state-text">{t('sys.str_168')}</div></div></div> :
                        journals.length === 0 ? <div className="card"><div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-text">{t('fin.str_219')}<br /><small>{t('fin.str_220')}</small></div></div></div> :
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
                                                <thead><tr style={{ background: 'rgba(108,99,255,0.05)', fontSize: '12px' }}><th style={{ padding: '6px', textAlign: 'right' }}>{t('fin.str_221')}</th><th style={{ padding: '6px', textAlign: 'right' }}>{t('fin.str_222')}</th><th style={{ padding: '6px', textAlign: 'right' }}>{t('fin.str_223')}</th><th style={{ padding: '6px', textAlign: 'right' }}>{t('fin.str_214')}</th><th style={{ padding: '6px', textAlign: 'right' }}>{t('fin.str_215')}</th></tr></thead>
                                                <tbody>{j.lines.map(l => (
                                                    <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                        <td style={{ padding: '6px', fontSize: '12px' }}><span style={{ fontFamily: 'monospace' }}>{l.account.code}</span> {l.account.name}</td>
                                                        <td style={{ padding: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>{l.description}</td>
                                                        <td style={{ padding: '6px', fontSize: '12px', color: '#8b5cf6' }}>{l.costCenter ? l.costCenter.name : '-'}</td>
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

            {/* ===== مراكز التكلفة ===== */}
            {tab === 'cost_centers' && (
                <div className="card">
                    <h3 style={{ marginBottom: '16px' }}>{t('fin.str_224')}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2fr', gap: '24px' }}>
                        <div style={{ background: 'rgba(108,99,255,0.03)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <h4 style={{ marginBottom: '12px' }}>{t('fin.str_225')}</h4>
                            <input value={newCostCenter.code} onChange={e => setNewCostCenter({ ...newCostCenter, code: e.target.value })} placeholder={t('fin.str_267')} style={{ width: '100%', padding: '8px 12px', marginBottom: '8px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                            <input value={newCostCenter.name} onChange={e => setNewCostCenter({ ...newCostCenter, name: e.target.value })} placeholder={t('fin.str_268')} style={{ width: '100%', padding: '8px 12px', marginBottom: '12px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '16px', fontSize: '14px' }}>
                                <input type="checkbox" checked={newCostCenter.isActive} onChange={e => setNewCostCenter({ ...newCostCenter, isActive: e.target.checked })} />
                                {t('sys.str_180')}</label>
                            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleAddCostCenter}>{t('fin.str_226')}</button>
                        </div>
                        <div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead><tr style={{ background: 'rgba(0,0,0,0.03)' }}><th style={{ padding: '10px', textAlign: 'right' }}>{t('fin.str_197')}</th><th style={{ padding: '10px', textAlign: 'right' }}>{t('fin.str_198')}</th><th style={{ padding: '10px', textAlign: 'right' }}>{t('fin.str_227')}</th></tr></thead>
                                <tbody>{costCenters.map(c => (
                                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '10px', fontFamily: 'monospace' }}>{c.code}</td>
                                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{c.name}</td>
                                        <td style={{ padding: '10px' }}><span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', background: c.isActive ? '#22c55e20' : '#ef444420', color: c.isActive ? '#22c55e' : '#ef4444' }}>{c.isActive ? t('sys.str_180') : t('fin.str_269')}</span></td>
                                    </tr>
                                ))}
                                {costCenters.length === 0 && <tr><td colSpan={3} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('fin.str_228')}</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== دفتر الأستاذ ===== */}
            {tab === 'ledger' && (
                <div>
                    <div className="toolbar" style={{ marginBottom: '12px' }}>
                        <select value={selectedAccount} onChange={e => loadLedger(parseInt(e.target.value))} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', minWidth: '250px' }}>
                            <option value={0}>{t('fin.str_229')}</option>
                            {accounts.filter(a => a.level > 0).map(a => (<option key={a.id} value={a.id}>{a.code} - {a.name}</option>))}
                        </select>
                    </div>
                    {loading ? <div className="card"><div className="empty-state"><div className="empty-state-text">{t('sys.str_168')}</div></div></div> :
                        !ledgerData ? <div className="card"><div className="empty-state"><div className="empty-state-icon">📒</div><div className="empty-state-text">{t('fin.str_230')}</div></div></div> :
                            <div className="card">
                                <h3 style={{ marginBottom: '12px' }}>{ledgerData.account.code} - {ledgerData.account.name}</h3>
                                {ledgerData.lines.length === 0 ? <div className="empty-state"><div className="empty-state-text">{t('fin.str_231')}</div></div> :
                                    <><table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead><tr style={{ background: 'rgba(108,99,255,0.05)', fontSize: '12px' }}>
                                            <th style={{ padding: '8px', textAlign: 'right' }}>{t('fin.str_232')}</th><th style={{ padding: '8px', textAlign: 'right' }}>{t('fin.str_233')}</th><th style={{ padding: '8px', textAlign: 'right' }}>{t('fin.str_222')}</th>
                                            <th style={{ padding: '8px', textAlign: 'right' }}>{t('fin.str_214')}</th><th style={{ padding: '8px', textAlign: 'right' }}>{t('fin.str_215')}</th><th style={{ padding: '8px', textAlign: 'right' }}>{t('fin.str_234')}</th>
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
                                            <span>{t('fin.str_235')}{fmt(ledgerData.totalDebit)}</span>
                                            <span>{t('fin.str_236')}{fmt(ledgerData.totalCredit)}</span>
                                            <span>{t('fin.str_237')}<span style={{ color: ledgerData.closingBalance >= 0 ? '#22c55e' : '#ef4444' }}>{fmt(ledgerData.closingBalance)}</span></span>
                                        </div></>}
                            </div>}
                </div>
            )}

            {/* ===== ميزان المراجعة ===== */}
            {tab === 'trial' && (
                <div className="card">
                    {loading ? <div className="empty-state"><div className="empty-state-text">{t('sys.str_168')}</div></div> :
                        !trialData ? <div className="empty-state"><div className="empty-state-icon">⚖️</div><div className="empty-state-text">{t('fin.str_238')}</div></div> :
                            <><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3>{t('fin.str_239')}</h3>
                                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '13px', background: trialData.isBalanced ? '#22c55e20' : '#ef444420', color: trialData.isBalanced ? '#22c55e' : '#ef4444' }}>
                                    {trialData.isBalanced ? t('fin.str_270') : t('fin.str_271')}
                                </span>
                            </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead><tr style={{ background: 'rgba(108,99,255,0.05)' }}><th style={{ padding: '8px', textAlign: 'right' }}>{t('fin.str_197')}</th><th style={{ padding: '8px', textAlign: 'right' }}>{t('fin.str_221')}</th><th style={{ padding: '8px', textAlign: 'right' }}>{t('fin.str_240')}</th><th style={{ padding: '8px', textAlign: 'right' }}>{t('fin.str_241')}</th></tr></thead>
                                    <tbody>{trialData.rows.map(r => (
                                        <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '12px' }}>{r.code}</td>
                                            <td style={{ padding: '8px' }}>{r.name}</td>
                                            <td style={{ padding: '8px', fontFamily: 'monospace', color: r.debitBalance > 0 ? '#22c55e' : 'var(--text-muted)' }}>{r.debitBalance > 0 ? fmt(r.debitBalance) : '-'}</td>
                                            <td style={{ padding: '8px', fontFamily: 'monospace', color: r.creditBalance > 0 ? '#ef4444' : 'var(--text-muted)' }}>{r.creditBalance > 0 ? fmt(r.creditBalance) : '-'}</td>
                                        </tr>
                                    ))}
                                        <tr style={{ background: 'rgba(108,99,255,0.08)', fontWeight: 'bold' }}>
                                            <td colSpan={2} style={{ padding: '10px' }}>{t('sys.str_66')}</td>
                                            <td style={{ padding: '10px', fontFamily: 'monospace' }}>{fmt(trialData.grandTotalDebit)}</td>
                                            <td style={{ padding: '10px', fontFamily: 'monospace' }}>{fmt(trialData.grandTotalCredit)}</td>
                                        </tr></tbody>
                                </table></>}
                </div>
            )}

            {/* ===== قائمة الدخل ===== */}
            {tab === 'income' && (
                <div className="card">
                    {loading ? <div className="empty-state"><div className="empty-state-text">{t('sys.str_168')}</div></div> :
                        !incomeData ? <div className="empty-state"><div className="empty-state-icon">📊</div><div className="empty-state-text">{t('fin.str_238')}</div></div> :
                            <><h3 style={{ marginBottom: '16px' }}>{t('fin.str_242')}</h3>
                                <div style={{ background: '#3b82f610', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                                    <h4 style={{ color: '#3b82f6', marginBottom: '8px' }}>{t('fin.str_243')}</h4>
                                    {incomeData.revenue.items.map((r, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', fontSize: '13px' }}>
                                            <span>{r.code} - {r.name}</span><span style={{ fontFamily: 'monospace' }}>{fmt(r.amount)}</span>
                                        </div>
                                    ))}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', fontWeight: 'bold', borderTop: '1px solid #3b82f630', marginTop: '8px' }}>
                                        <span>{t('fin.str_244')}</span><span style={{ fontFamily: 'monospace', color: '#3b82f6' }}>{fmt(incomeData.revenue.total)}</span>
                                    </div>
                                </div>
                                <div style={{ background: '#f59e0b10', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                                    <h4 style={{ color: '#f59e0b', marginBottom: '8px' }}>{t('fin.str_245')}</h4>
                                    {incomeData.expenses.items.map((e, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', fontSize: '13px' }}>
                                            <span>{e.code} - {e.name}</span><span style={{ fontFamily: 'monospace' }}>{fmt(e.amount)}</span>
                                        </div>
                                    ))}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', fontWeight: 'bold', borderTop: '1px solid #f59e0b30', marginTop: '8px' }}>
                                        <span>{t('fin.str_246')}</span><span style={{ fontFamily: 'monospace', color: '#f59e0b' }}>{fmt(incomeData.expenses.total)}</span>
                                    </div>
                                </div>
                                <div style={{ background: incomeData.netProfit >= 0 ? '#22c55e15' : '#ef444415', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '14px', marginBottom: '4px' }}>{incomeData.netProfit >= 0 ? t('fin.str_272') : t('fin.str_273')}</div>
                                    <div style={{ fontSize: '28px', fontWeight: 'bold', fontFamily: 'monospace', color: incomeData.netProfit >= 0 ? '#22c55e' : '#ef4444' }}>{fmt(Math.abs(incomeData.netProfit))} {t('sys.str_68')}</div>
                                </div></>}
                </div>
            )}

            {/* ===== الميزانية العمومية ===== */}
            {tab === 'balance' && (
                <div className="card">
                    {loading ? <div className="empty-state"><div className="empty-state-text">{t('sys.str_168')}</div></div> :
                        !balanceData ? <div className="empty-state"><div className="empty-state-icon">🏦</div><div className="empty-state-text">{t('fin.str_238')}</div></div> :
                            <><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3>{t('fin.str_247')}</h3>
                                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '13px', background: balanceData.isBalanced ? '#22c55e20' : '#ef444420', color: balanceData.isBalanced ? '#22c55e' : '#ef4444' }}>
                                    {balanceData.isBalanced ? t('fin.str_274') : t('fin.str_275')}
                                </span>
                            </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div style={{ background: '#22c55e10', padding: '12px', borderRadius: '8px' }}>
                                        <h4 style={{ color: '#22c55e', marginBottom: '8px' }}>{t('fin.str_248')}</h4>
                                        {balanceData.assets.items.map((a, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', fontSize: '13px' }}>
                                                <span>{a.code} - {a.name}</span><span style={{ fontFamily: 'monospace' }}>{fmt(a.balance)}</span>
                                            </div>
                                        ))}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', fontWeight: 'bold', borderTop: '2px solid #22c55e30', marginTop: '8px' }}>
                                            <span>{t('fin.str_249')}</span><span style={{ fontFamily: 'monospace', color: '#22c55e', fontSize: '16px' }}>{fmt(balanceData.assets.total)}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ background: '#ef444410', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                                            <h4 style={{ color: '#ef4444', marginBottom: '8px' }}>{t('fin.str_250')}</h4>
                                            {balanceData.liabilities.items.map((l, i) => (
                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', fontSize: '13px' }}>
                                                    <span>{l.code} - {l.name}</span><span style={{ fontFamily: 'monospace' }}>{fmt(l.balance)}</span>
                                                </div>
                                            ))}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', fontWeight: 'bold', borderTop: '1px solid #ef444430', marginTop: '8px' }}>
                                                <span>{t('fin.str_251')}</span><span style={{ fontFamily: 'monospace', color: '#ef4444' }}>{fmt(balanceData.liabilities.total)}</span>
                                            </div>
                                        </div>
                                        <div style={{ background: '#8b5cf610', padding: '12px', borderRadius: '8px' }}>
                                            <h4 style={{ color: '#8b5cf6', marginBottom: '8px' }}>{t('fin.str_252')}</h4>
                                            {balanceData.equity.items.map((e, i) => (
                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', fontSize: '13px' }}>
                                                    <span>{e.code} - {e.name}</span><span style={{ fontFamily: 'monospace' }}>{fmt(e.balance)}</span>
                                                </div>
                                            ))}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', fontWeight: 'bold', borderTop: '1px solid #8b5cf630', marginTop: '8px' }}>
                                                <span>{t('fin.str_253')}</span><span style={{ fontFamily: 'monospace', color: '#8b5cf6' }}>{fmt(balanceData.equity.total)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div></>}
                </div>
            )}

        </div></>);
}
