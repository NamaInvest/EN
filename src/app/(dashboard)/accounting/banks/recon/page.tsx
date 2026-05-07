import { _t } from '@/lib/server-t';
'use client';
"use client";

import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCcw, CheckCircle, Search, AlertTriangle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function BankReconciliationPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{_t('Bank Reconciliation', 'Bank Reconciliation')}</h1>
                    <p className="text-muted-foreground">{_t('AI-assisted transaction matching and exception handling', 'AI-assisted transaction matching and exception handling')}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <ShieldCheck className="h-4 w-4 mr-2" />{_t('Period End Sign-off', 'Period End Sign-off')}</Button>
                    <Button variant="default">
                        <RefreshCcw className="h-4 w-4 mr-2" />{_t('Run Auto-Match', 'Run Auto-Match')}</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{_t('Exception Queue', 'Exception Queue')}</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">35</div>
                        <p className="text-xs text-muted-foreground">{_t('Transactions need manual review', 'Transactions need manual review')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{_t('Auto-Matched', 'Auto-Matched')}</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">165</div>
                        <p className="text-xs text-muted-foreground">{_t('From recent statement', 'From recent statement')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{_t('AI Match Rate', 'AI Match Rate')}</CardTitle>
                        <Search className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">82.5%</div>
                        <p className="text-xs text-muted-foreground">{_t('System automation performance', 'System automation performance')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{_t('Outstanding Checks', 'Outstanding Checks')}</CardTitle>
                        <RefreshCcw className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">4</div>
                        <p className="text-xs text-muted-foreground">{_t('Older than 30 days', 'Older than 30 days')}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{_t('Exception Queue', 'Exception Queue')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">{_t('التاريخ', 'Date')}</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">{_t('الوصف', 'Description')}</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">{_t('النوع', 'Type')}</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">{_t('المبلغ', 'Amount')}</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">{_t('AI Suggestion', 'AI Suggestion')}</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium">{_t('إجراءات', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {[1, 2, 3].map((i) => (
                                    <tr key={i}>
                                        <td className="px-4 py-3 text-sm">2026-05-{10+i}</td>
                                        <td className="px-4 py-3 text-sm truncate max-w-xs">Payment received from client #{i*15} for services</td>
                                        <td className="px-4 py-3 text-sm"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">{_t('رصيد دائن', 'CREDIT')}</span></td>
                                        <td className="px-4 py-3 text-sm">SAR {(5000 * i).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs">Invoice #{4000+i} (85% Match)</span>
                                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '85%' }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right space-x-2">
                                            <Button variant="outline" size="sm">{_t('إنشاء JE', 'Create JE')}</Button>
                                            <Button variant="default" size="sm">{_t('Match', 'Match')}</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
