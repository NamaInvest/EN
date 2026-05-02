'use client';

import React from 'react';
import { Shield, Calculator, Download, CheckCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function GOSIDashboard() {
    const { lang } = useTranslation();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center">
                        <Shield className="w-8 h-8 mr-3 text-green-600" />
                        {_t('اشتراكات التأمينات (GOSI)', 'GOSI Contributions')}
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">{_t('إدارة المؤسسة العامة للتأمينات الاجتماعية (المعاشات، الأخطار، ساند)', 'General Organization for Social Insurance Management (Annuities, Hazards, SANED)')}</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 flex items-center">
                        <Calculator className="w-4 h-4 mr-2" />
                        {_t('احتساب اشتراكات الشهر الحالي', 'Calculate Current Month')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-sm font-medium text-gray-500 mb-1">{_t('إجمالي الأجر الخاضع (مايو 2026)', 'Total Subject Wage (May 2026)')}</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-mono">450,000.00 SAR</h3>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-sm font-medium text-gray-500 mb-1">{_t('حصة الموظف (مستقطعة)', 'Employee Share (Deducted)')}</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-mono">45,000.00 SAR</h3>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-sm font-medium text-gray-500 mb-1">{_t('حصة المنشأة (مصروف)', 'Employer Share (Expense)')}</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-mono">51,500.00 SAR</h3>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-1">{_t('إجمالي المستحق للتأمينات', 'Total Payable to GOSI')}</p>
                    <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-300 font-mono">96,500.00 SAR</h3>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">{_t('ملخص الاشتراكات الشهرية', 'Monthly Summary')}</h2>
                    <select className="px-3 py-1 border border-gray-300 rounded-md text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                        <option>2026</option>
                        <option>2025</option>
                    </select>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-white dark:bg-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('الشهر', 'Month')}</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('الموظفين', 'Employees')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('إجمالي المستحق', 'Total Payable')}</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('الحالة', 'Status')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('الإجراءات', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{_t('مايو 2026', 'May 2026')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">45</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-medium text-gray-900 dark:text-gray-300">96,500.00</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">
                                        {_t('بانتظار السداد', 'PENDING PAYMENT')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-gray-400 hover:text-blue-600 flex items-center justify-end w-full">
                                        <Download className="w-4 h-4 mr-1" />
                                    </button>
                                </td>
                            </tr>
                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{_t('أبريل 2026', 'April 2026')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">44</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-medium text-gray-900 dark:text-gray-300">94,200.00</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                        {_t('مدفوع (سداد)', 'PAID (SADAD)')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-gray-400 hover:text-blue-600 flex items-center justify-end w-full">
                                        <Download className="w-4 h-4 mr-1" />
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
