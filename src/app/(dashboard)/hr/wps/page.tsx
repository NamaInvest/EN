'use client';

import React from 'react';
import { FileText, Download, UploadCloud, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function WPSDashboard() {
    const { lang } = useTranslation();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center">
                        <ShieldCheck className="w-8 h-8 mr-3 text-blue-600" />
                        {_t('نظام حماية الأجور (WPS)', 'Wage Protection System (WPS)')}
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">{_t('توليد ملفات SIF وتتبع الرفع للبنوك والامتثال لمنصة مدد', 'Generate SIF files and track bank uploads for SAMA & Mudad compliance')}</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        {_t('توليد ملف SIF جديد', 'Generate New SIF')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">{_t('إجمالي دفعات SIF', 'Total SIF Batches')}</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">24</h3>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex items-center">
                    <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">{_t('مقبول من مدد', 'Accepted by Mudad')}</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">23</h3>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex items-center">
                    <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
                        <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">{_t('قيد الرفع', 'Pending Upload')}</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">1</h3>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-red-200 dark:border-red-900 shadow-sm flex items-center bg-red-50 dark:bg-red-900/10">
                    <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-red-800 dark:text-red-400">{_t('أخطاء الآيبان', 'IBAN Errors')}</p>
                        <h3 className="text-2xl font-bold text-red-900 dark:text-red-300">2</h3>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">{_t('آخر دفعات الأجور', 'Recent WPS Batches')}</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('رقم الدفعة', 'Batch Number')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('شهر الرواتب', 'Payroll Period')}</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('الموظفين', 'Employees')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('الإجمالي', 'Total Amount')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('البنك', 'Bank')}</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('الحالة', 'Status')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('الإجراءات', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">WPS-2026-05-8821</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{_t('مايو 2026', 'May 2026')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-gray-300">45</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-medium text-gray-900 dark:text-gray-300">324,500.00</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Al Rajhi (RJHI)</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">
                                        {_t('تم التوليد', 'GENERATED')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400 mr-3 flex items-center justify-end w-full">
                                        <Download className="w-4 h-4 mr-1" /> {_t('ملف SIF', 'SIF File')}
                                    </button>
                                </td>
                            </tr>
                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">WPS-2026-04-1093</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{_t('أبريل 2026', 'April 2026')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-gray-300">44</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-medium text-gray-900 dark:text-gray-300">318,200.00</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Al Rajhi (RJHI)</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                        {_t('مقبول (مدد)', 'ACCEPTED (MUDAD)')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                        <Download className="w-4 h-4" />
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
