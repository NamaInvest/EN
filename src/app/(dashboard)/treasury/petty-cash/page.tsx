import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Plus, Landmark, ArrowRight, Wallet, ReceiptText, ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

import prisma from '@/lib/prisma';
import { _t } from '@/lib/server-t';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.app.(dashboard).' });
export default async function PettyCashPage() {
    const funds = await prisma.pettyCashFund.findMany({
            take: 100,
        include: {
            custodian: true
        },
        orderBy: { fundName: 'asc' }
    });

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <Wallet className="w-8 h-8 text-emerald-600" />{_t('إدارة المصروفات النثرية', 'Petty Cash Management')}</h1>
                    <p className="text-gray-500 mt-1">{_t('إدارة أموال السلف والنفقات والمبالغ المستردة.', 'Manage imprest funds, expenses, and reimbursements.')}</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/treasury">
                        <Button variant="outline" className="bg-white">{_t('العودة إلى الخزانة', 'Back to Treasury')}</Button>
                    </Link>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                        <Plus className="w-4 h-4 mr-2" />{_t('إنشاء صندوق', 'Create Fund')}</Button>
                </div>
            </div>

            {/* Data Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {funds.map((fund) => {
                    const maxLimit = Number(fund.maxLimit);
                    const currentBalance = Number(fund.currentBalance);
                    const progress = maxLimit > 0 ? (currentBalance / maxLimit) * 100 : 0;
                    const isLow = progress < 20;

                    return (
                        <Card key={fund.id} className="border-gray-200 hover:shadow-md transition-all overflow-hidden flex flex-col bg-white">
                            <CardHeader className="bg-emerald-50 border-b border-emerald-100 pb-3 relative">
                                <div className="absolute top-4 right-4">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                        fund.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {fund.status}
                                    </span>
                                </div>
                                <CardTitle className="text-lg text-emerald-900 flex items-center gap-2">
                                    <Landmark className="w-5 h-5 text-emerald-600" />
                                    {fund.fundName}
                                </CardTitle>
                                <p className="text-sm text-emerald-700 mt-1">Custodian: {fund.custodian?.name || '-'}</p>
                            </CardHeader>
                            <CardContent className="p-4 flex-1 flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">{_t('الرصيد الحالي', 'Current Balance')}</p>
                                            <p className={`text-2xl font-bold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                                                SAR {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(currentBalance)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500 mb-1">{_t('الحد الأقصى', 'Max Limit')}</p>
                                            <p className="text-sm font-medium text-gray-700">SAR {new Intl.NumberFormat('en-US').format(maxLimit)}</p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                                        <div 
                                            className={`h-2 rounded-full ${isLow ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                            style={{ width: `${Math.min(progress, 100)}%` }}
                                        ></div>
                                    </div>
                                    {isLow && <p className="text-xs text-red-500 font-medium">{_t('الرصيد ينخفض. تعبئة الرصيد مطلوبة.', 'Balance running low. Top-up required.')}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-6">
                                    <Button variant="outline" size="sm" className="w-full text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                                        <ReceiptText className="w-4 h-4 mr-2" />{_t('أضف النفقات', 'Add Expense')}</Button>
                                    <Button variant="outline" size="sm" className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                                        <ArrowRightLeft className="w-4 h-4 mr-2" />{_t('تجديد', 'Replenish')}</Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {funds.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
                        <div className="flex flex-col items-center">
                            <Wallet className="w-10 h-10 text-gray-300 mb-3" />
                            <p className="text-lg font-medium text-gray-900">{_t('لا توجد أموال نثرية', 'No Petty Cash Funds')}</p>
                            <p className="text-sm">{_t('إنشاء صندوق جديد للبدء في إدارة المصروفات النثرية.', 'Create a new fund to start managing petty cash.')}</p>
                            <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
                                <Plus className="w-4 h-4 mr-2" />{_t('إنشاء الصندوق الأول', 'Create First Fund')}</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
