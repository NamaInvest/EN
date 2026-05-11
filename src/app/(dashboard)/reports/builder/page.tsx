'use client';

import React, { useState } from 'react';
import { LayoutDashboard, Filter, Columns, BarChart2, Save, Play, Download, Send } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function CustomReportBuilder() {
 const { lang } = useTranslation();
 const { success, info } = useToast();
 const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

 const [dataset, setDataset] = useState('sales');
 const [dimensions, setDimensions] = useState(['customerId']);
 const [measures, setMeasures] = useState([{ field: 'totalAmount', aggregation: 'sum' }]);

 return (
 <div className="p-6 h-[calc(100vh-64px)] flex flex-col">
 <div className="flex justify-between items-center border-b border-slate-200 pb-4 shrink-0">
 <div>
 <h1 className="text-3xl font-bold tracking-tight text-slate-900 ">{_t('منشئ التقرير', 'Report Builder')}</h1>
 <p className="text-slate-500 mt-1 text-sm">{_t('تصميم تقارير ذكاء الأعمال (BI) مخصصة بأبعاد ومقاييس السحب والإفلات', 'Design custom BI reports with drag-and-drop dimensions & measures')}</p>
 </div>
 <div className="flex gap-2">
 <button className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 flex items-center">
 <Save className="w-4 h-4 mr-2 text-slate-500" />{_t('حفظ التقرير', 'Save Report')}</button>
 <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 flex items-center">
 <Play className="w-4 h-4 mr-2" />{_t('تشغيل التقرير', 'Run Report')}</button>
 </div>
 </div>

 <div className="flex flex-1 mt-6 gap-6 min-h-0">
 {/* Left Sidebar: Data Dictionary */}
 <div className="w-64 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col shrink-0">
 <div className="p-4 border-b border-slate-200 ">
 <label className="block text-sm font-medium text-slate-700 mb-1">{_t('مجموعة البيانات', 'Dataset')}</label>
 <select 
 value={dataset}
 onChange={(e) => setDataset(e.target.value)}
 className="w-full border border-slate-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500 "
 >
 <option value="sales">{_t('فواتير المبيعات', 'Sales Invoices')}</option>
 <option value="purchases">{_t('فواتير المشتريات', 'Purchase Invoices')}</option>
 <option value="inventory">{_t('حركات المخزون', 'Inventory Movements')}</option>
 <option value="journal_entries">{_t('دفتر الأستاذ العام (GL)', 'General Ledger (GL)')}</option>
 </select>
 </div>

 <div className="p-4 flex-1 overflow-y-auto">
 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center">
 <Columns className="w-3 h-3 mr-1" />{_t('الأبعاد (التجميع حسب)', 'Dimensions (Group By)')}</h3>
 <div className="space-y-2 mb-6">
 {['customerId', 'salesRepId', 'status', 'issueDate', 'dueDate'].map(field => (
 <div key={field} className="p-2 bg-slate-50 border border-slate-200 rounded cursor-move text-sm flex items-center text-slate-700 hover:border-blue-400">
 <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2"></div>
 {field}
 </div>
 ))}
 </div>

 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center">
 <BarChart2 className="w-3 h-3 mr-1" />{_t('التدابير (القيم)', 'Measures (Values)')}</h3>
 <div className="space-y-2">
 {['totalAmount', 'taxAmount', 'discount', 'id (count)'].map(field => (
 <div key={field} className="p-2 bg-slate-50 border border-slate-200 rounded cursor-move text-sm flex items-center text-slate-700 hover:border-green-400">
 <div className="w-1.5 h-1.5 rounded-full bg-green-400 mr-2"></div>
 {field}
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Middle: Report Canvas */}
 <div className="flex-1 flex flex-col gap-4 min-h-0">
 {/* Build Area */}
 <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 shrink-0">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <h4 className="text-sm font-medium text-slate-700 mb-2">Rows / Columns</h4>
 <div className="min-h-[60px] border-2 border-dashed border-slate-300 rounded-md p-2 flex flex-wrap gap-2 items-start bg-slate-50 ">
 {dimensions.map(dim => (
 <span key={dim} className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
 {dim}
 <button type="button" className="ml-1.5 inline-flex text-blue-500 hover:text-blue-600 focus:outline-none">
 <span>&times;</span>
 </button>
 </span>
 ))}
 </div>
 </div>
 <div>
 <h4 className="text-sm font-medium text-slate-700 mb-2">{_t('قيم', 'Values')}</h4>
 <div className="min-h-[60px] border-2 border-dashed border-slate-300 rounded-md p-2 flex flex-wrap gap-2 items-start bg-slate-50 ">
 {measures.map((m, i) => (
 <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
 {m.aggregation}({m.field})
 <button type="button" className="ml-1.5 inline-flex text-green-500 hover:text-green-600 focus:outline-none">
 <span>&times;</span>
 </button>
 </span>
 ))}
 </div>
 </div>
 </div>
 <div className="mt-4">
 <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center">
 <Filter className="w-4 h-4 mr-1 text-slate-400" />{_t('المرشحات', 'Filters')}</h4>
 <div className="min-h-[40px] border border-slate-200 rounded-md p-2 flex flex-wrap gap-2 items-center bg-slate-50 ">
 <span className="text-sm text-slate-400 italic">{_t('اسحب الحقول هنا للتصفية...', 'Drag fields here to filter...')}</span>
 </div>
 </div>
 </div>

 {/* Preview Area */}
 <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
 <div className="p-3 border-b border-slate-200 flex justify-between items-center bg-slate-50 ">
 <h3 className="text-sm font-medium text-slate-700 flex items-center">
 <LayoutDashboard className="w-4 h-4 mr-2" />{_t('معاينة البيانات', 'Data Preview')}</h3>
 <div className="flex space-x-2">
 <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded">
 <Download className="w-4 h-4" />
 </button>
 <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded">
 <Send className="w-4 h-4" />
 </button>
 </div>
 </div>
 <div className="p-0 flex-1 overflow-auto">
 <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
 <thead className="bg-white sticky top-0">
 <tr>
 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50 ">{_t('معرف العميل', 'customerId')}</th>
 <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50 ">{_t('المبلغ (القيمة الإجمالية)', 'sum(totalAmount)')}</th>
 </tr>
 </thead>
 <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-700">
 {[
 { id: 101, sum: '1,250,000.00' },
 { id: 102, sum: '840,500.00' },
 { id: 105, sum: '450,200.00' },
 { id: 110, sum: '320,000.00' },
 { id: 112, sum: '115,000.00' },
 ].map((row, i) => (
 <tr key={i} className="hover:bg-slate-50 dark:hover:bg-gray-700/50">
 <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-slate-900 ">Customer #{row.id}</td>
 <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-900 text-right font-mono">{row.sum} SAR</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
