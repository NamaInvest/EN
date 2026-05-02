'use client';

import React from 'react';
import { RefreshCw, Search, CheckCircle, AlertTriangle, FileText, UploadCloud, Link } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function BankReconciliation() {
    const { lang } = useTranslation();
    const { success, info } = useToast();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

    return (
        <div className="p-6 h-[calc(100vh-64px)] flex flex-col bg-gray-50 dark:bg-gray-900">
            <div className="flex justify-between items-center pb-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center">
                        <RefreshCw className="w-8 h-8 mr-3 text-indigo-600" />
                        Bank Reconciliation
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">Auto-match MT940 / CAMT.053 bank statements with GL transactions</p>
                </div>
                <div className="flex gap-2">
                    <select className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700">
                        <option>Al Rajhi Bank (SAR) - STMT-2026-05</option>
                        <option>SNB (USD) - STMT-2026-05</option>
                    </select>
                    <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center dark:bg-gray-800 dark:text-white dark:border-gray-700">
                        <UploadCloud className="w-4 h-4 mr-2 text-indigo-600" />
                        Import MT940
                    </button>
                    <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 flex items-center">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Run Auto-Match
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 shrink-0">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm text-center">
                    <p className="text-sm font-medium text-gray-500">Statement Balance</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-mono mt-1">1,250,400.50</h3>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm text-center">
                    <p className="text-sm font-medium text-gray-500">GL Book Balance</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-mono mt-1">1,230,000.00</h3>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-5 rounded-lg border border-yellow-200 dark:border-yellow-800 shadow-sm text-center">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Difference to Resolve</p>
                    <h3 className="text-2xl font-bold text-yellow-900 dark:text-yellow-300 font-mono mt-1">20,400.50</h3>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-lg border border-indigo-200 dark:border-indigo-800 shadow-sm flex items-center justify-center flex-col">
                    <p className="text-sm font-medium text-indigo-800 dark:text-indigo-400">Match Rate</p>
                    <div className="flex items-center mt-1">
                        <h3 className="text-2xl font-bold text-indigo-900 dark:text-indigo-300 font-mono">85%</h3>
                        <div className="ml-2 w-24 h-2 bg-indigo-200 rounded-full overflow-hidden">
                            <div className="bg-indigo-600 h-full w-[85%]"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Split View */}
            <div className="flex-1 flex gap-6 min-h-0">
                
                {/* Left: Bank Statement Lines */}
                <div className="w-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm flex flex-col">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase flex items-center">
                            <FileText className="w-4 h-4 mr-2" /> Bank Statement Lines
                        </h3>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-2 top-2 text-gray-400" />
                            <input type="text" placeholder="Search..." className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-2">
                        {/* Unmatched Line */}
                        <div className="p-3 border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10 rounded-md cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30">
                            <div className="flex justify-between mb-1">
                                <span className="text-xs font-semibold text-gray-500">02 May 2026</span>
                                <span className="text-sm font-bold text-green-600 font-mono">+ 20,000.00</span>
                            </div>
                            <p className="text-sm text-gray-900 dark:text-white font-medium">INWARD TRANSFER REF 88291</p>
                            <p className="text-xs text-gray-500 truncate">Customer: AL SHARQ COMPANY LLC</p>
                            <div className="mt-2 flex">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 font-medium">
                                    UNMATCHED
                                </span>
                            </div>
                        </div>

                        {/* Unmatched Line (Fee) */}
                        <div className="p-3 border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10 rounded-md cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30">
                            <div className="flex justify-between mb-1">
                                <span className="text-xs font-semibold text-gray-500">02 May 2026</span>
                                <span className="text-sm font-bold text-red-600 font-mono">- 400.50</span>
                            </div>
                            <p className="text-sm text-gray-900 dark:text-white font-medium">BANK CHARGE - MONTHLY</p>
                            <div className="mt-2 flex justify-between items-center">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 font-medium">
                                    UNMATCHED
                                </span>
                                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center">
                                    Rule detected: POST TO 5800 <RefreshCw className="w-3 h-3 ml-1" />
                                </span>
                            </div>
                        </div>

                        {/* Matched Line */}
                        <div className="p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md opacity-60">
                            <div className="flex justify-between mb-1">
                                <span className="text-xs font-semibold text-gray-500">01 May 2026</span>
                                <span className="text-sm font-bold text-red-600 font-mono">- 15,000.00</span>
                            </div>
                            <p className="text-sm text-gray-900 dark:text-white font-medium">OUTWARD TRANSFER REF 1102</p>
                            <div className="mt-2 flex">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 font-medium flex items-center">
                                    <CheckCircle className="w-3 h-3 mr-1" /> AUTO-MATCHED
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: GL Transactions & Actions */}
                <div className="w-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm flex flex-col">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2" /> Match Candidates (GL)
                        </h3>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
                        {/* Empty State shown when no item is selected, or if showing candidates */}
                        <div className="w-full max-w-sm">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Suggested Match</h4>
                            <div className="p-4 border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-left mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Receipt #REC-2026-089</span>
                                    <span className="text-sm font-bold text-green-600 font-mono">20,000.00</span>
                                </div>
                                <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">Al Sharq Company LLC</p>
                                <p className="text-xs text-gray-500 mt-1">Date: 01 May 2026</p>
                                <div className="mt-3 text-xs flex items-center text-indigo-600">
                                    <CheckCircle className="w-3 h-3 mr-1" /> 98% Confidence (Amount + Name Match)
                                </div>
                            </div>

                            <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md flex justify-center items-center">
                                <Link className="w-4 h-4 mr-2" /> Match Selected
                            </button>
                            <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  className="w-full py-2 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-md">
                                Search Manually
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
