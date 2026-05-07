import { _t } from '@/lib/server-t';
'use client';
import React, { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, BarChart3, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function CashFlowDashboard() {
 const { lang } = useTranslation();
 const { success } = useToast();
 const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
 const [forecast, setForecast] = useState<any>(null);
 const [comparison, setComparison] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [period, setPeriod] = useState('MONTHLY');
 const [scenario, setScenario] = useState('REALISTIC');
 const headers = { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}` };

 const fetchForecast = async () => {
 setLoading(true);
 try {
 const res = await fetch('/api/finance/cash-flow?action=latest', { headers });
 if (res.ok) setForecast((await res.json()).forecast);
 } catch (e) { console.error(e); }
 finally { setLoading(false); }
 };

 const generateForecast = async () => {
 setLoading(true);
 try {
 const res = await fetch('/api/finance/cash-flow', {
 method: 'POST', headers: { 'Content-Type': 'application/json', ...headers },
 body: JSON.stringify({ period, scenario, horizonMonths: 3 })
 });
 if (res.ok) { setForecast((await res.json()).forecast); success(_t('تم إنشاء التنبؤ', 'Forecast generated')); }
 } catch (e) { console.error(e); }
 finally { setLoading(false); }
 };

 const compareScenarios = async () => {
 try {
 const res = await fetch('/api/finance/cash-flow', {
 method: 'POST', headers: { 'Content-Type': 'application/json', ...headers },
 body: JSON.stringify({ action: 'compare', period, horizonMonths: 3 })
 });
 if (res.ok) setComparison((await res.json()).comparison);
 } catch (e) { console.error(e); }
 };

 useEffect(() => { fetchForecast(); }, []);
 const f = forecast || {};
 const buckets = f.buckets || [];
 const alerts = f.alerts || [];
 const fmt = (n: number) => Number(n || 0).toLocaleString();

 return (
 <div className="p-6 space-y-6">
 <div className="flex justify-between items-center border-b border-slate-200 pb-4">
 <div>
 <h1 className="text-3xl font-bold text-slate-900 flex items-center">
 <TrendingUp className="w-8 h-8 mr-3 text-blue-600" />
 {_t('التنبؤ بالتدفقات النقدية', 'Cash Flow Forecasting')}
 </h1>
 <p className="text-slate-500 mt-1 text-sm">{_t('تحليل تنبئي للسيولة وفق IAS 7', 'Predictive liquidity per IAS 7')}</p>
 </div>
 <div className="flex gap-2 flex-wrap">
 <select value={period} onChange={e => setPeriod(e.target.value)} className="px-3 py-2 border rounded-md text-sm ">
 <option value="MONTHLY">{_t('شهري', 'Monthly')}</option>
 <option value="WEEKLY">{_t('أسبوعي', 'Weekly')}</option>
 <option value="QUARTERLY">{_t('ربع سنوي', 'Quarterly')}</option>
 </select>
 <select value={scenario} onChange={e => setScenario(e.target.value)} className="px-3 py-2 border rounded-md text-sm ">
 <option value="OPTIMISTIC">{_t('متفائل', 'Optimistic')}</option>
 <option value="REALISTIC">{_t('واقعي', 'Realistic')}</option>
 <option value="PESSIMISTIC">{_t('متشائم', 'Pessimistic')}</option>
 </select>
 <button onClick={generateForecast} className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 flex items-center">
 <RefreshCw className="w-4 h-4 mr-2" />{_t('إنشاء تنبؤ', 'Generate')}
 </button>
 <button onClick={compareScenarios} className="px-4 py-2 border rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 flex items-center">
 <BarChart3 className="w-4 h-4 mr-2" />{_t('مقارنة', 'Compare')}
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
 {[
 { label: _t('الرصيد الافتتاحي', 'Opening'), value: fmt(f.openingBalance), cls: '' },
 { label: _t('التدفقات الداخلة', 'Inflows'), value: fmt(f.totalInflows), cls: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800', icon: <ArrowDown className="w-4 h-4 mr-1" /> },
 { label: _t('التدفقات الخارجة', 'Outflows'), value: fmt(f.totalOutflows), cls: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800', icon: <ArrowUp className="w-4 h-4 mr-1" /> },
 { label: _t('صافي الحركة', 'Net'), value: fmt(f.netPosition), cls: '', color: (f.netPosition||0)>=0?'text-green-600':'text-red-600' },
 { label: _t('الرصيد الختامي', 'Closing'), value: fmt(f.closingBalance), cls: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
 ].map((c, i) => (
 <div key={i} className={`p-5 rounded-lg border shadow-sm ${c.cls || 'bg-white border-slate-200 '}`}>
 <p className="text-sm font-medium text-slate-500 mb-1 flex items-center">{c.icon}{c.label}</p>
 <h3 className={`text-2xl font-bold font-mono ${c.color || 'text-slate-900 '}`}>{c.value}</h3>
 </div>
 ))}
 </div>

 {alerts.length > 0 && <div className="space-y-2">{alerts.map((a: any, i: number) => (
 <div key={i} className={`p-4 rounded-lg border flex items-center gap-3 ${a.severity==='HIGH'?'bg-red-50 dark:bg-red-900/20 border-red-300':'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300'}`}>
 <AlertTriangle className={`w-5 h-5 ${a.severity==='HIGH'?'text-red-600':'text-yellow-600'}`} />
 <span className="text-sm font-medium text-slate-900 ">{a.message}</span>
 </div>
 ))}</div>}

 {comparison && (
 <div className="bg-white border rounded-lg shadow-sm p-6">
 <h2 className="text-lg font-medium text-slate-900 mb-4">{_t('مقارنة السيناريوهات', 'Scenario Comparison')}</h2>
 <div className="grid grid-cols-3 gap-4 mb-4">
 {(['optimistic','realistic','pessimistic'] as const).map(s => {
 const sc = comparison.scenarios[s];
 const border = s==='optimistic'?'border-green-300 bg-green-50 dark:bg-green-900/10':s==='pessimistic'?'border-red-300 bg-red-50 dark:bg-red-900/10':'border-blue-300 bg-blue-50 dark:bg-blue-900/10';
 return (<div key={s} className={`p-4 rounded-lg border ${border}`}>
 <h3 className="font-bold text-sm mb-2">{s==='optimistic'?_t('متفائل','Optimistic'):s==='pessimistic'?_t('متشائم','Pessimistic'):_t('واقعي','Realistic')}</h3>
 <p className="text-sm">{_t('الرصيد:','Closing:')} <strong className="font-mono">{fmt(sc.closingBalance)}</strong></p>
 </div>);
 })}
 </div>
 <p className="text-sm bg-slate-100 p-3 rounded"><strong>{_t('التوصية:','Rec:')}</strong> {comparison.recommendation}</p>
 </div>
 )}

 <div className="bg-white border rounded-lg shadow-sm">
 <div className="p-4 border-b bg-slate-50 ">
 <h2 className="text-lg font-medium text-slate-900 ">{_t('تفاصيل الفترات', 'Period Breakdown')}</h2>
 </div>
 <div className="overflow-x-auto">
 <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
 <thead><tr>
 {[_t('الفترة','Period'),_t('داخلة','Inflows'),_t('خارجة','Outflows'),_t('صافي','Net'),_t('الرصيد','Balance')].map(h=>
 <th key={h} className="px-6 py-3 text-xs font-medium text-slate-500 uppercase">{h}</th>)}
 </tr></thead>
 <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
 {loading?<tr><td colSpan={5} className="text-center py-10 text-slate-500">{_t('جاري التحميل...','Loading...')}</td></tr>:
 buckets.length===0?<tr><td colSpan={5} className="text-center py-10 text-slate-500">{_t('اضغط إنشاء تنبؤ','Click Generate')}</td></tr>:
 buckets.map((b:any,i:number)=>(
 <tr key={i} className="hover:bg-slate-50 dark:hover:bg-gray-700/50">
 <td className="px-6 py-4 text-sm font-medium text-slate-900 ">{b.label}</td>
 <td className="px-6 py-4 text-sm text-center font-mono text-green-600">{fmt(b.inflows)}</td>
 <td className="px-6 py-4 text-sm text-center font-mono text-red-600">{fmt(b.outflows)}</td>
 <td className={`px-6 py-4 text-sm text-center font-mono font-bold ${b.netCashFlow>=0?'text-green-600':'text-red-600'}`}>{fmt(b.netCashFlow)}</td>
 <td className={`px-6 py-4 text-right text-sm font-bold font-mono ${b.runningBalance>=0?'text-blue-600':'text-red-600'}`}>{fmt(b.runningBalance)}</td>
 </tr>))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 );
}
