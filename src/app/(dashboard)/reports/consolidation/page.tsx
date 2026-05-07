'use client';
"use client"
import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function ConsolidationDashboard() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
 const [isGenerating, setIsGenerating] = useState(false);
 const [status, setStatus] = useState<string>("DRAFT");

 const handleRunConsolidation = async () => {
 setIsGenerating(true);
 setTimeout(() => {
 setStatus("REVIEWED");
 setIsGenerating(false);
 }, 1500);
 };

 const handlePostConsolidation = async () => {
 setStatus("POSTED");
 alert("Consolidated Financials Locked and Posted to GL.");
 };

 return (
 <div className="p-8 space-y-8 bg-[#F9FAFB] min-h-screen font-sans">
 <div className="flex justify-between items-center">
 <div>
 <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Consolidation Command Center</h1>
 <p className="text-sm text-slate-500 mt-1">IFRS Compliant Group Financials & Eliminations</p>
 </div>
 <div className="flex gap-4">
 <button 
 onClick={handleRunConsolidation}
 disabled={isGenerating || status === 'POSTED'}
 className="px-6 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50 font-medium transition-all"
 >
 {isGenerating ? "Executing Engine..." : "Run Consolidation"}
 </button>
 {status === 'REVIEWED' && (
 <button 
 onClick={handlePostConsolidation}
 className="px-6 py-2 bg-emerald-600 text-white rounded-md shadow-sm hover:bg-emerald-700 font-medium transition-all flex items-center gap-2"
 >
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
 Lock & Post Period
 </button>
 )}
 </div>
 </div>

 {/* Top Row: Group KPIs & Tree View */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
 {/* Tree View of Subsidiaries */}
 <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
 <h3 className="text-lg font-bold text-slate-800 mb-4">Group Structure</h3>
 <ul className="space-y-3">
 <li className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">HQ</div>
 <div>
 <p className="font-semibold text-slate-800 text-sm">Nama Holding Group</p>
 <p className="text-xs text-slate-500">Base: SAR (100%)</p>
 </div>
 </div>
 <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
 </li>
 <li className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 ml-6">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">S1</div>
 <div>
 <p className="font-semibold text-slate-800 text-sm">Nama Tech (UAE)</p>
 <p className="text-xs text-slate-500">AED translated to SAR (80%)</p>
 </div>
 </div>
 <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
 </li>
 <li className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 ml-6">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm">S2</div>
 <div>
 <p className="font-semibold text-slate-800 text-sm">Nama Medical (Egypt)</p>
 <p className="text-xs text-slate-500">EGP translated to SAR (100%)</p>
 </div>
 </div>
 <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
 </li>
 </ul>
 </div>

 {/* KPI Dashboards */}
 <div className="lg:col-span-2 grid grid-cols-2 gap-6">
 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center items-center">
 <p className="text-sm font-medium text-slate-500 mb-2">Subsidiary Profit Contribution</p>
 <div className="relative w-32 h-32 rounded-full border-8 border-indigo-500 flex items-center justify-center" style={{ borderRightColor: '#38bdf8', borderBottomColor: '#fb7185' }}>
 <span className="text-lg font-bold text-slate-700">SAR</span>
 </div>
 <div className="flex gap-4 mt-4 text-xs">
 <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> HQ (50%)</span>
 <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400"></span> Tech (30%)</span>
 <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400"></span> Med (20%)</span>
 </div>
 </div>
 
 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center">
 <p className="text-sm font-medium text-slate-500">Intercompany Dependency Ratio</p>
 <p className="text-3xl font-bold text-slate-800 mt-2">12.4%</p>
 <div className="w-full bg-slate-100 h-2 mt-4 rounded-full overflow-hidden">
 <div className="bg-amber-500 h-full w-[12.4%]"></div>
 </div>
 <p className="text-xs text-slate-400 mt-2">Healthy: Less than 15% of revenue is intercompany.</p>
 
 <div className="mt-6 border-t border-slate-100 pt-4">
 <p className="text-sm font-medium text-slate-500">Currency Translation Adj (CTA)</p>
 <p className="text-xl font-bold text-emerald-600 mt-1">+$14,200 <span className="text-xs text-slate-400 font-normal">in Equity</span></p>
 </div>
 </div>
 </div>
 </div>

 {/* The Variance View (Pre & Post Elimination) */}
 <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
 <h3 className="text-lg font-bold text-slate-800 mb-6">Consolidation Variance View</h3>
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="border-b-2 border-slate-200">
 <th className="py-3 px-4 font-semibold text-slate-700">Account Group</th>
 <th className="py-3 px-4 font-semibold text-slate-700 text-right">Combined Total (Gross)</th>
 <th className="py-3 px-4 font-semibold text-rose-600 text-right">Eliminations</th>
 <th className="py-3 px-4 font-semibold text-emerald-700 text-right border-l border-slate-100">Consolidated Total (Net)</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 <tr className="hover:bg-slate-50">
 <td className="py-4 px-4 text-sm font-medium text-slate-800">Total Assets</td>
 <td className="py-4 px-4 text-sm text-right text-slate-600">$5,200,000</td>
 <td className="py-4 px-4 text-sm text-right text-rose-500 cursor-pointer hover:underline group relative">
 -$400,000
 <span className="hidden group-hover:block absolute bg-slate-800 text-white text-xs p-2 rounded -top-8 right-0 whitespace-nowrap shadow-lg">Drill-down: Intercompany Receivables</span>
 </td>
 <td className="py-4 px-4 text-sm text-right font-bold text-slate-800 border-l border-slate-100">$4,800,000</td>
 </tr>
 <tr className="hover:bg-slate-50">
 <td className="py-4 px-4 text-sm font-medium text-slate-800">Total Liabilities</td>
 <td className="py-4 px-4 text-sm text-right text-slate-600">$2,100,000</td>
 <td className="py-4 px-4 text-sm text-right text-rose-500 cursor-pointer hover:underline group relative">
 -$400,000
 <span className="hidden group-hover:block absolute bg-slate-800 text-white text-xs p-2 rounded -top-8 right-0 whitespace-nowrap shadow-lg">Drill-down: Intercompany Payables</span>
 </td>
 <td className="py-4 px-4 text-sm text-right font-bold text-slate-800 border-l border-slate-100">$1,700,000</td>
 </tr>
 <tr className="hover:bg-slate-50">
 <td className="py-4 px-4 text-sm font-medium text-slate-800">Total Revenue</td>
 <td className="py-4 px-4 text-sm text-right text-slate-600">$3,500,000</td>
 <td className="py-4 px-4 text-sm text-right text-rose-500 cursor-pointer hover:underline group relative">
 -$150,000
 <span className="hidden group-hover:block absolute bg-slate-800 text-white text-xs p-2 rounded -top-8 right-0 whitespace-nowrap shadow-lg">Drill-down: Intercompany Sales</span>
 </td>
 <td className="py-4 px-4 text-sm text-right font-bold text-slate-800 border-l border-slate-100">$3,350,000</td>
 </tr>
 <tr className="hover:bg-slate-50">
 <td className="py-4 px-4 text-sm font-medium text-slate-800">Cost of Goods Sold (COGS)</td>
 <td className="py-4 px-4 text-sm text-right text-slate-600">$1,800,000</td>
 <td className="py-4 px-4 text-sm text-right text-emerald-500 cursor-pointer hover:underline group relative">
 +$150,000
 <span className="hidden group-hover:block absolute bg-slate-800 text-white text-xs p-2 rounded -top-8 right-0 whitespace-nowrap shadow-lg">Drill-down: Intercompany Purchases</span>
 </td>
 <td className="py-4 px-4 text-sm text-right font-bold text-slate-800 border-l border-slate-100">$1,650,000</td>
 </tr>
 <tr className="bg-indigo-50 border-t-2 border-indigo-100">
 <td className="py-4 px-4 text-sm font-bold text-indigo-900">Net Income</td>
 <td className="py-4 px-4 text-sm text-right font-bold text-indigo-700">$850,000</td>
 <td className="py-4 px-4 text-sm text-right text-slate-500">-</td>
 <td className="py-4 px-4 text-sm text-right font-bold text-indigo-900 border-l border-indigo-200">$850,000</td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>
 </div>
 );
}
