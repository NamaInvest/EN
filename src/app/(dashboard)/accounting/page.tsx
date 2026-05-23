'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';
import { 
  Network, BookText, LibraryBig, Scale, TrendingUp, Landmark, Building2, 
  Lock, Plus, ShieldAlert, AlertTriangle, CheckCircle2, XCircle, Search, 
  ChevronDown, ChevronRight, FileEdit, Undo2, Ban
} from 'lucide-react';

type Tab = 'tree' | 'journal' | 'ledger' | 'trial' | 'income' | 'balance' | 'cost_centers' | 'closing';

interface Account { id: number; code: string; name: string; nameEn: string; type: string; level: number; balance: number; isActive: boolean; parentId: number; }
interface JournalLine { id: number; accountId: number; costCenterId?: number; description: string; debit: number; credit: number; account: { code: string; name: string; type: string }; costCenter?: { name: string } }
interface JournalEntry { id: number; entryNumber: string; entryDate: string; description: string; reference: string; totalDebit: number; totalCredit: number; status: string; lines: JournalLine[] }
interface LedgerLine { id: number; date: string; entryNumber: string; description: string; debit: number; credit: number; balance: number }
interface TrialRow { id: number; code: string; name: string; type: string; level: number; totalDebit: number; totalCredit: number; debitBalance: number; creditBalance: number }
interface StatementItem { code: string; name: string; amount: number }
interface BSItem { code: string; name: string; level: number; balance: number }
interface CostCenter { id: number; code: string; name: string; isActive: boolean; }
interface FiscalPeriod { id: number; year: number; month: number; status: string; periodCloseChecklists: { id: number; taskName: string; status: string }[] }

const TYPE_LABELS: Record<string, string> = { asset: 'أصول', liability: 'خصوم', equity: 'ملكية', revenue: 'إيرادات', expense: 'مصروفات' };
const TYPE_COLORS: Record<string, string> = { 
  asset: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30', 
  liability: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/30', 
  equity: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/30', 
  revenue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/30', 
  expense: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/30' 
};

const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');`;

