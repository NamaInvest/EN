"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, Filter, Scale } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface FilterOption {
  id: string | number;
  name: string;
  code?: string;
}

interface BSLine {
  code: string;
  name: string;
  balance: number;
  compare: number | null;
}

interface BSData {
  assets: {
    current: BSLine[];
    fixed: BSLine[];
    total: number;
  };
  liabilities: {
    current: BSLine[];
    longTerm: BSLine[];
    total: number;
  };
  equity: {
    items: BSLine[];
    total: number;
  };
  isBalanced: boolean;
  difference: number;
}

export default function BalanceSheetPage() {
  const { lang: language, t } = useTranslation();
  const isAr = language === 'ar';
  const _t = (ar: string, en: string) => isAr ? ar : en;

  const [dates, setDates] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BSData | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Dimensional filtering states
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedCostCenter, setSelectedCostCenter] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("");

  const [branches, setBranches] = useState<FilterOption[]>([]);
  const [costCenters, setCostCenters] = useState<FilterOption[]>([]);
  const [projects, setProjects] = useState<FilterOption[]>([]);
  const [segments, setSegments] = useState<FilterOption[]>([]);

  const fetchFilters = useCallback(async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const headers = { Authorization: `Bearer ${token}` };

      const [b, cc, p, s] = await Promise.all([
        fetch('/api/branches', { headers }).then(r => r.ok ? r.json() : []),
        fetch('/api/accounting/cost-centers', { headers }).then(r => r.ok ? r.json() : []),
        fetch('/api/enterprise/projects', { headers }).then(r => r.ok ? r.json() : []),
        fetch('/api/accounting/segments', { headers }).then(r => r.ok ? r.json() : [])
      ]);

      setBranches(Array.isArray(b) ? b : []);
      setCostCenters(Array.isArray(cc) ? cc : []);
      setProjects(Array.isArray(p) ? p : []);
      setSegments(Array.isArray(s) ? s : []);
    } catch (e) {
      console.error("Failed to load dimensional filters", e);
    }
  }, []);

  const fetchBalanceSheet = useCallback(async () => {
    setLoading(true);
    setMsg(null);
    try {
      const token = localStorage.getItem("token") || "";
      const param = new URLSearchParams();
      param.set('type', 'BALANCE_SHEET');
      if (dates.from) param.set('from', dates.from);
      if (dates.to) param.set('to', dates.to);
      if (selectedBranch) param.set('branchId', selectedBranch);
      if (selectedCostCenter) param.set('costCenterId', selectedCostCenter);
      if (selectedProject) param.set('projectId', selectedProject);
      if (selectedSegment) param.set('segmentId', selectedSegment);

      const res = await fetch(`/api/accounting/financial-statements?${param.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const payload = await res.json();
        const rawBS = payload.balanceSheet;

        if (rawBS && Array.isArray(rawBS.lines)) {
          const rawLines = rawBS.lines;

          const getVal = (val: unknown): number => {
            if (val === null || val === undefined) return 0;
            if (typeof val === 'object' && val !== null && 'toNumber' in val && typeof (val as { toNumber: unknown }).toNumber === 'function') {
              return (val as { toNumber: () => number }).toNumber();
            }
            return Number(val);
          };

          const currentAssets: BSLine[] = [];
          const fixedAssets: BSLine[] = [];
          const currentLiabilities: BSLine[] = [];
          const longTermLiabilities: BSLine[] = [];
          const equityItems: BSLine[] = [];

          rawLines.forEach((l: { section?: string; code?: string; label?: string; currentPeriod?: unknown; priorPeriod?: unknown }) => {
            const sect = l.section;
            const lineItem: BSLine = {
              code: l.code || '',
              name: l.label || '',
              balance: getVal(l.currentPeriod),
              compare: l.priorPeriod !== undefined && l.priorPeriod !== null ? getVal(l.priorPeriod) : null
            };

            if (sect === 'CURRENT_ASSETS') {
              currentAssets.push(lineItem);
            } else if (sect === 'NON_CURRENT_ASSETS') {
              fixedAssets.push(lineItem);
            } else if (sect === 'CURRENT_LIAB') {
              currentLiabilities.push(lineItem);
            } else if (sect === 'NON_CURRENT_LIAB') {
              longTermLiabilities.push(lineItem);
            } else if (sect === 'EQUITY') {
              equityItems.push(lineItem);
            }
          });

          const totCurrentAssets = currentAssets.reduce((sum, item) => sum + item.balance, 0);
          const totFixedAssets = fixedAssets.reduce((sum, item) => sum + item.balance, 0);
          const totAssets = totCurrentAssets + totFixedAssets;

          const totCurrentLiabilities = currentLiabilities.reduce((sum, item) => sum + item.balance, 0);
          const totLongTermLiabilities = longTermLiabilities.reduce((sum, item) => sum + item.balance, 0);
          const totLiabilities = totCurrentLiabilities + totLongTermLiabilities;

          const totEquity = equityItems.reduce((sum, item) => sum + item.balance, 0);

          const diff = Math.abs(totAssets - (totLiabilities + totEquity));
          const isBalanced = diff <= 1.0; // small decimal tolerance of 1.0 SAR

          setData({
            assets: {
              current: currentAssets,
              fixed: fixedAssets,
              total: totAssets
            },
            liabilities: {
              current: currentLiabilities,
              longTerm: longTermLiabilities,
              total: totLiabilities
            },
            equity: {
              items: equityItems,
              total: totEquity
            },
            isBalanced,
            difference: diff
          });
        } else {
          setData(null);
        }
      } else {
        setMsg("فشل جلب الميزانية العمومية من السيرفر.");
      }
    } catch (e) {
      console.error(e);
      setMsg(String(e));
    } finally {
      setLoading(false);
    }
  }, [dates, selectedBranch, selectedCostCenter, selectedProject, selectedSegment]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchFilters();
    fetchBalanceSheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const fmtSAR = (n: number | string | { toNumber?: () => number } | null | undefined) => {
    let val = 0;
    if (n !== null && n !== undefined) {
      if (typeof n === 'object' && n.toNumber && typeof n.toNumber === 'function') {
        val = n.toNumber();
      } else {
        val = Number(n);
      }
    }
    return `${val.toLocaleString(isAr ? 'ar-SA' : 'en-US')} ر.س`;
  };

  const exportReport = (format: 'xlsx' | 'pdf') => {
    const token = localStorage.getItem("token") || "";
    const param = new URLSearchParams();
    param.set('type', 'BALANCE_SHEET');
    param.set('format', format);
    if (dates.from) param.set('from', dates.from);
    if (dates.to) param.set('to', dates.to);
    if (selectedBranch) param.set('branchId', selectedBranch);
    if (selectedCostCenter) param.set('costCenterId', selectedCostCenter);
    if (selectedProject) param.set('projectId', selectedProject);
    if (selectedSegment) param.set('segmentId', selectedSegment);

    window.open(`/api/accounting/financial-statements?${param.toString()}&token=${token}`, '_blank');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-right" dir={isAr ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b pb-4 border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3 justify-start">
            <Scale className="w-8 h-8 text-indigo-600" />
            {isAr ? '⚖️ الميزانية العمومية' : '⚖️ Balance Sheet'}
          </h1>
          <p className="text-slate-500 mt-2">
            {isAr ? 'بيان المركز المالي للمنشأة متوافق مع معايير IFRS/SOCPA' : 'Statement of financial position compliant with IFRS/SOCPA'}
          </p>
        </div>

        {/* Date Pickers */}
        <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm border px-3 py-2 border-slate-200 self-start md:self-auto">
          <Filter size={16} className="text-slate-400" />
          <input type="date" className="text-sm outline-none text-slate-600 bg-transparent" value={dates.from} onChange={e => setDates({...dates, from: e.target.value})} />
          <span className="text-slate-300">-</span>
          <input type="date" className="text-sm outline-none text-slate-600 bg-transparent" value={dates.to} onChange={e => setDates({...dates, to: e.target.value})} />
          <button onClick={fetchBalanceSheet} className="bg-indigo-600 hover:bg-indigo-700 transition-colors text-white font-semibold px-4 py-1.5 rounded-md text-xs ms-2">{t('pos.str_184')}</button>
          {data && (
            <>
              <button onClick={() => exportReport('xlsx')} className="bg-emerald-600 hover:bg-emerald-700 transition-colors text-white font-semibold px-3 py-1.5 rounded-md text-xs flex items-center gap-1">
                <Download size={14} />
                {isAr ? 'تصدير' : 'Excel'}
              </button>
              <button onClick={() => exportReport('pdf')} className="bg-rose-600 hover:bg-rose-700 transition-colors text-white font-semibold px-3 py-1.5 rounded-md text-xs flex items-center gap-1">
                <Download size={14} />
                PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modern Dimensional Filters Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Branch Select */}
        <div className="flex flex-col gap-1.5 text-right">
          <label className="text-xs font-bold text-slate-500">الفرع (Branch)</label>
          <select
            className="text-sm border border-slate-200 rounded-lg p-2 bg-white outline-none focus:border-indigo-500 text-slate-700 transition"
            value={selectedBranch}
            onChange={e => setSelectedBranch(e.target.value)}
          >
            <option value="">كافة الفروع</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Cost Center Select */}
        <div className="flex flex-col gap-1.5 text-right">
          <label className="text-xs font-bold text-slate-500">مركز التكلفة (Cost Center)</label>
          <select
            className="text-sm border border-slate-200 rounded-lg p-2 bg-white outline-none focus:border-indigo-500 text-slate-700 transition"
            value={selectedCostCenter}
            onChange={e => setSelectedCostCenter(e.target.value)}
          >
            <option value="">كافة مراكز التكلفة</option>
            {costCenters.map(cc => (
              <option key={cc.id} value={cc.id}>{cc.code} - {cc.name}</option>
            ))}
          </select>
        </div>

        {/* Project Select */}
        <div className="flex flex-col gap-1.5 text-right">
          <label className="text-xs font-bold text-slate-500">المشروع (Project)</label>
          <select
            className="text-sm border border-slate-200 rounded-lg p-2 bg-white outline-none focus:border-indigo-500 text-slate-700 transition"
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
          >
            <option value="">كافة المشروعات</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Segment Select */}
        <div className="flex flex-col gap-1.5 text-right">
          <label className="text-xs font-bold text-slate-500">القطاع (Segment)</label>
          <select
            className="text-sm border border-slate-200 rounded-lg p-2 bg-white outline-none focus:border-indigo-500 text-slate-700 transition"
            value={selectedSegment}
            onChange={e => setSelectedSegment(e.target.value)}
          >
            <option value="">كافة القطاعات</option>
            {segments.map(s => (
              <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {msg && <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-sm font-semibold">❌ {msg}</div>}

      {loading && <div className="p-12 text-center text-indigo-600 font-bold text-lg">{isAr ? 'جاري إعداد الميزانية العمومية...' : 'Preparing Balance Sheet...'}</div>}

      {/* KPI Balance Status Alert */}
      {data && (
        <div className={`p-4 rounded-xl shadow-sm border font-bold text-sm text-center transition ${data.isBalanced ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-100'}`}>
          {data.isBalanced
            ? _t('✅ الميزانية متوازنة تماماً (الأصول = الخصوم + حقوق الملكية)', '✅ Balance Sheet is perfectly balanced (Assets = Liabilities + Equity)')
            : _t(`⚠️ الميزانية غير متوازنة! الفارق: ${fmtSAR(data.difference)}`, `⚠️ Balance Sheet is out of balance! Difference: ${fmtSAR(data.difference)}`)
          }
        </div>
      )}

      {/* Main Grid: Assets vs Liabilities & Equity */}
      {data && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Assets Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <span className="font-extrabold text-sm text-slate-800 tracking-wider">{_t('الأصول المتداولة', 'Current Assets')}</span>
                <span className="font-extrabold text-sm text-indigo-700 font-mono" dir="ltr">
                  {fmtSAR(data.assets.current.reduce((sum, item) => sum + item.balance, 0))}
                </span>
              </div>
              <table className="w-full text-sm text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-xs border-b border-slate-100 uppercase tracking-wider">
                    <th className="px-5 py-2.5 font-bold w-24">كود الحساب</th>
                    <th className="px-5 py-2.5 font-bold text-right">اسم الحساب</th>
                    <th className="px-5 py-2.5 font-bold text-left w-36">الرصيد الحالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.assets.current.map(a => (
                    <tr key={a.code + a.name} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3 font-mono text-slate-400 text-xs">{a.code}</td>
                      <td className="px-5 py-3 text-slate-700 font-semibold">{a.name}</td>
                      <td className="px-5 py-3 text-left font-bold text-slate-700 font-mono" dir="ltr">{fmtSAR(a.balance)}</td>
                    </tr>
                  ))}
                  {!data.assets.current.length && (
                    <tr>
                      <td colSpan={3} className="px-5 py-4 text-center text-slate-400 text-xs">{_t('لا توجد أصول متداولة', 'No current assets')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <span className="font-extrabold text-sm text-slate-800 tracking-wider">{_t('الأصول غير المتداولة (الثابتة)', 'Non-Current Assets')}</span>
                <span className="font-extrabold text-sm text-indigo-700 font-mono" dir="ltr">
                  {fmtSAR(data.assets.fixed.reduce((sum, item) => sum + item.balance, 0))}
                </span>
              </div>
              <table className="w-full text-sm text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-xs border-b border-slate-100 uppercase tracking-wider">
                    <th className="px-5 py-2.5 font-bold w-24">كود الحساب</th>
                    <th className="px-5 py-2.5 font-bold text-right">اسم الحساب</th>
                    <th className="px-5 py-2.5 font-bold text-left w-36">الرصيد الحالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.assets.fixed.map(a => (
                    <tr key={a.code + a.name} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3 font-mono text-slate-400 text-xs">{a.code}</td>
                      <td className="px-5 py-3 text-slate-700 font-semibold">{a.name}</td>
                      <td className="px-5 py-3 text-left font-bold text-slate-700 font-mono" dir="ltr">{fmtSAR(a.balance)}</td>
                    </tr>
                  ))}
                  {!data.assets.fixed.length && (
                    <tr>
                      <td colSpan={3} className="px-5 py-4 text-center text-slate-400 text-xs">{_t('لا توجد أصول غير متداولة', 'No non-current assets')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Assets Summary */}
            <div className="bg-slate-100 border border-slate-300 rounded-xl p-4 flex justify-between items-center shadow-sm">
              <span className="font-extrabold text-lg text-slate-800">{_t('إجمالي الأصول (Assets)', 'Total Assets')}</span>
              <span className="font-extrabold text-lg text-indigo-700 font-mono" dir="ltr">{fmtSAR(data.assets.total)}</span>
            </div>
          </div>

          {/* Liabilities & Equity Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <span className="font-extrabold text-sm text-slate-800 tracking-wider">{_t('الخصوم المتداولة', 'Current Liabilities')}</span>
                <span className="font-extrabold text-sm text-red-700 font-mono" dir="ltr">
                  {fmtSAR(data.liabilities.current.reduce((sum, item) => sum + item.balance, 0))}
                </span>
              </div>
              <table className="w-full text-sm text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-xs border-b border-slate-100 uppercase tracking-wider">
                    <th className="px-5 py-2.5 font-bold w-24">كود الحساب</th>
                    <th className="px-5 py-2.5 font-bold text-right">اسم الحساب</th>
                    <th className="px-5 py-2.5 font-bold text-left w-36">الرصيد الحالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.liabilities.current.map(a => (
                    <tr key={a.code + a.name} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3 font-mono text-slate-400 text-xs">{a.code}</td>
                      <td className="px-5 py-3 text-slate-700 font-semibold">{a.name}</td>
                      <td className="px-5 py-3 text-left font-bold text-slate-700 font-mono" dir="ltr">{fmtSAR(a.balance)}</td>
                    </tr>
                  ))}
                  {!data.liabilities.current.length && (
                    <tr>
                      <td colSpan={3} className="px-5 py-4 text-center text-slate-400 text-xs">{_t('لا توجد خصوم متداولة', 'No current liabilities')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <span className="font-extrabold text-sm text-slate-800 tracking-wider">{_t('الخصوم غير المتداولة (طويلة الأجل)', 'Non-Current Liabilities')}</span>
                <span className="font-extrabold text-sm text-red-700 font-mono" dir="ltr">
                  {fmtSAR(data.liabilities.longTerm.reduce((sum, item) => sum + item.balance, 0))}
                </span>
              </div>
              <table className="w-full text-sm text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-xs border-b border-slate-100 uppercase tracking-wider">
                    <th className="px-5 py-2.5 font-bold w-24">كود الحساب</th>
                    <th className="px-5 py-2.5 font-bold text-right">اسم الحساب</th>
                    <th className="px-5 py-2.5 font-bold text-left w-36">الرصيد الحالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.liabilities.longTerm.map(a => (
                    <tr key={a.code + a.name} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3 font-mono text-slate-400 text-xs">{a.code}</td>
                      <td className="px-5 py-3 text-slate-700 font-semibold">{a.name}</td>
                      <td className="px-5 py-3 text-left font-bold text-slate-700 font-mono" dir="ltr">{fmtSAR(a.balance)}</td>
                    </tr>
                  ))}
                  {!data.liabilities.longTerm.length && (
                    <tr>
                      <td colSpan={3} className="px-5 py-4 text-center text-slate-400 text-xs">{_t('لا توجد خصوم غير متداولة', 'No non-current liabilities')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <span className="font-extrabold text-sm text-slate-800 tracking-wider">{_t('حقوق الملكية', 'Equity')}</span>
                <span className="font-extrabold text-sm text-emerald-700 font-mono" dir="ltr">
                  {fmtSAR(data.equity.total)}
                </span>
              </div>
              <table className="w-full text-sm text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-xs border-b border-slate-100 uppercase tracking-wider">
                    <th className="px-5 py-2.5 font-bold w-24">كود الحساب</th>
                    <th className="px-5 py-2.5 font-bold text-right">اسم الحساب</th>
                    <th className="px-5 py-2.5 font-bold text-left w-36">الرصيد الحالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.equity.items.map(a => (
                    <tr key={a.code + a.name} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3 font-mono text-slate-400 text-xs">{a.code}</td>
                      <td className="px-5 py-3 text-slate-700 font-semibold">{a.name}</td>
                      <td className="px-5 py-3 text-left font-bold text-slate-700 font-mono" dir="ltr">{fmtSAR(a.balance)}</td>
                    </tr>
                  ))}
                  {!data.equity.items.length && (
                    <tr>
                      <td colSpan={3} className="px-5 py-4 text-center text-slate-400 text-xs">{_t('لا توجد بنود حقوق ملكية', 'No equity items')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Liabilities & Equity Summary */}
            <div className="bg-slate-100 border border-slate-300 rounded-xl p-4 flex justify-between items-center shadow-sm">
              <span className="font-extrabold text-lg text-slate-800">{_t('إجمالي الخصوم وحقوق الملكية', 'Total Liabilities & Equity')}</span>
              <span className="font-extrabold text-lg text-indigo-700 font-mono" dir="ltr">{fmtSAR(data.liabilities.total + data.equity.total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!data && !loading && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm max-w-md mx-auto space-y-4">
          <div className="text-5xl">📊</div>
          <h3 className="font-extrabold text-slate-800 text-lg">الميزانية العمومية فارغة</h3>
          <p className="text-slate-500 text-xs leading-relaxed">لم يتم العثور على أي حركات مسجلة للفترة الزمنية أو فلاتر الأبعاد المحددة. يرجى تعديل خيارات البحث والمحاولة مرة أخرى.</p>
        </div>
      )}
    </div>
  );
}
