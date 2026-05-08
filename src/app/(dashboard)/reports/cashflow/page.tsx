'use client';
"use client"
import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function CashFlowDashboard() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
 const [isLoading, setIsLoading] = useState(true);
 const [data, setData] = useState<any>(null);
 const MINIMUM_THRESHOLD = 50000;

 useEffect(() => {
 fetch('/api/accounting/cashflow/forecast?days=30')
 .then(res => res.json())
 .then(d => {
 if (d.success) {
 setData(d.data);
 }
 })
 .finally(() => setIsLoading(false));
 }, []);

 if (isLoading) {
 return <div className="p-8 min-h-screen bg-[#F9FAFB] flex items-center justify-center text-slate-500">{_t('Calculating Cash Flow Forecast...', 'Calculating Cash Flow Forecast...')}</div>;
 }

 if (!data) {
 return <div className="p-8 min-h-screen bg-[#F9FAFB] flex items-center justify-center text-red-500">{_t('Failed to load forecast data.', 'Failed to load forecast data.')}</div>;
 }

 const hasWarnings = data.forecast.some((day: any) => day.balance < MINIMUM_THRESHOLD);

 return (
 <div className="p-8 space-y-6 bg-[#F9FAFB] min-h-screen">
 <div className="flex justify-between items-center">
 <div>
 <h1 className="text-3xl font-bold text-slate-800">{_t('Cash Flow Forecast', 'Cash Flow Forecast')}</h1>
 <p className="text-sm text-slate-500 mt-1">30-Day Liquidity Projections based on AR, AP, and Payroll</p>
 </div>
 <div className="flex gap-2">
 <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-md shadow-sm hover:bg-slate-50">30 Days</button>
 <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-md shadow-sm hover:bg-slate-50">60 Days</button>
 <button className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700">{_t('تصدير PDF', 'Export PDF')}</button>
 </div>
 </div>

 {hasWarnings && (
 <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-md">
 <div className="flex items-center">
 <svg className="w-6 h-6 text-rose-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
 <p className="text-rose-700 font-medium text-sm">Warning: Liquidity is projected to drop below the minimum threshold of ${MINIMUM_THRESHOLD.toLocaleString()} within the next 30 days.</p>
 </div>
 </div>
 )}

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
 <p className="text-sm font-medium text-slate-500">{_t('Opening Balance (Today)', 'Opening Balance (Today)')}</p>
 <p className="text-2xl font-bold text-slate-800 mt-2">${data.openingBalance.toLocaleString()}</p>
 </div>
 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
 <p className="text-sm font-medium text-slate-500">{_t('Expected 30-Day Inflows', 'Expected 30-Day Inflows')}</p>
 <p className="text-2xl font-bold text-green-600 mt-2">
 +${data.forecast.reduce((acc: number, day: any) => acc + day.inflow, 0).toLocaleString()}
 </p>
 </div>
 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
 <p className="text-sm font-medium text-slate-500">{_t('Expected 30-Day Outflows', 'Expected 30-Day Outflows')}</p>
 <p className="text-2xl font-bold text-rose-600 mt-2">
 -${data.forecast.reduce((acc: number, day: any) => acc + day.outflow, 0).toLocaleString()}
 </p>
 </div>
 </div>

 <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
 <h3 className="text-lg font-bold text-slate-800 mb-6">{_t('Daily Forecast Matrix', 'Daily Forecast Matrix')}</h3>
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="border-b border-slate-200 bg-slate-50">
 <th className="py-3 px-4 font-medium text-slate-500 text-sm rounded-tl-lg">{_t('التاريخ', 'Date')}</th>
 <th className="py-3 px-4 font-medium text-slate-500 text-sm">{_t('Inflows', 'Inflows')}</th>
 <th className="py-3 px-4 font-medium text-slate-500 text-sm">{_t('Outflows', 'Outflows')}</th>
 <th className="py-3 px-4 font-medium text-slate-500 text-sm">{_t('Projected Balance', 'Projected Balance')}</th>
 <th className="py-3 px-4 font-medium text-slate-500 text-sm rounded-tr-lg">{_t('Key Drivers', 'Key Drivers')}</th>
 </tr>
 </thead>
 <tbody>
 {data.forecast.filter((day: any) => day.inflow > 0 || day.outflow > 0).map((day: any, idx: number) => (
 <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
 <td className="py-3 px-4 text-sm font-medium text-slate-700">{day.date}</td>
 <td className="py-3 px-4 text-sm font-medium text-green-600">
 {day.inflow > 0 ? `+$${day.inflow.toLocaleString()}` : '-'}
 </td>
 <td className="py-3 px-4 text-sm font-medium text-rose-500">
 {day.outflow > 0 ? `-$${day.outflow.toLocaleString()}` : '-'}
 </td>
 <td className="py-3 px-4 text-sm font-bold">
 <span className={day.balance < MINIMUM_THRESHOLD ? "text-rose-600" : "text-slate-800"}>
 ${day.balance.toLocaleString()}
 </span>
 </td>
 <td className="py-3 px-4 text-xs text-slate-500">
 <div className="flex flex-col gap-1">
 {day.details.map((detail: any, dIdx: number) => (
 <span key={dIdx} className="bg-slate-100 px-2 py-1 rounded inline-block max-w-fit">
 {detail.type} ({detail.reference})
 </span>
 ))}
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 );
}
