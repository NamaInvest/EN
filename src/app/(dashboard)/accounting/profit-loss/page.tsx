"use client";

import { useState, useEffect } from "react";
import { Download, Filter, TrendingUp } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function ProfitLossPage() {
  const { lang: language, t } = useTranslation();
  const isAr = language === 'ar';

  const [dates, setDates] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Dimensional filtering states
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedCostCenter, setSelectedCostCenter] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("");

  const [branches, setBranches] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [segments, setSegments] = useState<any[]>([]);

  useEffect(() => {
    fetchFilters();
    fetchProfitLoss();
  }, []);

  async function fetchFilters() {
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
  }

  async function fetchProfitLoss() {
    setLoading(true);
    setMsg(null);
    try {
      const token = localStorage.getItem("token") || "";
      const param = new URLSearchParams();
      param.set('type', 'INCOME_STATEMENT');
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
        const data = await res.json();
        setSections(data.incomeStatement?.sections ?? []);
        setSummary(data.incomeStatement ?? null);
      } else {
        setMsg("فشل جلب قائمة الدخل من السيرفر.");
      }
    } catch (e) {
      console.error(e);
      setMsg(String(e));
    } finally {
      setLoading(false);
    }
  }

  const fmtSAR = (n: any) => {
    const val = typeof n === 'object' && n && 'toNumber' in n ? n.toNumber() : Number(n || 0);
    return `${val.toLocaleString(isAr ? 'ar-SA' : 'en-US')} ر.س`;
  };

  const exportCSV = () => {
    const token = localStorage.getItem("token") || "";
    const param = new URLSearchParams();
    param.set('type', 'INCOME_STATEMENT');
    param.set('format', 'csv');
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
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3 justify-start">
            <TrendingUp className="w-8 h-8 text-indigo-600" /> 
            {isAr ? '📈 قائمة الدخل' : '📈 Profit & Loss Statement'}
          </h1>
          <p className="text-slate-500 mt-2">
            {isAr ? 'قائمة دخل متوافقة مع IFRS/SOCPA مع هوامش الربح' : 'IFRS/SOCPA compliant P&L with margin analysis'}
          </p>
        </div>
        
        {/* Date Pickers */}
        <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm border px-3 py-2 border-slate-200 self-start md:self-auto">
          <Filter size={16} className="text-slate-400" />
          <input type="date" className="text-sm outline-none text-slate-600 bg-transparent" value={dates.from} onChange={e => setDates({...dates, from: e.target.value})} />
          <span className="text-slate-300">-</span>
          <input type="date" className="text-sm outline-none text-slate-600 bg-transparent" value={dates.to} onChange={e => setDates({...dates, to: e.target.value})} />
          <button onClick={fetchProfitLoss} className="bg-indigo-600 hover:bg-indigo-700 transition-colors text-white font-semibold px-4 py-1.5 rounded-md text-xs ms-2">{t('pos.str_184')}</button>
          {sections.length > 0 && (
            <button onClick={exportCSV} className="bg-emerald-600 hover:bg-emerald-700 transition-colors text-white font-semibold px-3 py-1.5 rounded-md text-xs flex items-center gap-1">
              <Download size={14} />
              {isAr ? 'تصدير' : 'CSV'}
            </button>
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

      {/* KPI Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: isAr ? 'الإيرادات' : 'Revenue', value: fmtSAR(summary.totalRevenue), color: 'text-blue-600 bg-blue-50 border-blue-100' },
            { label: isAr ? 'مجمل الربح' : 'Gross Profit', value: fmtSAR(summary.grossProfit), color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
            { label: isAr ? 'هامش مجمل' : 'Gross Margin', value: summary.grossMargin, color: 'text-cyan-600 bg-cyan-50 border-cyan-100' },
            { label: 'EBIT', value: fmtSAR(summary.ebit), color: Number(summary.ebit || 0) >= 0 ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-rose-600 bg-rose-50 border-rose-100' },
            { label: isAr ? 'صافي الربح' : 'Net Income', value: fmtSAR(summary.netIncome), color: Number(summary.netIncome || 0) >= 0 ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-rose-600 bg-rose-50 border-rose-100' },
          ].map((c, i) => (
            <div key={i} className={`rounded-xl border p-4 text-center space-y-2 shadow-sm ${c.color}`}>
              <div className="text-lg md:text-xl font-extrabold font-mono" dir="ltr">{c.value}</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Sections Table list */}
      {sections.map(sec => (
        <div key={sec.section} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <span className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">{sec.section}</span>
            <span className="font-extrabold text-sm text-indigo-700 font-mono" dir="ltr">{fmtSAR(sec.total)}</span>
          </div>
          <table className="w-full text-sm text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-xs border-b border-slate-100 uppercase tracking-wider">
                <th className="px-5 py-2.5 font-bold w-24">كود الحساب</th>
                <th className="px-5 py-2.5 font-bold text-right">اسم الحساب</th>
                <th className="px-5 py-2.5 font-bold text-left w-36">الرصيد الحالي</th>
                {sec.lines.some((l: any) => l.compare !== null) && (
                  <th className="px-5 py-2.5 font-bold text-left w-36 text-slate-400">الفترة السابقة</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sec.lines.map((a: any) => (
                <tr key={a.code} className="hover:bg-slate-50/50 transition">
                  <td className="px-5 py-3 font-mono text-slate-400 text-xs">{a.code}</td>
                  <td className="px-5 py-3 text-slate-700 font-semibold">{a.name}</td>
                  <td className="px-5 py-3 text-left font-bold text-slate-700 font-mono" dir="ltr">{fmtSAR(a.amount)}</td>
                  {a.compare !== null && (
                    <td className="px-5 py-3 text-left font-semibold text-slate-400 font-mono" dir="ltr">{fmtSAR(a.compare)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Empty State */}
      {!sections.length && !loading && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm max-w-md mx-auto space-y-4">
          <div className="text-5xl">📊</div>
          <h3 className="font-extrabold text-slate-800 text-lg">قائمة الدخل فارغة</h3>
          <p className="text-slate-500 text-xs leading-relaxed">لم يتم العثور على أي حركات مسجلة للفترة الزمنية أو فلاتر الأبعاد المحددة. يرجى تعديل خيارات البحث والمحاولة مرة أخرى.</p>
        </div>
      )}
    </div>
  );
}
