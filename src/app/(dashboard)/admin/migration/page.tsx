import React from 'react';
import { useTranslation } from "@/lib/i18n";

export default function MigrationDashboardPage() {
    const { lang } = useTranslation();
        const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">{_t('لوحة تحكم هجرة البيانات', 'Data Migration Cockpit')}</h1>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
                <h2 className="text-lg font-semibold mb-4">{_t('بدء هجرة بيانات جديدة', 'Start New Migration')}</h2>
                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{_t('النظام المصدر', 'Source System')}</label>
                        <select className="w-full border border-gray-300 rounded-md p-2">
                            <option value="wafeq">Wafeq</option>
                            <option value="quickbooks">QuickBooks Online</option>
                            <option value="daftra">Daftra</option>
                            <option value="sap-b1">{_t('SAP أعمال One', 'SAP Business One')}</option>
                            <option value="excel">{_t('ملف Excel/CSV عام', 'Generic Excel/CSV')}</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{_t('رفع بيانات تصدير (CSV/ZIP)', 'Upload Data Export (CSV/ZIP)')}</label>
                        <input type="file" className="w-full border border-gray-300 rounded-md p-2" />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <input type="checkbox" id="dryRun" defaultChecked className="rounded text-teal-600 focus:ring-teal-500" />
                        <label htmlFor="dryRun" className="text-sm font-medium text-gray-700">{_t('التشغيل كخيار تجريبي أولاً (موصى به)', 'Run as Dry-Run First (Recommended)')}</label>
                    </div>

                    <button type="button" className="bg-teal-700 text-white px-4 py-2 rounded-md hover:bg-teal-800 transition-colors">
                        {_t('بدء عملية الهجرة', 'Start Migration Process')}
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-semibold">{_t('عمليات الهجرة الأخيرة', 'Recent Migration Runs')}</h2>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{_t('المعرف', 'ID')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{_t('المصدر', 'Source')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{_t('الحالة', 'Status')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{_t('النوع', 'Type')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{_t('إجراء', 'Action')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">#102</td>
                            <td className="px-6 py-4 text-sm text-gray-500">Wafeq</td>
                            <td className="px-6 py-4 text-sm text-yellow-600 font-medium">COMPLETED_DRY_RUN</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{_t('جاف Run', 'Dry Run')}</td>
                            <td className="px-6 py-4 text-sm text-blue-600 hover:text-blue-800 cursor-pointer">{_t('تنفيذ الهجرة الفعلية', 'Execute Actual')}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
