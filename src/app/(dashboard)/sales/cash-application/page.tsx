'use client';

import React, { useState } from 'react';
import { FileText, ArrowRightLeft, Search, PlusCircle, CheckCircle, Save, Settings } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function CashApplicationPage() {
 const { lang } = useTranslation();
 const { success, info } = useToast();
 const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

 const [strategy, setStrategy] = useState('FIFO');
 const [isAutoApplying, setIsAutoApplying] = useState(false);

 // Mock data
 const payment = {
 id: 'PAY-8921',
 customer: 'Al-Rajhi Construction',
 amount: 50000,
 unapplied: 5000,
 date: '2026-05-02'
 };

 const handleAutoApply = () => {
 setIsAutoApplying(true);
 setTimeout(() => {
 setIsAutoApplying(false);
 alert(`Auto-Applied using ${strategy} strategy.`);
 }, 1500);
 };

 return (
 <div className="p-6 space-y-6">
 <div className="flex justify-between items-center border-b border-slate-200 pb-4">
 <div>
 <h1 className="text-3xl font-bold tracking-tight text-slate-900 ">Cash Application</h1>
 <p className="text-slate-500 mt-1 text-sm">Allocate incoming customer payments to open invoices (AR Automation)</p>
 </div>
 <div className="flex gap-2">
 <button className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 dark:hover:bg-gray-700 flex items-center">
 <Settings className="w-4 h-4 mr-2" />
 Rules
 </button>
 <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 flex items-center">
 <Save className="w-4 h-4 mr-2" />
 Post Batch
 </button>
 </div>
 </div>

 {/* Payment Details Header */}
 <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-5 flex items-center justify-between">
 <div className="flex items-center space-x-8">
 <div>
 <div className="text-sm font-medium text-blue-800 dark:text-blue-300">Payment ID</div>
 <div className="text-xl font-bold text-slate-900 ">{payment.id}</div>
 </div>
 <div>
 <div className="text-sm font-medium text-blue-800 dark:text-blue-300">Customer</div>
 <div className="text-lg font-medium text-slate-900 ">{payment.customer}</div>
 </div>
 <div>
 <div className="text-sm font-medium text-blue-800 dark:text-blue-300">Total Received</div>
 <div className="text-lg font-bold text-green-600 dark:text-green-400">{payment.amount.toLocaleString()} SAR</div>
 </div>
 </div>

 <div className="bg-white rounded-md p-3 shadow-sm border border-slate-200 flex items-center space-x-4">
 <div className="text-center px-4 border-r border-slate-200 ">
 <div className="text-xs text-slate-500">{_t('مطبّق', 'Applied')}</div>
 <div className="text-lg font-bold text-slate-900 ">{(payment.amount - payment.unapplied).toLocaleString()} SAR</div>
 </div>
 <div className="text-center px-4">
 <div className="text-xs font-bold text-orange-500">Unapplied Balance</div>
 <div className="text-xl font-bold text-orange-600">{payment.unapplied.toLocaleString()} SAR</div>
 </div>
 </div>
 </div>

 {/* Auto-Apply Bar */}
 <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between shadow-sm">
 <div className="flex items-center space-x-4">
 <span className="text-sm font-medium text-slate-700 ">Auto-Apply Strategy:</span>
 <select 
 value={strategy}
 onChange={(e) => setStrategy(e.target.value)}
 className="border border-slate-300 rounded-md text-sm py-1.5 pl-3 pr-8 focus:ring-blue-500 focus:border-blue-500 "
 >
 <option value="FIFO">FIFO (Oldest First)</option>
 <option value="LARGEST_FIRST">Largest Amount First</option>
 <option value="BY_REFERENCE">Match by Reference No.</option>
 </select>
 <button 
 onClick={handleAutoApply}
 disabled={isAutoApplying || payment.unapplied === 0}
 className={`px-3 py-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 rounded-md text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors ${isAutoApplying ? 'opacity-50 cursor-wait' : ''}`}
 >
 {isAutoApplying ? 'Applying...' : 'Run Auto-Apply'}
 </button>
 </div>
 <div className="text-sm text-slate-500">
 You can drag & drop invoices or manually edit applied amounts below.
 </div>
 </div>

 {/* Workspace: Left (Open Invoices) / Right (Applied) */}
 <div className="grid grid-cols-2 gap-6 h-[500px]">
 
 {/* Left: Open Invoices */}
 <div className="border border-slate-200 rounded-lg bg-white flex flex-col">
 <div className="p-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center rounded-t-lg">
 <h3 className="font-medium text-sm text-slate-700 flex items-center">
 <FileText className="w-4 h-4 mr-2" /> Open Invoices
 </h3>
 <div className="relative">
 <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
 <input
 type="text"
 placeholder="Search..."
 className="pl-8 pr-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-blue-500 focus:border-blue-500 "
 />
 </div>
 </div>
 
 <div className="flex-1 overflow-y-auto p-4 space-y-3">
 {/* Invoice Item */}
 <div className="border border-slate-200 rounded-md p-3 hover:border-blue-400 hover:shadow-sm cursor-grab bg-white transition-all flex justify-between items-center group">
 <div>
 <div className="font-medium text-sm text-slate-900 mb-1">INV-2026-115</div>
 <div className="text-xs text-slate-500">Due: 2026-04-15 (Overdue: 17 days)</div>
 </div>
 <div className="text-right">
 <div className="font-bold text-slate-900 ">12,500 SAR</div>
 <button className="mt-1 text-xs text-blue-600 dark:text-blue-400 font-medium opacity-0 group-hover:opacity-100 flex items-center transition-opacity">
 Apply Full <ArrowRightLeft className="w-3 h-3 ml-1" />
 </button>
 </div>
 </div>

 {/* Invoice Item */}
 <div className="border border-slate-200 rounded-md p-3 hover:border-blue-400 hover:shadow-sm cursor-grab bg-white transition-all flex justify-between items-center group">
 <div>
 <div className="font-medium text-sm text-slate-900 mb-1">INV-2026-142</div>
 <div className="text-xs text-slate-500">Due: 2026-05-10</div>
 </div>
 <div className="text-right">
 <div className="font-bold text-slate-900 ">8,000 SAR</div>
 <button className="mt-1 text-xs text-blue-600 dark:text-blue-400 font-medium opacity-0 group-hover:opacity-100 flex items-center transition-opacity">
 Apply Full <ArrowRightLeft className="w-3 h-3 ml-1" />
 </button>
 </div>
 </div>
 </div>
 </div>

 {/* Right: Applied Applications */}
 <div className="border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50/30 dark:bg-blue-900/10 flex flex-col relative overflow-hidden">
 <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
 <div className="p-3 border-b border-blue-100 dark:border-blue-800 bg-white flex justify-between items-center">
 <h3 className="font-medium text-sm text-blue-800 dark:text-blue-300 flex items-center">
 <CheckCircle className="w-4 h-4 mr-2" /> Application Cart
 </h3>
 <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">
 2 Invoices Applied
 </span>
 </div>

 <div className="flex-1 overflow-y-auto p-4 space-y-3">
 {/* Applied Item */}
 <div className="border border-slate-200 rounded-md bg-white p-3 shadow-sm">
 <div className="flex justify-between items-start mb-3">
 <div>
 <div className="font-medium text-sm text-slate-900 ">INV-2026-092</div>
 <div className="text-xs text-slate-500">Original: 30,000 SAR</div>
 </div>
 <button className="text-xs text-red-500 hover:text-red-700">Remove</button>
 </div>
 <div className="grid grid-cols-3 gap-2">
 <div>
 <label className="text-[10px] uppercase text-slate-500 font-semibold mb-1 block">{_t('مطبّق', 'Applied')}</label>
 <input type="text" defaultValue="30000.00" className="w-full text-sm border-slate-300 rounded font-medium px-2 py-1" />
 </div>
 <div>
 <label className="text-[10px] uppercase text-slate-500 font-semibold mb-1 block">W/O / Disc</label>
 <input type="text" defaultValue="0.00" className="w-full text-sm border-slate-300 rounded px-2 py-1" />
 </div>
 <div>
 <label className="text-[10px] uppercase text-slate-500 font-semibold mb-1 block">Remaining</label>
 <input type="text" value="0.00" disabled className="w-full text-sm border-transparent bg-slate-50 rounded px-2 py-1 font-medium text-green-600" />
 </div>
 </div>
 </div>

 {/* Applied Item 2 */}
 <div className="border border-slate-200 rounded-md bg-white p-3 shadow-sm border-l-2 border-l-orange-400">
 <div className="flex justify-between items-start mb-3">
 <div>
 <div className="font-medium text-sm text-slate-900 ">INV-2026-104</div>
 <div className="text-xs text-slate-500">Original: 20,000 SAR</div>
 </div>
 <button className="text-xs text-red-500 hover:text-red-700">Remove</button>
 </div>
 <div className="grid grid-cols-3 gap-2">
 <div>
 <label className="text-[10px] uppercase text-slate-500 font-semibold mb-1 block">{_t('مطبّق', 'Applied')}</label>
 <input type="text" defaultValue="15000.00" className="w-full text-sm border-slate-300 rounded font-medium px-2 py-1 border-orange-300 focus:ring-orange-500" />
 </div>
 <div>
 <label className="text-[10px] uppercase text-slate-500 font-semibold mb-1 block">W/O / Disc</label>
 <input type="text" defaultValue="0.00" className="w-full text-sm border-slate-300 rounded px-2 py-1" />
 </div>
 <div>
 <label className="text-[10px] uppercase text-slate-500 font-semibold mb-1 block">Remaining</label>
 <input type="text" value="5000.00" disabled className="w-full text-sm border-transparent bg-slate-50 rounded px-2 py-1 font-bold text-orange-600" />
 </div>
 </div>
 <p className="text-[10px] text-orange-600 mt-2">Partial payment (short payment).</p>
 </div>

 </div>
 
 {/* Summary Footer */}
 <div className="bg-white border-t border-slate-200 p-4">
 <div className="flex justify-between items-center text-sm mb-1">
 <span className="text-slate-500">Total Applied:</span>
 <span className="font-medium text-slate-900 ">45,000.00 SAR</span>
 </div>
 <div className="flex justify-between items-center text-sm">
 <span className="text-slate-500">Write-offs/Discounts:</span>
 <span className="font-medium text-slate-900 ">0.00 SAR</span>
 </div>
 </div>
 </div>

 </div>
 </div>
 );
}
