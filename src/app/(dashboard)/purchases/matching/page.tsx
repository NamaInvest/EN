'use client';

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Clock, Search, FileText, Lock } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function ThreeWayMatchingPage() {
    const { lang } = useTranslation();
    const { success, info, error } = useToast();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

    const [activeTab, setActiveTab] = useState('ALL');

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Three-Way Matching</h1>
                    <p className="text-gray-500 mt-1 text-sm">Automated AP Invoice matching (PO ↔ GRN ↔ Invoice)</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
                        Tolerance Settings
                    </button>
                    <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                        Run Batch Matching
                    </button>
                </div>
            </div>

            {/* Dashboard Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Pending</h3>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">24</div>
                    <p className="text-xs text-gray-500 mt-1">Invoices awaiting match</p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Auto-Matched</h3>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">156</div>
                    <p className="text-xs text-gray-500 mt-1">Ready for payment</p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm border-l-4 border-l-orange-500">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">On Hold (Variances)</h3>
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">8</div>
                    <p className="text-xs text-gray-500 mt-1">Exceeds tolerance limit</p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Blocked Payments</h3>
                        <Lock className="h-4 w-4 text-red-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">45,200 SAR</div>
                    <p className="text-xs text-gray-500 mt-1">Total blocked value</p>
                </div>
            </div>

            {/* List and Drilldown */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800 rounded-t-lg">
                    <div className="flex space-x-1">
                        {['ALL', 'ON_HOLD', 'MATCHED', 'PENDING'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 text-sm font-medium rounded-md ${
                                    activeTab === tab 
                                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-600' 
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                            >
                                {tab.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search invoice or PO..."
                            className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white w-64"
                        />
                    </div>
                </div>

                <div className="grid md:grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700">
                    {/* Invoice List */}
                    <div className="col-span-1 border-r border-gray-200 dark:border-gray-700">
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {/* Item 1: On Hold */}
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/20">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="font-medium text-gray-900 dark:text-white">INV-2026-089</div>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                        PRICE HOLD
                                    </span>
                                </div>
                                <div className="text-sm text-gray-500 mb-2">Al-Jazirah Supplies</div>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>PO: PO-4501</span>
                                    <span className="font-medium text-gray-900 dark:text-white">12,500 SAR</span>
                                </div>
                            </div>
                            
                            {/* Item 2: Matched */}
                            <div className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="font-medium text-gray-900 dark:text-white">INV-2026-090</div>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                        MATCHED
                                    </span>
                                </div>
                                <div className="text-sm text-gray-500 mb-2">Tech Solutions LLC</div>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>PO: PO-4482</span>
                                    <span className="font-medium text-gray-900 dark:text-white">8,200 SAR</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Drill-down Detail */}
                    <div className="col-span-2 bg-gray-50 dark:bg-gray-900 p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Match Analysis: INV-2026-089</h2>
                                <p className="text-sm text-gray-500">Al-Jazirah Supplies • Processed at 2026-05-02 09:14 AM</p>
                            </div>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 border border-orange-200">
                                <Lock className="w-4 h-4 mr-1" /> Payment Blocked
                            </span>
                        </div>

                        {/* Three Columns Comparison */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-500 border-b pb-2">
                                    <FileText className="w-4 h-4" /> Purchase Order
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><span className="text-gray-500">PO Number:</span> <span className="font-medium">PO-4501</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Total Qty:</span> <span className="font-medium">100.00</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Total Amount:</span> <span className="font-medium">10,000 SAR</span></div>
                                </div>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-500 border-b pb-2">
                                    <CheckCircle className="w-4 h-4" /> Goods Receipt (GRN)
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><span className="text-gray-500">GRN Number:</span> <span className="font-medium">GRN-8812</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Total Qty:</span> <span className="font-medium text-green-600">100.00</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Est. Amount:</span> <span className="font-medium">10,000 SAR</span></div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 border-2 border-orange-300 dark:border-orange-700 rounded-lg p-4 relative">
                                <div className="absolute -top-3 -right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow">VARIANCE</div>
                                <div className="flex items-center gap-2 mb-3 text-sm font-medium text-orange-600 border-b pb-2">
                                    <AlertCircle className="w-4 h-4" /> Supplier Invoice
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between"><span className="text-gray-500">Invoice No:</span> <span className="font-medium">INV-2026-089</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Total Qty:</span> <span className="font-medium">100.00</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Total Amount:</span> <span className="font-bold text-red-600">12,500 SAR</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Variance Details */}
                        <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/50 rounded-lg p-4 mb-6">
                            <h3 className="text-sm font-bold text-orange-800 dark:text-orange-400 mb-2">Variance Analysis</h3>
                            <div className="flex justify-between text-sm">
                                <div className="text-orange-700 dark:text-orange-300">
                                    <span className="font-semibold">Price Variance:</span> +2,500 SAR (+25.0%)
                                </div>
                                <div className="text-orange-700 dark:text-orange-300">
                                    <span className="font-semibold">Tolerance Allowed:</span> 5.0%
                                </div>
                            </div>
                            <p className="text-xs text-orange-600 mt-2">The invoice amount exceeds the Purchase Order amount by 25%, which is above the 5% tolerance limit.</p>
                        </div>

                        {/* Resolution Workflow */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Resolution Workflow</h3>
                            <div className="flex gap-4">
                                <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md shadow-sm flex justify-center items-center">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Force Approve (Accept Price)
                                </button>
                                <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-md shadow-sm">
                                    Request Vendor Credit Note
                                </button>
                                <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md shadow-sm">
                                    Reject Invoice
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
