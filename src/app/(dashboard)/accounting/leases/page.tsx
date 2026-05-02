'use client';

import React, { useState } from 'react';
import { Building, TrendingDown, Clock, Search, Plus, FileText, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function LeasesDashboard() {
    const { lang } = useTranslation();
    const { success, info } = useToast();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">IFRS 16 Leases</h1>
                    <p className="text-gray-500 mt-1 text-sm">Lease Contracts, ROU Assets & Amortization Schedules</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center">
                        <TrendingDown className="w-4 h-4 mr-2" />
                        Run Monthly Posting
                    </button>
                    <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 flex items-center">
                        <Plus className="w-4 h-4 mr-2" />
                        New Contract
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                        <Building className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Active Leases</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">12</h3>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex items-center">
                    <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total ROU Assets</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">1,450,000 SAR</h3>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex items-center">
                    <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
                        <TrendingDown className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Lease Liability Balance</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">1,120,500 SAR</h3>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">Lease Register</h2>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search contracts..."
                            className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract #</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lessor & Asset</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Payment</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ROU Balance</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Liability Balance</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">LC-2026-001</td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">Al-Riyadh Real Estate Co.</div>
                                    <div className="text-sm text-gray-500">HQ Office Building (BUILDING)</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 dark:text-white">60 Months</div>
                                    <div className="text-xs text-gray-500">Ends: Dec 2028</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300 text-right">
                                    25,000.00
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300 text-right font-medium">
                                    1,200,000.00
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300 text-right font-medium text-red-600">
                                    980,500.00
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                        ACTIVE
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  className="text-gray-400 hover:text-blue-600">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">LC-2026-002</td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">Saudi Fleet Services</div>
                                    <div className="text-sm text-gray-500">Delivery Trucks (VEHICLE)</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 dark:text-white">36 Months</div>
                                    <div className="text-xs text-gray-500">Ends: Jun 2027</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300 text-right">
                                    8,500.00
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300 text-right font-medium">
                                    250,000.00
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300 text-right font-medium text-red-600">
                                    140,000.00
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                        ACTIVE
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  className="text-gray-400 hover:text-blue-600">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
