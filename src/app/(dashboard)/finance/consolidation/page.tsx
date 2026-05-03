'use client';
import React, { useState, useEffect } from 'react';
import { Building2, Play, Eye, CheckCircle, RotateCcw } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function ConsolidationDashboard() {
    const { lang } = useTranslation();
    const { success } = useToast();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [runs, setRuns] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<any>(null);
    const headers = { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}` };

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/finance/consolidation', { headers });
            if (res.ok) { const d = await res.json(); setRuns(d.runs||[]); setGroups(d.groups||[]); }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const runAction = async (action: string, runId?: number) => {
        try {
            const body: any = { action };
            if (runId) body.runId = runId;
            if (action === 'run') { body.groupId = parseInt(selectedGroup); body.fiscalPeriodId = 1; }
            const res = await fetch('/api/finance/consolidation', {
                method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body)
            });
            if (res.ok) { success(_t('تم التنفيذ بنجاح', 'Action completed')); fetchData(); }
        } catch (e) { console.error(e); }
    };

    const viewSummary = async (runId: number) => {
        try {
            const res = await fetch(`/api/finance/consolidation?action=summary&runId=${runId}`, { headers });
            if (res.ok) setSummary((await res.json()).summary);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetchData(); }, []);
    const fmt = (n: number) => Number(n||0).toLocaleString();
    const statusColor = (s: string) => s==='POSTED'?'bg-green-100 text-green-800':s==='REVIEWED'?'bg-blue-100 text-blue-800':s==='REVERSED'?'bg-red-100 text-red-800':'bg-yellow-100 text-yellow-800';

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Building2 className="w-8 h-8 mr-3 text-purple-600" />
                        {_t('محرك التوحيد المالي', 'Financial Consolidation')}
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">{_t('IFRS 10 / IAS 21 — توحيد القوائم وإزالة العمليات بين الشركات', 'IFRS 10 / IAS 21 — Group consolidation & IC eliminations')}</p>
                </div>
                <div className="flex gap-2">
                    <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} className="px-3 py-2 border rounded-md text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                        <option value="">{_t('اختر المجموعة', 'Select Group')}</option>
                        {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <button onClick={() => runAction('run')} disabled={!selectedGroup} className="px-4 py-2 rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 flex items-center">
                        <Play className="w-4 h-4 mr-2" />{_t('تشغيل التوحيد', 'Run Consolidation')}
                    </button>
                </div>
            </div>

            {summary && (
                <div className="bg-white dark:bg-gray-800 border rounded-lg shadow-sm p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">{_t('ملخص التوحيد', 'Run Summary')} #{summary.runId}</h2>
                        <button onClick={() => setSummary(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded"><p className="text-xs text-gray-500">{_t('الحالة','Status')}</p><p className="font-bold">{summary.status}</p></div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded"><p className="text-xs text-gray-500">{_t('الإزالات','Eliminations')}</p><p className="font-bold font-mono">{summary.totalEliminations} ({fmt(summary.totalEliminationAmount)})</p></div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded"><p className="text-xs text-gray-500">{_t('فروقات العملة','CTA')}</p><p className="font-bold font-mono">{fmt(summary.ctaAmount)}</p></div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded"><p className="text-xs text-gray-500">{_t('حقوق الأقلية','NCI')}</p><p className="font-bold font-mono">{fmt(summary.nciAmount)}</p></div>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 border rounded-lg shadow-sm">
                <div className="p-4 border-b bg-gray-50 dark:bg-gray-900/50">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">{_t('عمليات التوحيد', 'Consolidation Runs')}</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead><tr>
                            {[_t('الرقم','#'),_t('المجموعة','Group'),_t('الحالة','Status'),_t('التاريخ','Date'),_t('إجراءات','Actions')].map(h=>
                                <th key={h} className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>)}
                        </tr></thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading?<tr><td colSpan={5} className="text-center py-10 text-gray-500">{_t('جاري التحميل...','Loading...')}</td></tr>:
                            runs.length===0?<tr><td colSpan={5} className="text-center py-10 text-gray-500">{_t('لا توجد عمليات','No runs yet')}</td></tr>:
                            runs.map((r:any)=>(
                                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4 text-sm font-mono">{r.id}</td>
                                    <td className="px-6 py-4 text-sm">{r.group?.name||r.groupId}</td>
                                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold ${statusColor(r.status)}`}>{r.status}</span></td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 flex gap-1">
                                        <button onClick={()=>viewSummary(r.id)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View"><Eye className="w-4 h-4"/></button>
                                        {r.status==='DRAFT'&&<button onClick={()=>runAction('review',r.id)} className="p-1 text-yellow-600 hover:bg-yellow-50 rounded" title="Review"><CheckCircle className="w-4 h-4"/></button>}
                                        {r.status==='REVIEWED'&&<button onClick={()=>runAction('post',r.id)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Post"><CheckCircle className="w-4 h-4"/></button>}
                                        {r.status!=='REVERSED'&&<button onClick={()=>runAction('reverse',r.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Reverse"><RotateCcw className="w-4 h-4"/></button>}
                                    </td>
                                </tr>))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
