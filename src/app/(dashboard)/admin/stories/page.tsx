'use client';
import { useState } from 'react';
import { useTranslation } from "@/lib/i18n";

export default function StoriesPage() {
    const { lang } = useTranslation();
        const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    return (
        <div className="p-6 max-w-7xl mx-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{_t('قائمة مهام قصص المستخدمين (Backlog)', 'User Stories Backlog')}</h1>
                    <p className="text-gray-500 dark:text-gray-400">{_t('إدارة وتقدير وتخصيص قصص المستخدمين لدورات العمل (Sprints).', 'Manage, estimate, and assign user stories to sprints.')}</p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700">
                    {_t('+ قصة مستخدم جديدة', '+ New Story')}
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex gap-4">
                    <select className="border border-gray-300 dark:border-gray-700 rounded px-3 py-1.5 text-sm bg-transparent dark:text-white">
                        <option value="ALL">{_t('جميع الوحدات', 'All Modules')}</option>
                        <option value="HR">{_t('الموارد البشرية (HR)', 'HR')}</option>
                        <option value="ACC">{_t('محاسبة', 'Accounting')}</option>
                        <option value="SALES">{_t('المبيعات', 'Sales')}</option>
                    </select>
                    <select className="border border-gray-300 dark:border-gray-700 rounded px-3 py-1.5 text-sm bg-transparent dark:text-white">
                        <option value="ALL">{_t('جميع الحالات', 'All Statuses')}</option>
                        <option value="BACKLOG">{_t('قائمة الانتظار', 'BACKLOG')}</option>
                        <option value="IN_PROGRESS">{_t('قيد التنفيذ', 'IN PROGRESS')}</option>
                        <option value="DONE">{_t('مكتمل', 'DONE')}</option>
                    </select>
                </div>
                
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{_t('المعرف', 'ID')}</th>
                            <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{_t('إجراء', 'Action')}</th>
                            <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{_t('النقاط', 'Points')}</th>
                            <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{_t('الحالة', 'Status')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">US-HR-12</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{_t('عملية مغادرة طلب', 'Process leave request')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">5</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                    {_t('قائمة الانتظار', 'BACKLOG')}
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">US-ACC-05</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{_t('ترحيل قيد يومية متوازن', 'Post balanced JE')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">3</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    {_t('مكتمل', 'DONE')}
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
