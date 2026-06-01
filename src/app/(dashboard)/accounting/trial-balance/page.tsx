"use client";

import { useState, useEffect } from "react";
import { Scale, FileText, ChevronDown, ChevronRight, Download, Filter } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

export default function TrialBalancePage() {

 const { t } = useTranslation();
 const [accounts, setAccounts] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [dates, setDates] = useState({ from: "", to: "" });
 const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

 // Dimensional filtering and compliance states
 const [selectedBranch, setSelectedBranch] = useState("");
 const [selectedCostCenter, setSelectedCostCenter] = useState("");
 const [selectedProject, setSelectedProject] = useState("");
 const [selectedSegment, setSelectedSegment] = useState("");
 const [validateCompliance, setValidateCompliance] = useState(false);
 const [complianceResult, setComplianceResult] = useState<any>(null);

 const [branches, setBranches] = useState<any[]>([]);
 const [costCenters, setCostCenters] = useState<any[]>([]);
 const [projects, setProjects] = useState<any[]>([]);
 const [segments, setSegments] = useState<any[]>([]);

 useEffect(() => {
   fetchFilters();
   fetchTrialBalance();
 }, []);

 const fetchFilters = async () => {
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
 };

 const fetchTrialBalance = async () => {
   setLoading(true);
   setComplianceResult(null);
   try {
     const token = localStorage.getItem("token") || "";
     const param = new URLSearchParams();
     if (dates.from) param.set('from', dates.from);
     if (dates.to) param.set('to', dates.to);
     if (selectedBranch) param.set('branchId', selectedBranch);
     if (selectedCostCenter) param.set('costCenterId', selectedCostCenter);
     if (selectedProject) param.set('projectId', selectedProject);
     if (selectedSegment) param.set('segmentId', selectedSegment);
     if (validateCompliance) param.set('validate', 'true');

     const res = await fetch(`/api/accounting/trial-balance?${param.toString()}`, {
       headers: { Authorization: `Bearer ${token}` }
     });
     if (res.ok) {
       const data = await res.json();
       setAccounts(data.accounts || []);
       if (data.compliance) {
         setComplianceResult(data.compliance);
       }
     }
   } catch (e) {
     console.error(e);
   } finally {
     setLoading(false);
   }
 };

 const toggleNode = (id: number) => {
 const next = new Set(expandedNodes);
 if (next.has(id)) next.delete(id);
 else next.add(id);
 setExpandedNodes(next);
 };

 // Build the hierarchical tree and compute parent totals
 const buildTree = (parentId: number = 0): any[] => {
 const children = accounts.filter(a => a.parentId === parentId);
 
 return children.map((child: any) => {
 const descendants: any[] = buildTree(child.id);
 
 // A parent's rolled-up debit and credit is its own explicit lines + all descendants' lines
 const rolledDebit = descendants.reduce((acc: any, d: any) => acc + d.rolledDebit, child.periodDebit || 0);
 const rolledCredit = descendants.reduce((acc: any, d: any) => acc + d.rolledCredit, child.periodCredit || 0);
 const rolledNet = descendants.reduce((acc: any, d: any) => acc + d.rolledNet, child.netBalance || 0);

 return {
 ...child,
 children: descendants,
 rolledDebit,
 rolledCredit,
 rolledNet
 };
 });
 };

 const renderRows = (nodes: any[], depth: number = 0) => {
 let result: any[] = [];
 
 nodes.forEach(node => {
 const isExpanded = expandedNodes.has(node.id);
 const hasChildren = node.children && node.children.length > 0;
 const isTopLevel = depth === 0;

 result.push(
 <tr key={node.id} className={`border-b border-slate-100 hover:bg-slate-50 transition ${isTopLevel ? 'bg-slate-50 border-t-2 border-slate-200' : ''}`}>
 <td className="px-4 py-3 cursor-pointer" onClick={() => hasChildren && toggleNode(node.id)}>
 <div className="flex items-center gap-2" style={{ paddingRight: `${depth * 24}px` }}>
 {hasChildren ? (
 isExpanded ? <ChevronDown size={16} className="text-slate-500"/> : <ChevronRight size={16} className="text-slate-500"/>
 ) : <div className="w-4 h-4" />}
 
 <span className={`font-mono ${isTopLevel ? 'font-bold text-slate-800' : 'text-slate-600'}`}>{node.code}</span>
 <span className={`${isTopLevel ? 'font-bold text-slate-800' : 'text-slate-700'}`}>{node.name}</span>
 </div>
 </td>
 <td className="px-4 py-3 text-center text-xs text-slate-400 uppercase">{node.type}</td>
 <td className="px-4 py-3 text-left font-semibold text-slate-600" dir="ltr">{node.rolledDebit?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
 <td className="px-4 py-3 text-left font-semibold text-slate-600" dir="ltr">{node.rolledCredit?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
 <td className={`px-4 py-3 text-left font-bold ${node.rolledNet >= 0 ? 'text-emerald-600' : 'text-red-500'}`} dir="ltr">
 {node.rolledNet?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
 </td>
 </tr>
 );

 if (isExpanded && hasChildren) {
 result = [...result, ...renderRows(node.children, depth + 1)];
 }
 });

 return result;
 };

 const tree = buildTree(0);
 const totalCompanyDebit = tree.reduce((acc: number, curr: any) => acc + curr.rolledDebit, 0);
 const totalCompanyCredit = tree.reduce((acc: number, curr: any) => acc + curr.rolledCredit, 0);
 const isBalanced = Math.abs(totalCompanyDebit - totalCompanyCredit) < 0.01;

  return (
  <div className="p-6 max-w-7xl mx-auto space-y-6">
    {/* Header */}
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
          <Scale className="w-8 h-8 text-indigo-600" /> {t('fin.str_1719')}
        </h1>
        <p className="text-slate-500 mt-2">{t('fin.str_1720')}</p>
      </div>
      
      {/* Date Pickers */}
      <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm border px-3 py-2 border-slate-200">
        <Filter size={16} className="text-slate-400" />
        <input type="date" className="text-sm outline-none text-slate-600 bg-transparent" value={dates.from} onChange={e => setDates({...dates, from: e.target.value})} />
        <span className="text-slate-300">-</span>
        <input type="date" className="text-sm outline-none text-slate-600 bg-transparent" value={dates.to} onChange={e => setDates({...dates, to: e.target.value})} />
        <button onClick={fetchTrialBalance} className="bg-indigo-600 hover:bg-indigo-700 transition-colors text-white font-semibold px-4 py-1.5 rounded-md text-xs ms-2">{t('pos.str_184')}</button>
      </div>
    </div>

    {/* Modern Dimensional Filters Bar */}
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Branch Select */}
      <div className="flex flex-col gap-1.5">
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
      <div className="flex flex-col gap-1.5">
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
      <div className="flex flex-col gap-1.5">
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
      <div className="flex flex-col gap-1.5">
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

      {/* Compliance Toggle */}
      <div className="flex flex-col justify-end">
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none bg-white border border-slate-200 rounded-lg p-2.5 hover:bg-slate-100 transition">
          <input 
            type="checkbox" 
            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" 
            checked={validateCompliance} 
            onChange={e => setValidateCompliance(e.target.checked)} 
          />
          <span className="font-semibold text-xs text-slate-700">تفعيل فحص الامتثال SOCPA</span>
        </label>
      </div>
    </div>

    {/* Compliance Auditing Dashboard Card */}
    {complianceResult && (
      <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-5 shadow-lg space-y-4 animate-fadeIn">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <FileText className="w-5 h-5 text-indigo-400" />
          <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-300">لوحة تدقيق الامتثال المالي والرقابة (IFRS/SOCPA Audit Dashboard)</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Invariant 1: Trial Balance */}
          <div className="bg-slate-800/50 border border-slate-800 rounded-lg p-3 space-y-1">
            <span className="text-slate-400 text-xs block">ميزان المراجعة الإجمالي</span>
            <div className="flex justify-between items-center">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${complianceResult.isTrialBalanceBalanced ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {complianceResult.isTrialBalanceBalanced ? 'متوازن' : 'غير متوازن'}
              </span>
              <span className="font-mono text-xs text-slate-300">
                الفرق: {parseFloat(complianceResult.trialBalanceDifference || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Invariant 2: Cash Flow */}
          <div className="bg-slate-800/50 border border-slate-800 rounded-lg p-3 space-y-1">
            <span className="text-slate-400 text-xs block">تطابق أرصدة النقدية</span>
            <div className="flex justify-between items-center">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${complianceResult.isCashFlowReconciled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {complianceResult.isCashFlowReconciled ? 'متطابق' : 'يوجد فروقات'}
              </span>
              <span className="font-mono text-xs text-slate-300">
                الفرق: {parseFloat(complianceResult.cashFlowDifference || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Invariant 3: Temporary Year-End */}
          <div className="bg-slate-800/50 border border-slate-800 rounded-lg p-3 space-y-1">
            <span className="text-slate-400 text-xs block">إقفال الحسابات المؤقتة</span>
            <div className="flex justify-between items-center">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${complianceResult.areTemporaryAccountsClosed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {complianceResult.areTemporaryAccountsClosed ? 'مقفلة بالكامل' : 'وجود أرصدة مفتوحة'}
              </span>
            </div>
          </div>

          {/* Invariant 4: Control Accounts Direct Postings */}
          <div className="bg-slate-800/50 border border-slate-800 rounded-lg p-3 space-y-1">
            <span className="text-slate-400 text-xs block">أمن الحسابات الرقابية</span>
            <div className="flex justify-between items-center">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${complianceResult.controlAccountsAuditPassed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {complianceResult.controlAccountsAuditPassed ? 'اجتاز الفحص' : 'رصد حركات يدوية'}
              </span>
            </div>
          </div>
        </div>

        {/* Audit Findings */}
        {complianceResult.auditFindings && complianceResult.auditFindings.length > 0 && (
          <div className="bg-slate-950/70 border border-slate-900 rounded-lg p-3.5 space-y-2 text-xs">
            <span className="font-extrabold text-slate-400 uppercase tracking-wider block">نتائج وتوصيات التدقيق التفصيلية:</span>
            <ul className="list-disc list-inside space-y-1.5 text-slate-300 leading-relaxed">
              {complianceResult.auditFindings.map((finding: string, idx: number) => (
                <li key={idx} className="marker:text-indigo-400">{finding}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )}

    {/* Main Trial Balance Table */}
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {loading ? (
        <div className="p-12 text-center text-slate-400">{t('fin.str_1721')}</div>
      ) : (
        <table className="w-full text-sm text-right">
          <thead className="bg-indigo-50 border-b border-indigo-100 text-indigo-900">
            <tr>
              <th className="px-4 py-4 font-bold text-right">{t('fin.str_1722')}</th>
              <th className="px-4 py-4 font-bold text-center">{t('fin.str_199')}</th>
              <th className="px-4 py-4 font-bold text-left">{t('fin.str_1723')}</th>
              <th className="px-4 py-4 font-bold text-left">{t('fin.str_1724')}</th>
              <th className="px-4 py-4 font-bold text-left">{t('fin.str_1725')}</th>
            </tr>
          </thead>
          <tbody>
            {renderRows(tree, 0)}
          </tbody>
          <tfoot className="bg-slate-800 text-white font-bold">
            <tr>
              <td className="px-4 py-4 text-center" colSpan={2}>{t('fin.str_1726')}</td>
              <td className="px-4 py-4 text-left font-mono" dir="ltr">{totalCompanyDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td className="px-4 py-4 text-left font-mono" dir="ltr">{totalCompanyCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td className="px-4 py-4 text-center">
                {isBalanced ? 
                  <span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded">{t('fin.str_1727')}</span> : 
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">{t('fin.str_1728')}</span>
                }
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  </div>
  );
}
