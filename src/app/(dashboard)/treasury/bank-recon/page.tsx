import { _t } from '@/lib/server-t';
'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Search, CheckCircle, AlertTriangle, FileText, UploadCloud, Link } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function BankReconciliation() {
 const { lang } = useTranslation();
 const { success, info } = useToast();
 const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

 const [data, setData] = useState<any>(null);
 const [loading, setLoading] = useState(true);

 const fetchData = async () => {
 setLoading(true);
 try {
 const res = await fetch('/api/treasury/bank-recon', {
 headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
 });
 if (res.ok) {
 setData(await res.json());
 }
 } catch (e) {
 console.error(e);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchData();
 }, []);

 const runAutoMatch = async () => {
 try {
 const res = await fetch('/api/treasury/bank-recon', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
 body: JSON.stringify({ action: 'auto-match' })
 });
 if (res.ok) {
 const result = await res.json();
 success(_t(`تم تطبيق قواعد المطابقة الآلية. تم مطابقة ${result.matchedCount} حركات.`, `Auto-match rules applied. Matched ${result.matchedCount} transactions.`));
 fetchData();
 }
 } catch (e) {
 console.error(e);
 }
 };

 const matchLine = async (lineId: number) => {
 try {
 const res = await fetch('/api/treasury/bank-recon', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
 body: JSON.stringify({ lineId })
 });
 if (res.ok) {
 success(_t('تمت المطابقة بنجاح', 'Matched successfully'));
 fetchData();
 }
 } catch (e) {
 console.error(e);
 }
 };

 const lines = data?.lines || [];
 const summary = data?.summary || { statementBalance: 0, bookBalance: 0, difference: 0, matchRate: 0 };
 const statement = data?.statement;

 const unmatchedLines = lines.filter((l: any) => l.reconciledStatus !== 'MATCHED');
 const matchedLines = lines.filter((l: any) => l.reconciledStatus === 'MATCHED');

 return (
 <div className="p-6 h-[calc(100vh-64px)] flex flex-col bg-slate-50 ">
 <div className="flex justify-between items-center pb-6 shrink-0">
 <div>
 <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center">
 <RefreshCw className="w-8 h-8 mr-3 text-indigo-600" />{_t('Bank Reconciliation', 'Bank Reconciliation')}</h1>
 <p className="text-slate-500 mt-1 text-sm">Auto-match MT940 / CAMT.053 bank statements with GL transactions</p>
 </div>
 <div className="flex gap-2">
 <select className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white ">
 <option>{_t('Al Rajhi Bank (SAR) - STMT-2026-05', 'Al Rajhi Bank (SAR) - STMT-2026-05')}</option>
 <option>{_t('SNB (USD) - STMT-2026-05', 'SNB (USD) - STMT-2026-05')}</option>
 </select>
 <button className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 flex items-center ">
 <UploadCloud className="w-4 h-4 mr-2 text-indigo-600" />{_t('Import MT940', 'Import MT940')}</button>
 <button onClick={runAutoMatch} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 flex items-center">
 <RefreshCw className="w-4 h-4 mr-2" />{_t('Run Auto-Match', 'Run Auto-Match')}</button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 shrink-0">
 <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm text-center">
 <p className="text-sm font-medium text-slate-500">{_t('Statement Balance', 'Statement Balance')}</p>
 <h3 className="text-2xl font-bold text-slate-900 font-mono mt-1">{Number(summary.statementBalance).toLocaleString()}</h3>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm text-center">
 <p className="text-sm font-medium text-slate-500">{_t('GL Book Balance', 'GL Book Balance')}</p>
 <h3 className="text-2xl font-bold text-slate-900 font-mono mt-1">{Number(summary.bookBalance).toLocaleString()}</h3>
 </div>
 <div className="bg-yellow-50 dark:bg-yellow-900/20 p-5 rounded-lg border border-yellow-200 dark:border-yellow-800 shadow-sm text-center">
 <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">{_t('Difference to Resolve', 'Difference to Resolve')}</p>
 <h3 className="text-2xl font-bold text-yellow-900 dark:text-yellow-300 font-mono mt-1">{Number(summary.difference).toLocaleString()}</h3>
 </div>
 <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-lg border border-indigo-200 dark:border-indigo-800 shadow-sm flex items-center justify-center flex-col">
 <p className="text-sm font-medium text-indigo-800 dark:text-indigo-400">{_t('Match Rate', 'Match Rate')}</p>
 <div className="flex items-center mt-1">
 <h3 className="text-2xl font-bold text-indigo-900 dark:text-indigo-300 font-mono">{summary.matchRate}%</h3>
 <div className="ml-2 w-24 h-2 bg-indigo-200 rounded-full overflow-hidden">
 <div className="bg-indigo-600 h-full" style={{ width: `${summary.matchRate}%` }}></div>
 </div>
 </div>
 </div>
 </div>

 {/* Split View */}
 <div className="flex-1 flex gap-6 min-h-0">
 
 {/* Left: Bank Statement Lines */}
 <div className="w-1/2 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col">
 <div className="p-3 border-b border-slate-200 flex justify-between items-center bg-slate-50 ">
 <h3 className="text-sm font-bold text-slate-700 uppercase flex items-center">
 <FileText className="w-4 h-4 mr-2" />{_t('Bank Statement Lines', 'Bank Statement Lines')}</h3>
 <div className="relative">
 <Search className="w-4 h-4 absolute left-2 top-2 text-slate-400" />
 <input type="text" placeholder="Search..." className="pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-md "/>
 </div>
 </div>
 <div className="overflow-y-auto flex-1 p-2 space-y-2">
 {loading && <p className="text-center p-4 text-slate-500">{_t('Loading statements...', 'Loading statements...')}</p>}
 
 {/* Unmatched Lines */}
 {unmatchedLines.map((line: any) => (
 <div key={`u-${line.id}`} onClick={() => matchLine(line.id)} className="p-3 border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10 rounded-md cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30">
 <div className="flex justify-between mb-1">
 <span className="text-xs font-semibold text-slate-500">{new Date(line.transactionDate).toLocaleDateString()}</span>
 <span className={`text-sm font-bold font-mono ${Number(line.amount) > 0 ? 'text-green-600' : 'text-red-600'}`}>
 {Number(line.amount) > 0 ? '+ ' : '- '}{Math.abs(Number(line.amount)).toLocaleString()}
 </span>
 </div>
 <p className="text-sm text-slate-900 font-medium">{line.description}</p>
 <div className="mt-2 flex justify-between items-center">
 <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 font-medium">{_t('UNMATCHED (Click to Match)', 'UNMATCHED (Click to Match)')}</span>
 </div>
 </div>
 ))}

 {/* Matched Lines */}
 {matchedLines.map((line: any) => (
 <div key={`m-${line.id}`} className="p-3 border border-slate-200 bg-white rounded-md opacity-60">
 <div className="flex justify-between mb-1">
 <span className="text-xs font-semibold text-slate-500">{new Date(line.transactionDate).toLocaleDateString()}</span>
 <span className={`text-sm font-bold font-mono ${Number(line.amount) > 0 ? 'text-green-600' : 'text-red-600'}`}>
 {Number(line.amount) > 0 ? '+ ' : '- '}{Math.abs(Number(line.amount)).toLocaleString()}
 </span>
 </div>
 <p className="text-sm text-slate-900 font-medium">{line.description}</p>
 <div className="mt-2 flex">
 <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 font-medium flex items-center">
 <CheckCircle className="w-3 h-3 mr-1" /> MATCHED ({line.matchConfidence || 100}%)
 </span>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Right: GL Transactions & Actions */}
 <div className="w-1/2 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col">
 <div className="p-3 border-b border-slate-200 flex justify-between items-center bg-slate-50 ">
 <h3 className="text-sm font-bold text-slate-700 uppercase flex items-center">
 <CheckCircle className="w-4 h-4 mr-2" />{_t('Match Candidates (GL)', 'Match Candidates (GL)')}</h3>
 </div>
 
 <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
 {/* Empty State shown when no item is selected, or if showing candidates */}
 <div className="w-full max-w-sm">
 <h4 className="text-lg font-medium text-slate-900 mb-4">{_t('Suggested Match', 'Suggested Match')}</h4>
 <div className="p-4 border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-left mb-6">
 <div className="flex justify-between items-center mb-2">
 <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Receipt #REC-2026-089</span>
 <span className="text-sm font-bold text-green-600 font-mono">20,000.00</span>
 </div>
 <p className="text-sm text-slate-800 font-medium">{_t('Al Sharq Company LLC', 'Al Sharq Company LLC')}</p>
 <p className="text-xs text-slate-500 mt-1">Date: 01 May 2026</p>
 <div className="mt-3 text-xs flex items-center text-indigo-600">
 <CheckCircle className="w-3 h-3 mr-1" />{_t('Waiting for selection...', 'Waiting for selection...')}</div>
 </div>

 <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md flex justify-center items-center">
 <Link className="w-4 h-4 mr-2" />{_t('Match Selected', 'Match Selected')}</button>
 <button className="w-full py-2 mt-2 bg-white border border-slate-300 hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-700 font-medium rounded-md">{_t('Search Manually', 'Search Manually')}</button>
 </div>
 </div>
 </div>

 </div>
 </div>
 );
}
