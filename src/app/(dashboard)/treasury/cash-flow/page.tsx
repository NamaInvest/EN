import { _t } from '@/lib/server-t';
'use client';

import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Filter } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function CashFlowDashboard() {
 const { success, info } = useToast();

 return (
 <div className="p-6 space-y-6 bg-slate-50 min-h-[calc(100vh-64px)]">
 <div className="flex justify-between items-center border-b border-slate-200 pb-4">
 <div>
 <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center">
 <TrendingUp className="w-8 h-8 mr-3 text-green-600" />{_t('Cash Flow Forecast', 'Cash Flow Forecast')}</h1>
 <p className="text-slate-500 mt-1 text-sm">Direct method forecasting based on open AR/AP, recurring journals, and bank balances</p>
 </div>
 <div className="flex gap-2">
 <button className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 flex items-center ">
 <Filter className="w-4 h-4 mr-2" />{_t('Filter Accounts', 'Filter Accounts')}</button>
 <select className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white ">
 <option>{_t('Next 30 Days', 'Next 30 Days')}</option>
 <option>{_t('Next 90 Days', 'Next 90 Days')}</option>
 <option>{_t('Next 6 Months', 'Next 6 Months')}</option>
 </select>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
 <div>
 <p className="text-sm font-medium text-slate-500">{_t('Current Liquidity (All Banks)', 'Current Liquidity (All Banks)')}</p>
 <h3 className="text-2xl font-bold text-slate-900 font-mono mt-1">2,450,000.00</h3>
 </div>
 <div className="p-3 bg-blue-100 text-blue-600 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
 <DollarSign className="w-6 h-6" />
 </div>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
 <div>
 <p className="text-sm font-medium text-slate-500">{_t('Expected Inflows (Next 30d)', 'Expected Inflows (Next 30d)')}</p>
 <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 font-mono mt-1">+ 850,000.00</h3>
 </div>
 <div className="p-3 bg-green-100 text-green-600 rounded-full dark:bg-green-900/30 dark:text-green-400">
 <TrendingUp className="w-6 h-6" />
 </div>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
 <div>
 <p className="text-sm font-medium text-slate-500">{_t('Expected Outflows (Next 30d)', 'Expected Outflows (Next 30d)')}</p>
 <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono mt-1">- 1,120,000.00</h3>
 </div>
 <div className="p-3 bg-red-100 text-red-600 rounded-full dark:bg-red-900/30 dark:text-red-400">
 <TrendingDown className="w-6 h-6" />
 </div>
 </div>
 </div>

 <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
 <h3 className="text-lg font-medium text-slate-900 mb-4">{_t('Projected Cash Position', 'Projected Cash Position')}</h3>
 <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 ">
 <p className="text-slate-500 flex items-center">
 [Recharts / Chart.js Graph Component goes here]
 </p>
 </div>
 </div>

 <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
 <div className="p-4 border-b border-slate-200 ">
 <h3 className="text-lg font-medium text-slate-900 ">{_t('Upcoming Obligations & Receipts', 'Upcoming Obligations & Receipts')}</h3>
 </div>
 <div className="overflow-x-auto">
 <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
 <thead className="bg-slate-50 ">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{_t('التاريخ', 'Date')}</th>
 <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{_t('النوع', 'Type')}</th>
 <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{_t('الوصف', 'Description')}</th>
 <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{_t('Amount (SAR)', 'Amount (SAR)')}</th>
 <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">{_t('Probability', 'Probability')}</th>
 </tr>
 </thead>
 <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700">
 <tr className="hover:bg-slate-50 dark:hover:bg-gray-700/50">
 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 flex items-center">
 <Calendar className="w-4 h-4 mr-2 text-slate-400" /> 05 May 2026
 </td>
 <td className="px-6 py-4 whitespace-nowrap text-sm">
 <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">{_t('AP Invoice Due', 'AP Invoice Due')}</span>
 </td>
 <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">Supplier: IT Solutions LLC (INV-992)</td>
 <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-bold text-red-600">- 45,000.00</td>
 <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-500">High (100%)</td>
 </tr>
 <tr className="hover:bg-slate-50 dark:hover:bg-gray-700/50">
 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 flex items-center">
 <Calendar className="w-4 h-4 mr-2 text-slate-400" /> 10 May 2026
 </td>
 <td className="px-6 py-4 whitespace-nowrap text-sm">
 <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">{_t('AR Invoice Due', 'AR Invoice Due')}</span>
 </td>
 <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">Customer: Alpha Trading (INV-1020)</td>
 <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-bold text-green-600">+ 120,000.00</td>
 <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-500">Medium (75%)</td>
 </tr>
 <tr className="hover:bg-slate-50 dark:hover:bg-gray-700/50">
 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 flex items-center">
 <Calendar className="w-4 h-4 mr-2 text-slate-400" /> 28 May 2026
 </td>
 <td className="px-6 py-4 whitespace-nowrap text-sm">
 <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">{_t('Payroll Run', 'Payroll Run')}</span>
 </td>
 <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{_t('Estimated May 2026 Salaries', 'Estimated May 2026 Salaries')}</td>
 <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-bold text-red-600">- 350,000.00</td>
 <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-500">Certain (100%)</td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>
 </div>
 );
}
