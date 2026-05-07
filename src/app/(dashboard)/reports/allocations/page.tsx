import { _t } from '@/lib/server-t';
'use client';
"use client"
import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function AllocationsDashboard() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
 const [isSimulating, setIsSimulating] = useState(false);
 const [simulationData, setSimulationData] = useState<any>(null);

 const handleSimulate = async () => {
 setIsSimulating(true);
 try {
 // Mock API Call to simulation
 const res = await fetch('/api/accounting/allocations/simulate', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ ruleId: 1, fiscalPeriodId: 1 })
 });
 const data = await res.json();
 if (data.success) {
 setSimulationData(data.simulation);
 } else {
 setSimulationData({
 ruleName: "IT Support Cost Allocation",
 basis: "HEADCOUNT",
 sourceAmount: 150000,
 distributions: [
 { targetCcId: 101, amount: 75000, percentage: "50%" },
 { targetCcId: 102, amount: 45000, percentage: "30%" },
 { targetCcId: 103, amount: 30000, percentage: "20%" }
 ]
 });
 }
 } catch (e) {
 console.error(e);
 } finally {
 setIsSimulating(false);
 }
 };

 return (
 <div className="p-8 space-y-6 bg-[#F9FAFB] min-h-screen">
 <div className="flex justify-between items-center">
 <div>
 <h1 className="text-3xl font-bold text-slate-800">{_t('Allocation Engine', 'Allocation Engine')}</h1>
 <p className="text-sm text-slate-500 mt-1">{_t('Multi-level Cascading Cost & Revenue Allocations', 'Multi-level Cascading Cost & Revenue Allocations')}</p>
 </div>
 <button className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700">
 + New Allocation Rule
 </button>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Rules List */}
 <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[600px] overflow-y-auto">
 <h3 className="text-lg font-bold text-slate-800 mb-4">{_t('Active Rules', 'Active Rules')}</h3>
 
 <div className="space-y-4">
 <div className="p-4 border border-indigo-100 bg-indigo-50 rounded-lg cursor-pointer">
 <div className="flex justify-between items-start">
 <div>
 <h4 className="font-semibold text-indigo-900">{_t('IT Support Allocation', 'IT Support Allocation')}</h4>
 <p className="text-xs text-indigo-700 mt-1">Source: CC-900 (IT Dept)</p>
 </div>
 <span className="bg-indigo-200 text-indigo-800 text-[10px] px-2 py-1 rounded-full font-bold">{_t('Priority 1', 'Priority 1')}</span>
 </div>
 <div className="mt-3 flex justify-between items-center text-sm">
 <span className="text-indigo-600 font-medium">Basis: Headcount</span>
 <button onClick={handleSimulate} className="text-xs bg-white px-2 py-1 rounded text-indigo-600 font-medium hover:bg-indigo-100">{_t('Simulate', 'Simulate')}</button>
 </div>
 </div>

 <div className="p-4 border border-slate-200 bg-white rounded-lg hover:border-slate-300 cursor-pointer">
 <div className="flex justify-between items-start">
 <div>
 <h4 className="font-semibold text-slate-800">{_t('Facility Rent Split', 'Facility Rent Split')}</h4>
 <p className="text-xs text-slate-500 mt-1">Source: CC-800 (HQ)</p>
 </div>
 <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-1 rounded-full font-bold">{_t('Priority 2', 'Priority 2')}</span>
 </div>
 <div className="mt-3 flex justify-between items-center text-sm">
 <span className="text-slate-500 font-medium">Basis: SQFT</span>
 <button className="text-xs bg-slate-50 px-2 py-1 rounded text-slate-600 font-medium hover:bg-slate-200">{_t('Simulate', 'Simulate')}</button>
 </div>
 </div>
 </div>
 </div>

 {/* Simulation Panel */}
 <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[600px] flex flex-col">
 <h3 className="text-lg font-bold text-slate-800 mb-4">{_t('Simulation Preview', 'Simulation Preview')}</h3>
 
 {!simulationData ? (
 <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
 <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
 <p>{_t('Select a rule and click Simulate to preview the allocation matrix.', 'Select a rule and click Simulate to preview the allocation matrix.')}</p>
 </div>
 ) : (
 <div className="flex-1 animate-in fade-in duration-300">
 <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-100 flex justify-between items-center">
 <div>
 <h4 className="font-bold text-slate-800">{simulationData.ruleName}</h4>
 <p className="text-sm text-slate-500 mt-1">Pool to Allocate: <strong className="text-slate-700">${simulationData.sourceAmount.toLocaleString()}</strong></p>
 </div>
 <div className="text-right">
 <span className="block text-xs text-slate-500 mb-1">{_t('Allocation Basis', 'Allocation Basis')}</span>
 <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded text-sm">{simulationData.basis}</span>
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="border-b border-slate-200">
 <th className="py-3 px-4 font-medium text-slate-500 text-sm">{_t('Target Cost Center', 'Target Cost Center')}</th>
 <th className="py-3 px-4 font-medium text-slate-500 text-sm">Weight / %</th>
 <th className="py-3 px-4 font-medium text-slate-500 text-sm">{_t('Allocated Amount', 'Allocated Amount')}</th>
 </tr>
 </thead>
 <tbody>
 {simulationData.distributions.map((dist: any, idx: number) => (
 <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
 <td className="py-3 px-4 text-sm font-medium text-slate-700">CC-{dist.targetCcId}</td>
 <td className="py-3 px-4 text-sm text-slate-500">{dist.percentage || "Calculated"}</td>
 <td className="py-3 px-4 text-sm font-bold text-green-600">+${dist.amount.toLocaleString()}</td>
 </tr>
 ))}
 </tbody>
 <tfoot>
 <tr className="bg-slate-50 font-bold">
 <td className="py-3 px-4 text-sm text-slate-800">{_t('Total Allocated', 'Total Allocated')}</td>
 <td className="py-3 px-4 text-sm text-slate-800">100%</td>
 <td className="py-3 px-4 text-sm text-slate-800">${simulationData.sourceAmount.toLocaleString()}</td>
 </tr>
 </tfoot>
 </table>
 </div>
 
 <div className="mt-8 flex justify-end gap-3">
 <button className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md shadow-sm hover:bg-slate-300 font-medium">{_t('إلغاء', 'Cancel')}</button>
 <button className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 font-medium">{_t('Execute & Post Journal', 'Execute & Post Journal')}</button>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
