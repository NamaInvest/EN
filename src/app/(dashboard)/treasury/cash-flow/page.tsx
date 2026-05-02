'use client';

import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Filter } from 'lucide-react';

export default function CashFlowDashboard() {
    return (
        <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-64px)]">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center">
                        <TrendingUp className="w-8 h-8 mr-3 text-green-600" />
                        Cash Flow Forecast
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">Direct method forecasting based on open AR/AP, recurring journals, and bank balances</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center dark:bg-gray-800 dark:text-white dark:border-gray-700">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter Accounts
                    </button>
                    <select className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700">
                        <option>Next 30 Days</option>
                        <option>Next 90 Days</option>
                        <option>Next 6 Months</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Current Liquidity (All Banks)</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-mono mt-1">2,450,000.00</h3>
                    </div>
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
                        <DollarSign className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Expected Inflows (Next 30d)</p>
                        <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 font-mono mt-1">+ 850,000.00</h3>
                    </div>
                    <div className="p-3 bg-green-100 text-green-600 rounded-full dark:bg-green-900/30 dark:text-green-400">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Expected Outflows (Next 30d)</p>
                        <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono mt-1">- 1,120,000.00</h3>
                    </div>
                    <div className="p-3 bg-red-100 text-red-600 rounded-full dark:bg-red-900/30 dark:text-red-400">
                        <TrendingDown className="w-6 h-6" />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Projected Cash Position</h3>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/30">
                    <p className="text-gray-500 flex items-center">
                        [Recharts / Chart.js Graph Component goes here]
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Upcoming Obligations & Receipts</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (SAR)</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Probability</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white flex items-center">
                                    <Calendar className="w-4 h-4 mr-2 text-gray-400" /> 05 May 2024
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                        AP Invoice Due
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Supplier: IT Solutions LLC (INV-992)</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-bold text-red-600">- 45,000.00</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">High (100%)</td>
                            </tr>
                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white flex items-center">
                                    <Calendar className="w-4 h-4 mr-2 text-gray-400" /> 10 May 2024
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                        AR Invoice Due
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Customer: Alpha Trading (INV-1020)</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-bold text-green-600">+ 120,000.00</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">Medium (75%)</td>
                            </tr>
                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white flex items-center">
                                    <Calendar className="w-4 h-4 mr-2 text-gray-400" /> 28 May 2024
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                        Payroll Run
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Estimated May 2024 Salaries</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-bold text-red-600">- 350,000.00</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">Certain (100%)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
