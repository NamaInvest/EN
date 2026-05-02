'use client';

import React, { useState } from 'react';
import { FileText, Download, Calendar, ArrowRight, ShieldCheck, Calculator } from 'lucide-react';

export default function ZatcaVatReturn() {
    const [period, setPeriod] = useState('2026-Q1');

    return (
        <div className="p-6 h-[calc(100vh-64px)] flex flex-col bg-gray-50 dark:bg-gray-900">
            <div className="flex justify-between items-center pb-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center">
                        <ShieldCheck className="w-8 h-8 mr-3 text-green-600" />
                        ZATCA VAT Return
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">Official VAT Return Form for the Kingdom of Saudi Arabia</p>
                </div>
                <div className="flex gap-2">
                    <select 
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                    >
                        <option value="2026-Q1">Q1 2026 (Jan - Mar)</option>
                        <option value="2026-Q2">Q2 2026 (Apr - Jun)</option>
                        <option value="2026-Q3">Q3 2026 (Jul - Sep)</option>
                        <option value="2026-Q4">Q4 2026 (Oct - Dec)</option>
                    </select>
                    <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 flex items-center">
                        <Download className="w-4 h-4 mr-2" />
                        Export e-Filing XML
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center dark:bg-gray-800 dark:text-white dark:border-gray-700">
                        <FileText className="w-4 h-4 mr-2" />
                        PDF Copy
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                
                {/* 1. Value on Sales */}
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b pb-2 dark:border-gray-700">1. VAT on Sales (Output Tax)</h2>
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 mb-6 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <thead className="bg-gray-100 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Item</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Amount (SAR)</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Adjustment (SAR)</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">VAT Amount (SAR)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            <tr className="bg-white dark:bg-gray-800">
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 font-medium">1. Standard rated sales (15%)</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">1,500,000.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">0.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono font-medium text-gray-900 dark:text-white">225,000.00</td>
                            </tr>
                            <tr className="bg-gray-50 dark:bg-gray-800/50">
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 font-medium">2. Sales to customers in GCC countries</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">0.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">0.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono bg-gray-200 dark:bg-gray-700 text-gray-500">N/A</td>
                            </tr>
                            <tr className="bg-white dark:bg-gray-800">
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 font-medium">3. Zero-rated domestic sales</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">250,000.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">0.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono bg-gray-200 dark:bg-gray-700 text-gray-500">N/A</td>
                            </tr>
                            <tr className="bg-gray-50 dark:bg-gray-800/50">
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 font-medium">4. Exports</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">0.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">0.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono bg-gray-200 dark:bg-gray-700 text-gray-500">N/A</td>
                            </tr>
                            <tr className="bg-white dark:bg-gray-800">
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 font-medium">5. Exempt sales</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">0.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">0.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono bg-gray-200 dark:bg-gray-700 text-gray-500">N/A</td>
                            </tr>
                            <tr className="bg-gray-100 dark:bg-gray-700 font-bold">
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">6. Total Sales</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">1,750,000.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">0.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono text-blue-600 dark:text-blue-400">225,000.00</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* 2. Value on Purchases */}
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b pb-2 dark:border-gray-700">2. VAT on Purchases (Input Tax)</h2>
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 mb-6 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <thead className="bg-gray-100 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Item</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Amount (SAR)</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Adjustment (SAR)</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">VAT Amount (SAR)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            <tr className="bg-white dark:bg-gray-800">
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 font-medium">7. Standard rated domestic purchases (15%)</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">800,000.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">0.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono font-medium text-gray-900 dark:text-white">120,000.00</td>
                            </tr>
                            <tr className="bg-gray-50 dark:bg-gray-800/50">
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 font-medium">8. Imports subject to VAT paid at customs</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">100,000.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">0.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono font-medium text-gray-900 dark:text-white">15,000.00</td>
                            </tr>
                            <tr className="bg-white dark:bg-gray-800">
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 font-medium">9. Imports subject to VAT accounted for through reverse charge mechanism</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">0.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">0.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono font-medium text-gray-900 dark:text-white">0.00</td>
                            </tr>
                            <tr className="bg-gray-50 dark:bg-gray-800/50">
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 font-medium">10. Zero-rated purchases</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">50,000.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">0.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono bg-gray-200 dark:bg-gray-700 text-gray-500">N/A</td>
                            </tr>
                            <tr className="bg-white dark:bg-gray-800">
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 font-medium">11. Exempt purchases</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">20,000.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">0.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono bg-gray-200 dark:bg-gray-700 text-gray-500">N/A</td>
                            </tr>
                            <tr className="bg-gray-100 dark:bg-gray-700 font-bold">
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">12. Total Purchases</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">970,000.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">0.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono text-blue-600 dark:text-blue-400">135,000.00</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* 3. Net VAT */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                                <Calculator className="w-6 h-6 mr-2 text-blue-600" />
                                14. Net VAT Due
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">Total Output VAT (Item 6) minus Total Input VAT (Item 12)</p>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono tracking-tight">
                                90,000.00
                            </span>
                            <span className="text-sm text-gray-500 ml-2 font-medium">SAR</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
