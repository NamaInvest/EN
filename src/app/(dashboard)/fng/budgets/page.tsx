import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Plus, Calculator, BarChart3, ShieldAlert, FileSpreadsheet, Lock } from 'lucide-react';

import prisma from '@/lib/prisma';
import { _t } from '@/lib/server-t';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.app.(dashboard).' });
export default async function BudgetsPage() {
    // Fetch budgets
    const budgets = await prisma.budget.findMany({
        orderBy: { fiscalYear: 'desc' },
        take: 50
    });

    const activeBudgets = budgets.filter(b => b.status === 'ACTIVE').length;
    const pendingBudgets = budgets.filter(b => b.status === 'DRAFT').length;

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <Calculator className="w-8 h-8 text-indigo-600" />{_t('الميزانيات والرقابة المالية', 'Budgets & Financial Control')}</h1>
                    <p className="text-gray-500 mt-1">{_t('إدارة ميزانيات الشركات والتخطيط متعدد الفترات والأعباء.', 'Manage corporate budgets, multi-period planning, and encumbrances.')}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="bg-white">
                        <FileSpreadsheet className="w-4 h-4 mr-2" />{_t('استيراد اكسل', 'Import Excel')}</Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                        <Plus className="w-4 h-4 mr-2" />{_t('الميزانية الجديدة', 'New Budget')}</Button>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-indigo-600">{_t('الموازنات النشطة', 'Active Budgets')}</p>
                            <BarChart3 className="w-4 h-4 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{activeBudgets}</h3>
                        <p className="text-xs text-indigo-500 mt-1">{_t('تخطيط السنة المالية الحالية', 'Current fiscal year planning')}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-amber-600">{_t('مسودة ومعلقة', 'Draft & Pending')}</p>
                            <ShieldAlert className="w-4 h-4 text-amber-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{pendingBudgets}</h3>
                        <p className="text-xs text-amber-500 mt-1">{_t('تتطلب موافقة المجلس', 'Require board approval')}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Data Grid */}
            <Card className="overflow-hidden border-gray-200 shadow-sm bg-white">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search budgets..." 
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium">{_t('اسم الميزانية', 'Budget Name')}</th>
                                <th className="px-4 py-3 font-medium">{_t('السنة المالية', 'Fiscal Year')}</th>
                                <th className="px-4 py-3 font-medium">{_t('النوع', 'Type')}</th>
                                <th className="px-4 py-3 font-medium text-right">{_t('المبلغ المجمل', 'Total Amount')}</th>
                                <th className="px-4 py-3 font-medium">{_t('الحالة', 'Status')}</th>
                                <th className="px-4 py-3 font-medium text-right">{_t('إجراءات', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {budgets.map((b) => (
                                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {b.name}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">
                                        {b.fiscalYear}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {/* Assuming model has some type or we default */}
                                        OPERATIONAL
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                                        SAR {Number(b.totalAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded text-xs font-bold ${
                                            b.status === 'ACTIVE' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                                        }`}>
                                            {b.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700">{_t('عرض الخطوط', 'View Lines')}</Button>
                                    </td>
                                </tr>
                            ))}
                            {budgets.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <Calculator className="w-10 h-10 text-gray-300 mb-3" />
                                            <p className="text-lg font-medium text-gray-900">{_t('لم يتم العثور على ميزانيات', 'No Budgets Found')}</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
