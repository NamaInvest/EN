'use client';

import React, { useState } from 'react';
import { LayoutDashboard, Filter, Columns, BarChart2, Save, Play, Download, Send } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function CustomReportBuilder() {
    const { lang } = useTranslation();
    const { success, info, error } = useToast();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

    const [dataset, setDataset] = useState('sales');
    const [dimensions, setDimensions] = useState(['customerId']);
    const [measures, setMeasures] = useState([{ field: 'totalAmount', aggregation: 'sum' }]);

    return (
        <div className="p-6 h-[calc(100vh-64px)] flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Report Builder</h1>
                    <p className="text-gray-500 mt-1 text-sm">Design custom BI reports with drag-and-drop dimensions & measures</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center">
                        <Save className="w-4 h-4 mr-2 text-gray-500" />
                        Save Report
                    </button>
                    <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 flex items-center">
                        <Play className="w-4 h-4 mr-2" />
                        Run Report
                    </button>
                </div>
            </div>

            <div className="flex flex-1 mt-6 gap-6 min-h-0">
                {/* Left Sidebar: Data Dictionary */}
                <div className="w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm flex flex-col shrink-0">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dataset</label>
                        <select 
                            value={dataset}
                            onChange={(e) => setDataset(e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="sales">Sales Invoices</option>
                            <option value="purchases">Purchase Invoices</option>
                            <option value="inventory">Inventory Movements</option>
                            <option value="journal_entries">General Ledger (GL)</option>
                        </select>
                    </div>

                    <div className="p-4 flex-1 overflow-y-auto">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                            <Columns className="w-3 h-3 mr-1" /> Dimensions (Group By)
                        </h3>
                        <div className="space-y-2 mb-6">
                            {['customerId', 'salesRepId', 'status', 'issueDate', 'dueDate'].map(field => (
                                <div key={field} className="p-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded cursor-move text-sm flex items-center text-gray-700 dark:text-gray-300 hover:border-blue-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2"></div>
                                    {field}
                                </div>
                            ))}
                        </div>

                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                            <BarChart2 className="w-3 h-3 mr-1" /> Measures (Values)
                        </h3>
                        <div className="space-y-2">
                            {['totalAmount', 'taxAmount', 'discount', 'id (count)'].map(field => (
                                <div key={field} className="p-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded cursor-move text-sm flex items-center text-gray-700 dark:text-gray-300 hover:border-green-400">
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
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 shrink-0">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rows / Columns</h4>
                                <div className="min-h-[60px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-2 flex flex-wrap gap-2 items-start bg-gray-50 dark:bg-gray-900/30">
                                    {dimensions.map(dim => (
                                        <span key={dim} className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                            {dim}
                                            <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  type="button" className="ml-1.5 inline-flex text-blue-500 hover:text-blue-600 focus:outline-none">
                                                <span>&times;</span>
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Values</h4>
                                <div className="min-h-[60px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-2 flex flex-wrap gap-2 items-start bg-gray-50 dark:bg-gray-900/30">
                                    {measures.map((m, i) => (
                                        <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                            {m.aggregation}({m.field})
                                            <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  type="button" className="ml-1.5 inline-flex text-green-500 hover:text-green-600 focus:outline-none">
                                                <span>&times;</span>
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                <Filter className="w-4 h-4 mr-1 text-gray-400" /> Filters
                            </h4>
                            <div className="min-h-[40px] border border-gray-200 dark:border-gray-700 rounded-md p-2 flex flex-wrap gap-2 items-center bg-gray-50 dark:bg-gray-900/30">
                                <span className="text-sm text-gray-400 italic">Drag fields here to filter...</span>
                            </div>
                        </div>
                    </div>

                    {/* Preview Area */}
                    <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm flex flex-col overflow-hidden">
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                                <LayoutDashboard className="w-4 h-4 mr-2" /> Data Preview
                            </h3>
                            <div className="flex space-x-2">
                                <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                                    <Download className="w-4 h-4" />
                                </button>
                                <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="p-0 flex-1 overflow-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-white dark:bg-gray-800 sticky top-0">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-900">customerId</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-900">sum(totalAmount)</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {[
                                        { id: 101, sum: '1,250,000.00' },
                                        { id: 102, sum: '840,500.00' },
                                        { id: 105, sum: '450,200.00' },
                                        { id: 110, sum: '320,000.00' },
                                        { id: 112, sum: '115,000.00' },
                                    ].map((row, i) => (
                                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">Customer #{row.id}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300 text-right font-mono">{row.sum} SAR</td>
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
