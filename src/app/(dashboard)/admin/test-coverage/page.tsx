'use client';

import React from 'react';
import { useTranslation } from "@/lib/i18n";

export default function TestCoveragePage() {
    const { lang } = useTranslation();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    return (
        <div className="p-6 max-w-7xl mx-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{_t('تغطية الاختبارات ومقاييس الجودة (QA)', 'Test Coverage & QA Metrics')}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{_t('تغطية اختبارات الوحدة (Unit)', 'Unit Coverage')}</h3>
                    <p className="text-3xl font-bold mt-2 text-green-600">84.2%</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{_t('تغطية اختبارات التكامل (Integration)', 'Integration Coverage')}</h3>
                    <p className="text-3xl font-bold mt-2 text-yellow-600">62.1%</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{_t('مسارات E2E الحرجة', 'E2E Critical Paths')}</h3>
                    <p className="text-3xl font-bold mt-2 text-green-600">100%</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{_t('مقياس Stryker لاختبار الطفرات', 'Stryker Mutation Score')}</h3>
                    <p className="text-3xl font-bold mt-2 text-red-600">76.4%</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <h2 className="text-lg font-semibold">{_t('قصص المستخدمين التي تفتقر للاختبارات', 'User Stories Missing Tests')}</h2>
                </div>
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-white dark:bg-gray-800">
                        <tr>
                            <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{_t('معرف القصة', 'Story ID')}</th>
                            <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{_t('العنوان', 'Title')}</th>
                            <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{_t('الحالة', 'Status')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">US-sales-04</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{_t('تطبيق تحويل العملات المتعددة', 'Apply Multi-Currency Exchange')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400 font-medium">{_t('تفتقر للاختبارات', 'Missing tests')}</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">US-hr-11</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{_t('مزامنة حالة منصة مدد', 'Mudad Status Syncing')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400 font-medium">{_t('تفتقر للاختبارات', 'Missing tests')}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
