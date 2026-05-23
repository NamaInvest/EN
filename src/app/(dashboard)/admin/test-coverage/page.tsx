import React from 'react';
import { useTranslation } from "@/lib/i18n";

export default function TestCoveragePage() {
    const { lang } = useTranslation();
        const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">Test Coverage & QA Metrics</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500">Unit Coverage</h3>
                    <p className="text-3xl font-bold mt-2 text-green-600">84.2%</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500">Integration Coverage</h3>
                    <p className="text-3xl font-bold mt-2 text-yellow-600">62.1%</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500">E2E Critical Paths</h3>
                    <p className="text-3xl font-bold mt-2 text-green-600">100%</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500">Stryker Mutation Score</h3>
                    <p className="text-3xl font-bold mt-2 text-red-600">76.4%</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-semibold">User Stories Missing Tests</h2>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Story ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('الحالة', 'Status')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">US-sales-04</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Apply Multi-Currency Exchange</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">Missing tests</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">US-hr-11</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mudad Status Syncing</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">Missing tests</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
