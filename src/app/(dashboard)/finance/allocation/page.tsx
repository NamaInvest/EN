'use client';
import React, { useState, useEffect } from 'react';
import { PieChart, Play } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function AllocationDashboard() {
 const { lang } = useTranslation();
 const { success } = useToast();
 const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
 const [entries, setEntries] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().split('T')[0]);
 const headers = { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}` };

 const fetchData = async () => {
 setLoading(true);
 try {
 const res = await fetch('/api/finance/allocation', { headers });
 if (res.ok) setEntries((await res.json()).entries || []);
 } catch (e) { console.error(e); }
 finally { setLoading(false); }
 };

 const runAllocation = async () => {
 setLoading(true);
 try {
 const res = await fetch('/api/finance/allocation', {
 method: 'POST', headers: { 'Content-Type': 'application/json', ...headers },
 body: JSON.stringify({ periodEndDate: periodEnd })
 });
 if (res.ok) { success(_t('تم التوزيع بنجاح', 'Allocation completed')); fetchData(); }
 } catch (e) { console.error(e); }
 finally { setLoading(false); }
 };

 useEffect(() => { fetchData(); }, []);

 return (
 <div className="p-6 space-y-6">
 <div className="flex justify-between items-center border-b border-slate-200 pb-4">
 <div>
 <h1 className="text-3xl font-bold text-slate-900 flex items-center">
 <PieChart className="w-8 h-8 mr-3 text-indigo-600" />
 {_t('محرك توزيع التكاليف', 'Cost Allocation Engine')}
 </h1>
 <p className="text-slate-500 mt-1 text-sm">{_t('توزيع المصاريف المشتركة على مراكز التكلفة', 'Distribute shared costs to cost centers')}</p>
 </div>
 <div className="flex gap-2">
 <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="px-3 py-2 border rounded-md text-sm "/>
 <button onClick={runAllocation} className="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 flex items-center">
 <Play className="w-4 h-4 mr-2" />{_t('تشغيل التوزيع', 'Run Allocation')}
 </button>
 </div>
 </div>

 <div className="bg-white border rounded-lg shadow-sm">
 <div className="p-4 border-b bg-slate-50 ">
 <h2 className="text-lg font-medium text-slate-900 ">{_t('قيود التوزيع', 'Allocation Journal Entries')}</h2>
 </div>
 <div className="overflow-x-auto">
 <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
 <thead><tr>
 {[_t('رقم القيد','JE#'),_t('التاريخ','Date'),_t('الوصف','Description'),_t('المدين','Debit'),_t('الدائن','Credit')].map(h=>
 <th key={h} className="px-6 py-3 text-xs font-medium text-slate-500 uppercase">{h}</th>)}
 </tr></thead>
 <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
 {loading?<tr><td colSpan={5} className="text-center py-10 text-slate-500">{_t('جاري التحميل...','Loading...')}</td></tr>:
 entries.length===0?<tr><td colSpan={5} className="text-center py-10 text-slate-500">{_t('لا توجد قيود','No entries')}</td></tr>:
 entries.map((e:any)=>(
 <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50">
 <td className="px-6 py-4 text-sm font-mono">{e.entryNumber}</td>
 <td className="px-6 py-4 text-sm">{new Date(e.date).toLocaleDateString()}</td>
 <td className="px-6 py-4 text-sm">{e.description}</td>
 <td className="px-6 py-4 text-sm font-mono text-right">{e.lines?.reduce((s:number,l:any)=>s+Number(l.debit||0),0).toLocaleString()}</td>
 <td className="px-6 py-4 text-sm font-mono text-right">{e.lines?.reduce((s:number,l:any)=>s+Number(l.credit||0),0).toLocaleString()}</td>
 </tr>))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 );
}