export default function AccountingPage() {
    const { lang } = useTranslation();
        const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const { t, lang } = useTranslation();
  const { error: toastError, success: toastSuccess } = useToast();
  
  const [tab, setTab] = useState<Tab>('tree');
  const [periods, setPeriods] = useState<FiscalPeriod[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [newCostCenter, setNewCostCenter] = useState({ code: '', name: '', isActive: true });
  const [selectedAccount, setSelectedAccount] = useState<number>(0);
  const [ledgerData, setLedgerData] = useState<{ account: Account; lines: LedgerLine[]; totalDebit: number; totalCredit: number; closingBalance: number } | null>(null);
  const [trialData, setTrialData] = useState<{ rows: TrialRow[]; grandTotalDebit: number; grandTotalCredit: number; isBalanced: boolean } | null>(null);
  const [violations, setViolations] = useState<any[]>([]);
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

  useEffect(() => {
    loadCostCenters();
    if (tab === 'tree') loadAccounts();
    if (tab === 'journal') loadJournals();
    if (tab === 'trial') loadTrialBalance();
    if (tab === 'income') loadIncomeStatement();
    if (tab === 'balance') loadBalanceSheet();
    if (tab === 'closing') { loadPeriods(); loadViolations(); }
  }, [tab, loadAccounts, loadCostCenters]);

  async function loadPeriods() {
    setLoading(true);
    try { const r = await fetch('/api/accounting/fiscal-periods'); if (r.ok) { const data = await r.json(); setPeriods(data.periods || []); } } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
    setLoading(false);
  }

  async function loadViolations() {
    try { const r = await fetch('/api/accounting/governance-violations'); if (r.ok) setViolations(await r.json()); } catch (e: any) { console.error(e); }
  }

  async function loadJournals() {
    setLoading(true);
    try { const r = await fetch('/api/accounting/journal'); if (r.ok) setJournals(await r.json()); } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
    setLoading(false);
  }

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
  }

  async function loadIncomeStatement() {
    setLoading(true);
    try { const r = await fetch('/api/accounting/income-statement'); if (r.ok) setIncomeData(await r.json()); } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
    setLoading(false);
  }

  async function loadBalanceSheet() {
    setLoading(true);
    try { const r = await fetch('/api/accounting/balance-sheet'); if (r.ok) setBalanceData(await r.json()); } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
    setLoading(false);
  }

  const handleAddAccount = async () => {
    const res = await fetch('/api/accounting/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newAccount) });
    if (res.ok) { 
      setShowAddAccount(false); 
      setNewAccount({ code: '', name: '', type: 'asset', level: 1, parentId: 0 }); 
      loadAccounts(); 
    } else { 
      const e = await res.json(); toastError(e.error); 
    }
  };

  const openAddSubAccount = (parentAcc: Account) => {
    const childrenCount = accounts.filter(a => a.parentId === parentAcc.id).length;
    const potentialCode = `${parentAcc.code}${(childrenCount + 1).toString().padStart(2, '0')}`;
    setNewAccount({ code: potentialCode, name: '', type: parentAcc.type, level: parentAcc.level + 1, parentId: parentAcc.id });
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
      toastSuccess(data.message);
      loadAccounts();
    } else {
      toastError(t('fin.str_255'));
    }
    setLoading(false);
  };

  const handleAddCostCenter = async () => {
    const res = await fetch('/api/accounting/cost-centers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCostCenter) });
    if (res.ok) { setNewCostCenter({ code: '', name: '', isActive: true }); loadCostCenters(); }
    else { const e = await res.json(); toastError(e.error || 'Failed'); }
  };

  const handleAddJournal = async () => {
    const totalD = journalLines.reduce((s, l) => s + l.debit, 0);
    const totalC = journalLines.reduce((s, l) => s + l.credit, 0);
    if (Math.abs(totalD - totalC) > 0.01) { toastError(`القيد غير متوازن: مدين ${totalD} ≠ دائن ${totalC}`); return; }
    const res = await fetch('/api/accounting/journal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description: journalDesc, lines: journalLines.filter(l => l.debit > 0 || l.credit > 0) }) });
    if (res.ok) { 
      setShowAddJournal(false); 
      setJournalDesc(''); 
      setJournalLines([{ accountCode: '', costCenterId: 0, debit: 0, credit: 0, description: '' }, { accountCode: '', costCenterId: 0, debit: 0, credit: 0, description: '' }]); 
      loadJournals(); 
    } else { 
      const e = await res.json(); toastError(e.error); 
    }
  };

  const handlePostJournal = async (e: any, id: number) => {
    e.stopPropagation();
    if (!confirm('هل أنت متأكد من ترحيل هذا القيد؟ لا يمكن تعديله بعد الترحيل.')) return;
    const res = await fetch(`/api/accounting/journal/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'posted' }) });
    if (res.ok) { loadJournals(); } else { const err = await res.json(); toastError(err.error || 'فشل الترحيل'); }
  };

  const handleReverseJournal = async (e: any, id: number) => {
    e.stopPropagation();
    const reason = prompt('أدخل سبب عكس القيد:');
    if (!reason) return;
    const res = await fetch(`/api/accounting/reversal`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ journalEntryId: id, reason }) });
    if (res.ok) { loadJournals(); } else { const err = await res.json(); toastError(err.error || 'فشل العكس'); }
  };

  const handleStartClosing = async (periodId: number) => {
    setLoading(true);
    const res = await fetch('/api/accounting/fiscal-periods', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'start_closing', fiscalPeriodId: periodId }) });
    if (res.ok) { toastSuccess('تم إنشاء قوائم الإغلاق'); loadPeriods(); } else { const e = await res.json(); toastError(e.error); }
    setLoading(false);
  };

  const handleCompleteTask = async (taskId: number) => {
    setLoading(true);
    const res = await fetch('/api/accounting/fiscal-periods', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'complete_task', taskId }) });
    if (res.ok) { toastSuccess('تم إنجاز المهمة'); loadPeriods(); } else { const e = await res.json(); toastError(e.error); }
    setLoading(false);
  };

  const handleSoftClose = async (periodId: number) => {
    setLoading(true);
    const res = await fetch('/api/accounting/fiscal-periods', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'soft_close', fiscalPeriodId: periodId }) });
    if (res.ok) { toastSuccess('تم الإغلاق المرن'); loadPeriods(); } else { const e = await res.json(); toastError(e.error); }
    setLoading(false);
  };

  const handleHardClose = async (periodId: number) => {
    if (!confirm('تحذير: الإغلاق التام يمنع أي تعديلات نهائياً ولا يفتح إلا بصلاحيات عليا. هل توافق؟')) return;
    setLoading(true);
    const res = await fetch('/api/accounting/fiscal-periods', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'hard_close', fiscalPeriodId: periodId }) });
    if (res.ok) { toastSuccess('تم الإغلاق التام'); loadPeriods(); } else { const e = await res.json(); toastError(e.error); }
    setLoading(false);
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'tree', label: t('fin.str_256'), icon: Network },
    { key: 'journal', label: t('fin.str_257'), icon: BookText },
    { key: 'ledger', label: t('fin.str_258'), icon: LibraryBig },
    { key: 'trial', label: t('fin.str_259'), icon: Scale },
    { key: 'income', label: t('fin.str_260'), icon: TrendingUp },
    { key: 'balance', label: t('fin.str_261'), icon: Landmark },
    { key: 'cost_centers', label: t('fin.str_262'), icon: Building2 },
    { key: 'closing', label: 'إغلاق الفترات', icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-6 lg:p-10 transition-colors duration-300" style={{ fontFamily: "'Fira Sans', sans-serif" }} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <style dangerouslySetInnerHTML={{ __html: fontImport }} />
      
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white dark:bg-[#0F172A] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 gap-4">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl relative overflow-hidden group">
              <Landmark className="w-8 h-8 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">{t('fin.str_192')}</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">المركز المالي، القيود، والقوائم الختامية</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 bg-white dark:bg-[#0F172A] p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          {tabs.map(tOption => {
            const Icon = tOption.icon;
            const isActive = tab === tOption.key;
            return (
              <button 
                key={tOption.key} 
                onClick={() => setTab(tOption.key)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                    : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} /> {tOption.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* ===== شجرة الحسابات ===== */}
          {tab === 'tree' && (
            <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">الدليل المحاسبي</h2>
                  <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-xs font-bold font-[Fira_Code]">{accounts.length} حساب</span>
                </div>
                <div className="flex gap-2">
                  {accounts.length === 0 && (
                    <button onClick={handleInitAccounts} disabled={loading} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                      {t('fin.str_194')}
                    </button>
                  )}
                  <button onClick={() => setShowAddAccount(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors">
                    <Plus className="w-4 h-4" /> حساب رئيسي
                  </button>
                </div>
              </div>

              {showAddAccount && (
                <div className="p-5 bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/30 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">{t('fin.str_196')}</label>
                    <input disabled value={accounts.find(a => a.id === newAccount.parentId)?.name || 'أصل رئيسي'} className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">{t('fin.str_197')}</label>
                    <input value={newAccount.code} onChange={e => setNewAccount({ ...newAccount, code: e.target.value })} placeholder="ex: 1110" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold font-[Fira_Code] focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">{t('fin.str_198')}</label>
                    <input value={newAccount.name} onChange={e => setNewAccount({ ...newAccount, name: e.target.value })} placeholder={t('fin.str_264')} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">{t('fin.str_199')}</label>
                    <select disabled={newAccount.parentId > 0} value={newAccount.type} onChange={e => setNewAccount({ ...newAccount, type: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
                      <option value="asset">{t('fin.str_200')}</option><option value="liability">{t('fin.str_201')}</option><option value="equity">{t('fin.str_202')}</option><option value="revenue">{t('fin.str_203')}</option><option value="expense">{t('fin.str_204')}</option>
                    </select>
                  </div>
                  <div className="md:col-span-5 flex justify-end gap-2 mt-2">
                    <button onClick={() => {setShowAddAccount(false); setNewAccount({ code: '', name: '', type: 'asset', level: 1, parentId: 0 });}} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                      {t('fin.str_206')}
                    </button>
                    <button onClick={handleAddAccount} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors">
                      {t('fin.str_205')}
                    </button>
                  </div>
                </div>
              )}

              <div className="p-5 overflow-x-auto">
                <div className="min-w-[800px] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-[#0F172A]">
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
                        <div key={acc.id} className="flex flex-col">
                          <div 
                            onClick={() => { if(hasChildren) toggleTreeNode(acc.id); else { setSelectedAccount(acc.id); setTab('ledger'); loadLedger(acc.id); } }}
                            className={`flex items-center gap-3 p-3 border-b border-slate-100 dark:border-slate-800/50 cursor-pointer transition-colors ${acc.level === 1 ? 'bg-slate-50 dark:bg-slate-900/40' : hasChildren ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50' : 'bg-white dark:bg-[#0F172A] hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
                            style={{ paddingInlineStart: `${16 + indentStart * 28}px` }}
                          >
                            <span 
                              className="w-6 h-6 flex items-center justify-center text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 rounded-md"
                              onClick={(e) => { e.stopPropagation(); toggleTreeNode(acc.id); }}
                            >
                              {hasChildren ? (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 rtl:rotate-180" />) : <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 dark:bg-indigo-700" />}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 font-[Fira_Code] text-sm w-20">{acc.code}</span>
                            <span className={`flex-1 ${hasChildren ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>{acc.name}</span>
                            <span className={`px-2.5 py-1 rounded text-xs font-bold border ${TYPE_COLORS[acc.type]} min-w-[80px] text-center`}>
                              {TYPE_LABELS[acc.type]}
                            </span>
                            <span className={`w-32 text-left font-[Fira_Code] ${rollup >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} ${hasChildren ? 'font-bold' : 'font-medium'}`} dir="ltr">
                              {rollup !== 0 ? fmt(rollup) : '-'}
                            </span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); openAddSubAccount(acc); }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors opacity-0 group-hover:opacity-100 lg:opacity-100"
                              title={t('fin.str_207')}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          {isExpanded && hasChildren && (
                            <div className="flex flex-col">
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
            </div>
          )}

          {/* ===== القيود اليومية ===== */}
          {tab === 'journal' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">سجل القيود</h2>
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-bold font-[Fira_Code]">{journals.length} قيد</span>
                </div>
                <button onClick={() => setShowAddJournal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors">
                  <Plus className="w-4 h-4" /> إثبات قيد جديد
                </button>
              </div>

              {showAddJournal && (
                <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-indigo-200 dark:border-indigo-800 shadow-lg overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-1 h-full bg-indigo-500"></div>
                  <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><BookText className="w-5 h-5 text-indigo-500" /> {t('fin.str_210')}</h3>
                  </div>
                  <div className="p-5">
                    <div className="mb-4">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">وصف القيد العام</label>
                      <input value={journalDesc} onChange={e => setJournalDesc(e.target.value)} placeholder={t('fin.str_265')} className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 transition-colors" />
                    </div>
                    
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-sm text-right">
                        <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400">
                          <tr>
                            <th className="p-3 font-bold">{t('fin.str_211')}</th>
                            <th className="p-3 font-bold">{t('fin.str_212')}</th>
                            <th className="p-3 font-bold">{t('fin.str_213')}</th>
                            <th className="p-3 font-bold text-center">مدين</th>
                            <th className="p-3 font-bold text-center">دائن</th>
                            <th className="p-3 w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-[#0F172A]">
                          {journalLines.map((l, i) => (
                            <tr key={i}>
                              <td className="p-2"><input value={l.accountCode} onChange={e => { const nl = [...journalLines]; nl[i].accountCode = e.target.value; setJournalLines(nl); }} placeholder="رمز الحساب" className="w-24 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-[Fira_Code] focus:ring-2 focus:ring-indigo-500" /></td>
                              <td className="p-2"><input value={l.description} onChange={e => { const nl = [...journalLines]; nl[i].description = e.target.value; setJournalLines(nl); }} placeholder="البيان" className="w-full min-w-[150px] px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" /></td>
                              <td className="p-2">
                                <select value={l.costCenterId || 0} onChange={e => { const nl = [...journalLines]; nl[i].costCenterId = parseInt(e.target.value); setJournalLines(nl); }} className="w-32 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500">
                                  <option value={0}>لا يوجد</option>
                                  {costCenters.filter(c => c.isActive).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                              </td>
                              <td className="p-2"><input type="number" value={l.debit || ''} onChange={e => { const nl = [...journalLines]; nl[i].debit = parseFloat(e.target.value) || 0; setJournalLines(nl); }} dir="ltr" className="w-full min-w-[100px] px-3 py-1.5 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-lg text-emerald-700 dark:text-emerald-400 font-[Fira_Code] font-bold focus:ring-2 focus:ring-emerald-500" /></td>
                              <td className="p-2"><input type="number" value={l.credit || ''} onChange={e => { const nl = [...journalLines]; nl[i].credit = parseFloat(e.target.value) || 0; setJournalLines(nl); }} dir="ltr" className="w-full min-w-[100px] px-3 py-1.5 bg-red-50/50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg text-red-700 dark:text-red-400 font-[Fira_Code] font-bold focus:ring-2 focus:ring-red-500" /></td>
                              <td className="p-2 text-center"><button onClick={() => setJournalLines(journalLines.filter((_, j) => j !== i))} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"><XCircle className="w-5 h-5" /></button></td>
                            </tr>
                          ))}
                          <tr className="bg-slate-50 dark:bg-slate-900/80">
                            <td colSpan={3} className="p-3 font-bold text-slate-900 dark:text-white text-left">الإجمالي المتوازن</td>
                            <td className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400 font-[Fira_Code]" dir="ltr">{fmt(journalLines.reduce((s, l) => s + l.debit, 0))}</td>
                            <td className="p-3 text-center font-bold text-red-600 dark:text-red-400 font-[Fira_Code]" dir="ltr">{fmt(journalLines.reduce((s, l) => s + l.credit, 0))}</td>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-between items-center mt-5">
                      <button onClick={() => setJournalLines([...journalLines, { accountCode: '', costCenterId: 0, debit: 0, credit: 0, description: '' }])} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <Plus className="w-4 h-4" /> إضافة سطر
                      </button>
                      <div className="flex gap-3">
                        <button onClick={() => setShowAddJournal(false)} className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                          {t('fin.str_206')}
                        </button>
                        <button onClick={handleAddJournal} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors">
                          اعتماد القيد
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="py-20 text-center text-slate-500 font-bold">{t('sys.str_168')}</div>
              ) : journals.length === 0 ? (
                <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 p-20 flex flex-col items-center justify-center text-center text-slate-400">
                  <BookText className="w-16 h-16 mb-4 opacity-20" />
                  <p className="font-bold text-lg text-slate-500">لا توجد قيود يومية مسجلة</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {journals.map(j => (
                    <div key={j.id} className="bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:border-indigo-300 dark:hover:border-indigo-700">
                      <div 
                        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30"
                        onClick={() => setExpandedEntry(expandedEntry === j.id ? null : j.id)}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${j.status === 'posted' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : j.status === 'draft' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                          {j.status === 'posted' ? <CheckCircle2 className="w-5 h-5" /> : j.status === 'draft' ? <FileEdit className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-[Fira_Code] font-bold text-indigo-600 dark:text-indigo-400">{j.entryNumber}</span>
                            <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{j.entryDate}</span>
                            {j.reference && <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800/30">Ref: {j.reference}</span>}
                          </div>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-200 line-clamp-1">{j.description}</p>
                        </div>
                        <div className="text-left shrink-0">
                          <p className="text-xs text-slate-500 mb-1">الإجمالي (مدين/دائن)</p>
                          <p className="font-[Fira_Code] font-bold text-slate-900 dark:text-white">{fmt(j.totalDebit)} <span className="text-xs text-slate-500">SAR</span></p>
                        </div>
                        <div className="shrink-0 text-slate-400">
                          {expandedEntry === j.id ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5 rtl:rotate-180" />}
                        </div>
                      </div>

                      {expandedEntry === j.id && (
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                            <table className="w-full text-sm text-right">
                              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                <tr>
                                  <th className="p-2 font-bold">{t('fin.str_221')}</th>
                                  <th className="p-2 font-bold">{t('fin.str_222')}</th>
                                  <th className="p-2 font-bold">{t('fin.str_223')}</th>
                                  <th className="p-2 font-bold text-center">{t('fin.str_214')}</th>
                                  <th className="p-2 font-bold text-center">{t('fin.str_215')}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-[#0F172A]">
                                {j.lines.map(l => (
                                  <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-2">
                                      <div className="flex items-center gap-2">
                                        <span className="font-[Fira_Code] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 rounded">{l.account.code}</span>
                                        <span className="font-medium text-slate-900 dark:text-slate-200">{l.account.name}</span>
                                      </div>
                                    </td>
                                    <td className="p-2 text-slate-600 dark:text-slate-400">{l.description}</td>
                                    <td className="p-2 text-purple-600 dark:text-purple-400 font-bold">{l.costCenter ? l.costCenter.name : '-'}</td>
                                    <td className="p-2 text-center font-[Fira_Code] font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">{l.debit > 0 ? fmt(l.debit) : '-'}</td>
                                    <td className="p-2 text-center font-[Fira_Code] font-bold text-red-600 dark:text-red-400" dir="ltr">{l.credit > 0 ? fmt(l.credit) : '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          
                          <div className="flex justify-between items-center mt-4">
                            <span className={`px-3 py-1 rounded-md text-xs font-bold ${j.status === 'draft' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30' : j.status === 'posted' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/30'}`}>
                              الحالة: {j.status === 'draft' ? 'مسودة' : j.status === 'posted' ? 'مُرحّل' : 'ملغي/معكوس'}
                            </span>
                            
                            <div className="flex gap-2">
                              {j.status === 'draft' && (
                                <button onClick={(e) => handlePostJournal(e, j.id)} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors">
                                  <CheckCircle2 className="w-4 h-4" /> ترحيل واعتماد
                                </button>
                              )}
                              {j.status === 'posted' && !j.entryNumber.endsWith('-R') && (
                                <button onClick={(e) => handleReverseJournal(e, j.id)} className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors">
                                  <Undo2 className="w-4 h-4" /> عكس القيد
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== دفتر الأستاذ ===== */}
          {tab === 'ledger' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">اختر الحساب لعرض دفتر الأستاذ العام</label>
                <div className="relative max-w-xl">
                  <Search className="w-5 h-5 absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select 
                    value={selectedAccount} 
                    onChange={e => loadLedger(parseInt(e.target.value))} 
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 appearance-none"
                  >
                    <option value={0}>{t('fin.str_229')}</option>
                    {accounts.filter(a => a.level > 0).map(a => (<option key={a.id} value={a.id}>{a.code} - {a.name}</option>))}
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="py-20 text-center text-slate-500 font-bold">{t('sys.str_168')}</div>
              ) : !ledgerData ? (
                <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 p-20 flex flex-col items-center justify-center text-center text-slate-400">
                  <LibraryBig className="w-16 h-16 mb-4 opacity-20" />
                  <p className="font-bold text-lg text-slate-500">اختر حساباً لعرض العمليات</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                      <span className="font-[Fira_Code] text-indigo-600 dark:text-indigo-400">{ledgerData.account.code}</span>
                      {ledgerData.account.name}
                    </h3>
                    <span className={`px-3 py-1 rounded text-xs font-bold border ${TYPE_COLORS[ledgerData.account.type]}`}>
                      {TYPE_LABELS[ledgerData.account.type]}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="p-3 font-bold">{t('fin.str_232')}</th>
                          <th className="p-3 font-bold">{t('fin.str_233')}</th>
                          <th className="p-3 font-bold">{t('fin.str_222')}</th>
                          <th className="p-3 font-bold text-center">{t('fin.str_214')}</th>
                          <th className="p-3 font-bold text-center">{t('fin.str_215')}</th>
                          <th className="p-3 font-bold text-center">{t('fin.str_234')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-[#0F172A]">
                        {ledgerData.lines.length === 0 ? (
                          <tr><td colSpan={6} className="p-10 text-center text-slate-500 font-bold">{t('fin.str_231')}</td></tr>
                        ) : ledgerData.lines.map(l => (
                          <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="p-3 text-slate-600 dark:text-slate-400">{l.date}</td>
                            <td className="p-3 font-[Fira_Code] font-bold text-indigo-600 dark:text-indigo-400">{l.entryNumber}</td>
                            <td className="p-3 text-slate-900 dark:text-slate-200 font-medium">{l.description}</td>
                            <td className="p-3 text-center font-[Fira_Code] font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">{l.debit > 0 ? fmt(l.debit) : '-'}</td>
                            <td className="p-3 text-center font-[Fira_Code] font-bold text-red-600 dark:text-red-400" dir="ltr">{l.credit > 0 ? fmt(l.credit) : '-'}</td>
                            <td className={`p-3 text-center font-[Fira_Code] font-bold ${l.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} dir="ltr">{fmt(Math.abs(l.balance))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white dark:bg-[#0F172A] p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
                        <span className="text-sm font-bold text-slate-500">إجمالي المدين</span>
                        <span className="text-lg font-bold font-[Fira_Code] text-emerald-600 dark:text-emerald-400">{fmt(ledgerData.totalDebit)}</span>
                      </div>
                      <div className="bg-white dark:bg-[#0F172A] p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
                        <span className="text-sm font-bold text-slate-500">إجمالي الدائن</span>
                        <span className="text-lg font-bold font-[Fira_Code] text-red-600 dark:text-red-400">{fmt(ledgerData.totalCredit)}</span>
                      </div>
                      <div className="bg-white dark:bg-[#0F172A] p-4 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 flex items-center justify-between shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-1.5 h-full bg-indigo-500"></div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">الرصيد الختامي</span>
                        <span className={`text-xl font-bold font-[Fira_Code] ${ledgerData.closingBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} dir="ltr">
                          {fmt(Math.abs(ledgerData.closingBalance))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== ميزان المراجعة ===== */}
          {tab === 'trial' && (
            <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-20 text-center text-slate-500 font-bold">{t('sys.str_168')}</div>
              ) : !trialData ? (
                <div className="py-20 flex flex-col items-center text-center text-slate-400"><Scale className="w-16 h-16 mb-4 opacity-20" /><p className="font-bold">فشل جلب ميزان المراجعة</p></div>
              ) : (
                <>
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Scale className="w-6 h-6 text-indigo-500" /> {t('fin.str_239')}
                    </h3>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border shadow-sm ${trialData.isBalanced ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50'}`}>
                      {trialData.isBalanced ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                      {trialData.isBalanced ? t('fin.str_270') : t('fin.str_271')}
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="p-4 font-bold">{t('fin.str_197')}</th>
                          <th className="p-4 font-bold">{t('fin.str_221')}</th>
                          <th className="p-4 font-bold text-center">أرصدة مدينة</th>
                          <th className="p-4 font-bold text-center">أرصدة دائنة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-[#0F172A]">
                        {trialData.rows.map(r => (
                          <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="p-4 font-[Fira_Code] font-bold text-indigo-600 dark:text-indigo-400">{r.code}</td>
                            <td className="p-4 font-bold text-slate-900 dark:text-slate-200">{r.name}</td>
                            <td className="p-4 text-center font-[Fira_Code] font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">{r.debitBalance > 0 ? fmt(r.debitBalance) : '-'}</td>
                            <td className="p-4 text-center font-[Fira_Code] font-bold text-red-600 dark:text-red-400" dir="ltr">{r.creditBalance > 0 ? fmt(r.creditBalance) : '-'}</td>
                          </tr>
                        ))}
                        <tr className="bg-indigo-50 dark:bg-indigo-900/20 border-t-2 border-indigo-200 dark:border-indigo-800">
                          <td colSpan={2} className="p-5 font-bold text-slate-900 dark:text-white text-left text-lg">الإجمالي المتوازن</td>
                          <td className="p-5 text-center font-[Fira_Code] font-bold text-emerald-600 dark:text-emerald-400 text-lg" dir="ltr">{fmt(trialData.grandTotalDebit)}</td>
                          <td className="p-5 text-center font-[Fira_Code] font-bold text-red-600 dark:text-red-400 text-lg" dir="ltr">{fmt(trialData.grandTotalCredit)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ===== قائمة الدخل ===== */}
          {tab === 'income' && (
            <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-20 text-center text-slate-500 font-bold">{t('sys.str_168')}</div>
              ) : !incomeData ? (
                <div className="py-20 flex flex-col items-center text-center text-slate-400"><TrendingUp className="w-16 h-16 mb-4 opacity-20" /><p className="font-bold">فشل جلب قائمة الدخل</p></div>
              ) : (
                <div className="p-6 md:p-10">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3 justify-center border-b border-slate-200 dark:border-slate-800 pb-6">
                    <TrendingUp className="w-8 h-8 text-indigo-500" /> قائمة الدخل والربحية
                  </h3>
                  
                  <div className="max-w-4xl mx-auto space-y-6">
                    {/* Revenue Section */}
                    <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-200 dark:border-blue-800/30 overflow-hidden">
                      <h4 className="font-bold text-blue-800 dark:text-blue-400 p-4 border-b border-blue-100 dark:border-blue-800/30 bg-blue-100/50 dark:bg-blue-900/20 text-lg flex items-center gap-2">الإيرادات والمبيعات</h4>
                      <div className="p-4 space-y-2">
                        {incomeData.revenue.items.map((r, i) => (
                          <div key={i} className="flex justify-between items-center p-3 bg-white dark:bg-[#0F172A] rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <span className="font-medium text-slate-700 dark:text-slate-300"><span className="text-slate-400 mr-2 text-xs font-[Fira_Code]">{r.code}</span> {r.name}</span>
                            <span className="font-[Fira_Code] font-bold text-blue-600 dark:text-blue-400">{fmt(r.amount)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 bg-blue-100/50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-800/30 flex justify-between items-center">
                        <span className="font-bold text-blue-900 dark:text-blue-300">إجمالي الإيرادات</span>
                        <span className="font-[Fira_Code] font-bold text-xl text-blue-700 dark:text-blue-400">{fmt(incomeData.revenue.total)}</span>
                      </div>
                    </div>

                    {/* Expenses Section */}
                    <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl border border-amber-200 dark:border-amber-800/30 overflow-hidden">
                      <h4 className="font-bold text-amber-800 dark:text-amber-400 p-4 border-b border-amber-100 dark:border-amber-800/30 bg-amber-100/50 dark:bg-amber-900/20 text-lg flex items-center gap-2">المصروفات والتكاليف</h4>
                      <div className="p-4 space-y-2">
                        {incomeData.expenses.items.map((e, i) => (
                          <div key={i} className="flex justify-between items-center p-3 bg-white dark:bg-[#0F172A] rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <span className="font-medium text-slate-700 dark:text-slate-300"><span className="text-slate-400 mr-2 text-xs font-[Fira_Code]">{e.code}</span> {e.name}</span>
                            <span className="font-[Fira_Code] font-bold text-amber-600 dark:text-amber-400">{fmt(e.amount)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 bg-amber-100/50 dark:bg-amber-900/20 border-t border-amber-100 dark:border-amber-800/30 flex justify-between items-center">
                        <span className="font-bold text-amber-900 dark:text-amber-300">إجمالي المصروفات</span>
                        <span className="font-[Fira_Code] font-bold text-xl text-amber-700 dark:text-amber-400">{fmt(incomeData.expenses.total)}</span>
                      </div>
                    </div>

                    {/* Net Profit Section */}
                    <div className={`mt-8 p-8 rounded-2xl border-2 flex flex-col items-center justify-center text-center shadow-lg ${incomeData.netProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500 dark:border-emerald-500/50' : 'bg-red-50 dark:bg-red-900/10 border-red-500 dark:border-red-500/50'}`}>
                      <div className={`text-lg font-bold mb-2 ${incomeData.netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                        {incomeData.netProfit >= 0 ? 'صافي الربح' : 'صافي الخسارة'} للفترة
                      </div>
                      <div className={`text-4xl lg:text-5xl font-bold font-[Fira_Code] ${incomeData.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {fmt(Math.abs(incomeData.netProfit))} <span className="text-xl">SAR</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== الميزانية العمومية ===== */}
          {tab === 'balance' && (
            <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              {loading ? (
                <div className="py-20 text-center text-slate-500 font-bold">{t('sys.str_168')}</div>
              ) : !balanceData ? (
                <div className="py-20 flex flex-col items-center text-center text-slate-400"><Landmark className="w-16 h-16 mb-4 opacity-20" /><p className="font-bold">فشل جلب الميزانية العمومية</p></div>
              ) : (
                <div className="p-6 md:p-10">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-slate-200 dark:border-slate-800 pb-6 gap-4">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                      <Landmark className="w-8 h-8 text-indigo-500" /> المركز المالي (الميزانية العمومية)
                    </h3>
                    <div className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold border shadow-sm ${balanceData.isBalanced ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50'}`}>
                      {balanceData.isBalanced ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                      {balanceData.isBalanced ? 'الميزانية متطابقة تماماً' : 'يوجد خلل في التوازن الافتتاحي'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Assets Side */}
                    <div className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-200 dark:border-emerald-800/30 overflow-hidden flex flex-col h-full">
                      <h4 className="font-bold text-emerald-800 dark:text-emerald-400 p-5 border-b border-emerald-100 dark:border-emerald-800/30 bg-emerald-100/50 dark:bg-emerald-900/20 text-xl flex items-center justify-between">
                        الأصول والممتلكات <span className="bg-emerald-200 dark:bg-emerald-800/50 px-3 py-1 rounded-full text-sm">{_t('أصل', 'Asset')}</span>
                      </h4>
                      <div className="p-5 flex-1 space-y-3">
                        {balanceData.assets.items.map((a, i) => (
                          <div key={i} className="flex justify-between items-center p-4 bg-white dark:bg-[#0F172A] rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <span className="font-bold text-slate-800 dark:text-slate-200"><span className="text-slate-400 mr-2 text-xs font-[Fira_Code]">{a.code}</span> {a.name}</span>
                            <span className="font-[Fira_Code] font-bold text-emerald-600 dark:text-emerald-400 text-lg">{fmt(a.balance)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="p-6 bg-emerald-100/50 dark:bg-emerald-900/20 border-t border-emerald-200 dark:border-emerald-800/30 flex justify-between items-center">
                        <span className="font-bold text-emerald-900 dark:text-emerald-300 text-lg">إجمالي الأصول</span>
                        <span className="font-[Fira_Code] font-bold text-2xl text-emerald-700 dark:text-emerald-400">{fmt(balanceData.assets.total)}</span>
                      </div>
                    </div>

                    {/* Liabilities & Equity Side */}
                    <div className="flex flex-col gap-8 h-full">
                      
                      <div className="bg-red-50/50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-800/30 overflow-hidden flex flex-col">
                        <h4 className="font-bold text-red-800 dark:text-red-400 p-5 border-b border-red-100 dark:border-red-800/30 bg-red-100/50 dark:bg-red-900/20 text-xl flex items-center justify-between">
                          الخصوم والالتزامات <span className="bg-red-200 dark:bg-red-800/50 px-3 py-1 rounded-full text-sm">{_t('التزام', 'Liability')}</span>
                        </h4>
                        <div className="p-5 space-y-3">
                          {balanceData.liabilities.items.map((l, i) => (
                            <div key={i} className="flex justify-between items-center p-4 bg-white dark:bg-[#0F172A] rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                              <span className="font-bold text-slate-800 dark:text-slate-200"><span className="text-slate-400 mr-2 text-xs font-[Fira_Code]">{l.code}</span> {l.name}</span>
                              <span className="font-[Fira_Code] font-bold text-red-600 dark:text-red-400 text-lg">{fmt(l.balance)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="p-6 bg-red-100/50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800/30 flex justify-between items-center">
                          <span className="font-bold text-red-900 dark:text-red-300 text-lg">إجمالي الخصوم</span>
                          <span className="font-[Fira_Code] font-bold text-2xl text-red-700 dark:text-red-400">{fmt(balanceData.liabilities.total)}</span>
                        </div>
                      </div>

                      <div className="bg-purple-50/50 dark:bg-purple-900/10 rounded-2xl border border-purple-200 dark:border-purple-800/30 overflow-hidden flex flex-col flex-1">
                        <h4 className="font-bold text-purple-800 dark:text-purple-400 p-5 border-b border-purple-100 dark:border-purple-800/30 bg-purple-100/50 dark:bg-purple-900/20 text-xl flex items-center justify-between">
                          حقوق الملكية <span className="bg-purple-200 dark:bg-purple-800/50 px-3 py-1 rounded-full text-sm">{_t('حقوق ملكية', 'Equity')}</span>
                        </h4>
                        <div className="p-5 flex-1 space-y-3">
                          {balanceData.equity.items.map((e, i) => (
                            <div key={i} className="flex justify-between items-center p-4 bg-white dark:bg-[#0F172A] rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                              <span className="font-bold text-slate-800 dark:text-slate-200"><span className="text-slate-400 mr-2 text-xs font-[Fira_Code]">{e.code}</span> {e.name}</span>
                              <span className="font-[Fira_Code] font-bold text-purple-600 dark:text-purple-400 text-lg">{fmt(e.balance)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="p-6 bg-purple-100/50 dark:bg-purple-900/20 border-t border-purple-200 dark:border-purple-800/30 flex justify-between items-center">
                          <span className="font-bold text-purple-900 dark:text-purple-300 text-lg">إجمالي حقوق الملكية</span>
                          <span className="font-[Fira_Code] font-bold text-2xl text-purple-700 dark:text-purple-400">{fmt(balanceData.equity.total)}</span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== مراكز التكلفة و الإغلاق ===== */}
          {tab === 'cost_centers' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2"><Building2 className="w-5 h-5 text-indigo-500" /> إضافة مركز تكلفة</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">رمز المركز</label>
                    <input value={newCostCenter.code} onChange={e => setNewCostCenter({ ...newCostCenter, code: e.target.value })} placeholder="ex: CC-01" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-[Fira_Code] font-bold focus:ring-2 focus:ring-indigo-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">اسم المركز</label>
                    <input value={newCostCenter.name} onChange={e => setNewCostCenter({ ...newCostCenter, name: e.target.value })} placeholder="الإدارة العامة" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 transition-colors" />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <input type="checkbox" checked={newCostCenter.isActive} onChange={e => setNewCostCenter({ ...newCostCenter, isActive: e.target.checked })} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">المركز نشط ومتاح للاستخدام</span>
                  </label>
                  <button onClick={handleAddCostCenter} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm shadow-indigo-500/20 transition-colors mt-2">
                    حفظ وإضافة
                  </button>
                </div>
              </div>

              <div className="lg:col-span-2 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">مراكز التكلفة المسجلة</h3>
                </div>
                <div className="overflow-y-auto flex-1 p-5">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="p-3 font-bold rounded-r-lg">الرمز</th>
                        <th className="p-3 font-bold">اسم المركز</th>
                        <th className="p-3 font-bold rounded-l-lg text-center">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {costCenters.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-3 font-[Fira_Code] font-bold text-indigo-600 dark:text-indigo-400">{c.code}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-slate-200">{c.name}</td>
                          <td className="p-3 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${c.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                              {c.isActive ? 'نشط' : 'غير نشط'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {costCenters.length === 0 && <tr><td colSpan={3} className="p-10 text-center text-slate-500 font-bold">لا توجد مراكز تكلفة مسجلة</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'closing' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Lock className="w-6 h-6 text-indigo-500" /> إغلاق الفترات المحاسبية
                  </h3>
                </div>
                <div className="overflow-x-auto p-5">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="p-4 font-bold rounded-r-lg">الفترة (السنة/الشهر)</th>
                        <th className="p-4 font-bold">الحالة</th>
                        <th className="p-4 font-bold min-w-[300px]">قوائم التحقق والمهام</th>
                        <th className="p-4 font-bold rounded-l-lg text-center">الإجراءات والتحكم</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {periods.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="p-4 font-[Fira_Code] font-bold text-indigo-600 dark:text-indigo-400 text-lg">
                            {p.year} / {String(p.month).padStart(2, '0')}
                          </td>
                          <td className="p-4">
                            <span className={`px-4 py-1.5 rounded-lg text-sm font-bold border ${p.status === 'open' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50' : p.status === 'closed' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50'}`}>
                              {p.status === 'open' ? 'مفتوحة للاستخدام' : p.status === 'closed' ? 'إغلاق مرن (Soft Close)' : 'إقفال تام ونهائي (Hard)'}
                            </span>
                          </td>
                          <td className="p-4">
                            {p.periodCloseChecklists.length === 0 ? (
                              <span className="text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">لم يتم توليد مهام الإغلاق</span>
                            ) : (
                              <div className="space-y-2">
                                {p.periodCloseChecklists.map(c => (
                                  <div key={c.id} className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded-lg">
                                    <span className={`font-bold text-xs flex items-center gap-1.5 ${c.status === 'COMPLETED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                      {c.status === 'COMPLETED' ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />}
                                      {c.taskName}
                                    </span>
                                    {c.status !== 'COMPLETED' && p.status === 'open' && (
                                      <button onClick={() => handleCompleteTask(c.id)} className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/50 font-bold transition-colors">
                                        تأكيد الإنجاز
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-2 items-center">
                              {p.status === 'open' && p.periodCloseChecklists.length === 0 && (
                                <button onClick={() => handleStartClosing(p.id)} className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors">
                                  بدء إجراءات الإغلاق
                                </button>
                              )}
                              {p.status === 'open' && p.periodCloseChecklists.length > 0 && p.periodCloseChecklists.every(c => c.status === 'COMPLETED') && (
                                <button onClick={() => handleSoftClose(p.id)} className="w-full px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors">
                                  تنفيذ إغلاق مرن
                                </button>
                              )}
                              {(p.status === 'open' || p.status === 'closed') && (
                                <button onClick={() => handleHardClose(p.id)} className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm shadow-red-500/20 flex justify-center items-center gap-1">
                                  <Lock className="w-3 h-3" /> إقفال تام للمرحلة
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {periods.length === 0 && <tr><td colSpan={4} className="text-center p-10 font-bold text-slate-500">لا توجد فترات مالية مسجلة في النظام</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Governance Log */}
              <div className="bg-red-50/50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-800/30 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-red-100 dark:border-red-800/30 bg-red-100/50 dark:bg-red-900/20 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-red-800 dark:text-red-400 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5" /> سجل الحوكمة والرقابة (مضاد التلاعب)
                  </h3>
                </div>
                <div className="p-5 overflow-x-auto">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-white/50 dark:bg-slate-900/50 text-red-700 dark:text-red-400">
                      <tr>
                        <th className="p-3 font-bold rounded-r-lg">وقت وتسجيل الحدث</th>
                        <th className="p-3 font-bold">المستخدم المسؤول</th>
                        <th className="p-3 font-bold rounded-l-lg">التفاصيل الفنية للاختراق</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-red-100 dark:divide-red-900/30">
                      {violations.map(v => (
                        <tr key={v.id} className="hover:bg-white/50 dark:hover:bg-slate-900/30 transition-colors">
                          <td className="p-3 font-[Fira_Code] font-bold text-slate-700 dark:text-slate-300">{new Date(v.date).toLocaleString('ar-SA')}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-slate-200">{v.user?.fullName || v.user?.username || 'System / غير معروف'}</td>
                          <td className="p-3 text-red-600 dark:text-red-400 font-bold text-xs bg-red-100/50 dark:bg-red-900/20 rounded m-1 inline-block">
                            {(() => {
                              try { return JSON.parse(v.details || '{}').reason || 'محاولة تلاعب بالحسابات'; }
                              catch (e) { return v.details || 'محاولة تلاعب بالحسابات المقفلة'; }
                            })()}
                          </td>
                        </tr>
                      ))}
                      {violations.length === 0 && (
                        <tr><td colSpan={3} className="text-center p-10 font-bold text-emerald-600 dark:text-emerald-400 flex flex-col items-center justify-center gap-2">
                          <CheckCircle2 className="w-12 h-12 opacity-50" />
                          النظام آمن تماماً، لا توجد أي محاولات اختراق مسجلة لدفاتر الأستاذ العام
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
