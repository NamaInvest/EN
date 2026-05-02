'use client';

import React from 'react';
import { AlertCircle, Mail, Clock, Filter, ShieldAlert, FileText, CheckCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function DunningDashboard() {
    const { lang } = useTranslation();
    const { success, info } = useToast();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

    return (
        <div className="p-6 h-[calc(100vh-64px)] flex flex-col bg-gray-50 dark:bg-gray-900">
            <div className="flex justify-between items-center pb-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center">
                        <ShieldAlert className="w-8 h-8 mr-3 text-red-600" />
                        {_t('متابعة وتحصيل المديونيات', 'Dunning & Collections')}
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">{_t('تذكير آلي متعدد المستويات وتوليد رسوم تأخير للحسابات المتأخرة', 'Automated multi-level reminders and late fee generation for overdue accounts')}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => info(_t('تصفية البيانات...', 'Filtering data...'))} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center dark:bg-gray-800 dark:text-white dark:border-gray-700">
                        <Filter className="w-4 h-4 mr-2" />
                        {_t('تصفية', 'Filter')}
                    </button>
                    <button onClick={() => success(_t('تم إرسال 124 رسالة تحصيل آلياً', '124 dunning letters dispatched automatically'))} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        {_t('تنفيذ دورة التحصيل', 'Execute Dunning Run')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 shrink-0">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">{_t('إجمالي المديونيات المتأخرة', 'Overdue AR Balance')}</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-mono mt-1">450,000.00</h3>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">{_t('خطابات مرسلة (30 يوم)', 'Letters Sent (30d)')}</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-mono mt-1">124</h3>
                    </div>
                    <Mail className="w-8 h-8 text-blue-500 opacity-20" />
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">{_t('مُحصل (30 يوم)', 'Recovered (30d)')}</p>
                        <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 font-mono mt-1">85,000.00</h3>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500 opacity-20" />
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-lg border border-red-200 dark:border-red-800 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-red-800 dark:text-red-400">{_t('حسابات محظورة', 'Accounts Blocked')}</p>
                        <h3 className="text-2xl font-bold text-red-900 dark:text-red-300 font-mono mt-1">5</h3>
                    </div>
                    <AlertCircle className="w-8 h-8 text-red-600 opacity-20" />
                </div>
            </div>

            <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm flex flex-col min-h-0">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex space-x-4 gap-4">
                    <button onClick={() => info(_t('عرض رسائل التحصيل النشطة', 'Viewing active dunning letters'))} className="text-sm font-medium text-red-600 border-b-2 border-red-600 pb-2">{_t('رسائل التحصيل النشطة', 'Active Dunning Letters')}</button>
                    <button onClick={() => info(_t('فتح إعدادات مستويات التحصيل', 'Opening dunning levels setup'))} className="text-sm font-medium text-gray-500 hover:text-gray-700 pb-2">{_t('إعدادات مستويات التحصيل', 'Dunning Levels Setup')}</button>
                </div>
                
                <div className="overflow-y-auto flex-1 p-0">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('العميل', 'Customer')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('الفاتورة / المرجع', 'Invoice / Ref')}</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('تأخير', 'Overdue')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('مستوى التحصيل', 'Dunning Level')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('الإجمالي', 'Total Due')}</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('إجراء', 'Action')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">Delta Contracting Est</div>
                                    <div className="text-xs text-gray-500">delta@example.com</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-blue-600">INV-2026-0012</div>
                                    <div className="text-xs text-gray-500 flex items-center">
                                        <Clock className="w-3 h-3 mr-1" /> {_t('تاريخ الاستحقاق: 15 مارس 2026', 'Due: 15 Mar 2026')}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className="text-sm font-bold text-red-600">{_t('48 يوم', '48 Days')}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                                        {_t('المستوى 2 (إنذار)', 'Level 2 (Warning)')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono font-medium text-gray-900 dark:text-gray-300">
                                    12,500.00
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                    <button onClick={() => info(_t('عرض تفاصيل الفاتورة', 'Viewing invoice details'))} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                        <FileText className="w-4 h-4 mx-auto" />
                                    </button>
                                </td>
                            </tr>
                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">Riyadh Tech Co</div>
                                    <div className="text-xs text-gray-500">finance@riyadhtech.sa</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-blue-600">INV-2026-0004</div>
                                    <div className="text-xs text-gray-500 flex items-center">
                                        <Clock className="w-3 h-3 mr-1" /> {_t('تاريخ الاستحقاق: 01 فبراير 2026', 'Due: 01 Feb 2026')}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className="text-sm font-bold text-red-800 dark:text-red-400">{_t('91 يوم', '91 Days')}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                        {_t('المستوى 3 (إنذار نهائي / حظر)', 'Level 3 (Final Notice / Blocked)')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono font-medium text-gray-900 dark:text-gray-300">
                                    45,200.00
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                    <button onClick={() => info(_t('عرض تفاصيل الفاتورة', 'Viewing invoice details'))} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                        <FileText className="w-4 h-4 mx-auto" />
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

