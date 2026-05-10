import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, FileOutput, ShieldAlert, CheckSquare } from 'lucide-react';

import prisma from '@/lib/prisma';
import { _t } from '@/lib/server-t';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.app.(dashboard).' });
export default async function YearEndCloseDashboard() {
    // Fetch live data from Prisma
    const unpostedJEsCount = await prisma.journalEntry.count({
        where: { status: 'draft' }
    });

    const pendingDepreciationCount = await prisma.fixedAsset.count({
        where: { status: 'ACTIVE' } // simplified check for active assets needing depreciation
    });

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{_t('Period & Year-End Close', 'Period & Year-End Close')}</h1>
                    <p className="text-muted-foreground">{_t('Manage financial period locking, retained earnings rollover, and audit trails', 'Manage financial period locking, retained earnings rollover, and audit trails')}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <FileOutput className="h-4 w-4 mr-2" />{_t('Generate TB', 'Generate TB')}</Button>
                    <Button variant="default">
                        <Lock className="h-4 w-4 mr-2" />{_t('Execute Soft Close', 'Execute Soft Close')}</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{_t('Current Open Period', 'Current Open Period')}</CardTitle>
                        <Lock className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{currentMonth} {currentYear}</div>
                        <p className="text-xs text-muted-foreground">{_t('Active operational period', 'Active operational period')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{_t('Pre-close Checklist', 'Pre-close Checklist')}</CardTitle>
                        <CheckSquare className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">4 / 12</div>
                        <p className="text-xs text-muted-foreground">{_t('Tasks completed', 'Tasks completed')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{_t('Unposted JEs', 'Unposted JEs')}</CardTitle>
                        <ShieldAlert className={`h-4 w-4 ${unpostedJEsCount > 0 ? 'text-orange-500' : 'text-green-500'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{unpostedJEsCount}</div>
                        <p className="text-xs text-muted-foreground">{_t('Require posting before close', 'Require posting before close')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{_t('Last Hard Close', 'Last Hard Close')}</CardTitle>
                        <Lock className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">FY {currentYear - 1}</div>
                        <p className="text-xs text-muted-foreground">{_t('Locked by Admin', 'Locked by Admin')}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Closing Checklist ({currentMonth} {currentYear})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">{_t('المهمة (Task)', 'Task')}</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">{_t('Owner', 'Owner')}</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">{_t('الحالة', 'Status')}</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium">{_t('✅ جميع المنتجات لديها باركود', 'Action')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                <tr>
                                    <td className="px-4 py-3 text-sm">Post all pending Journal Entries ({unpostedJEsCount})</td>
                                    <td className="px-4 py-3 text-sm">{_t('Accounting Team', 'Accounting Team')}</td>
                                    <td className="px-4 py-3 text-sm">
                                        {unpostedJEsCount > 0 ? (
                                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">{_t('PENDING', 'PENDING')}</span>
                                        ) : (
                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">{_t('DONE', 'DONE')}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right"><Button variant="ghost" size="sm">{_t('Review', 'Review')}</Button></td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 text-sm">{_t('Complete Bank Reconciliation', 'Complete Bank Reconciliation')}</td>
                                    <td className="px-4 py-3 text-sm">{_t('Treasury Team', 'Treasury Team')}</td>
                                    <td className="px-4 py-3 text-sm"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">{_t('DONE', 'DONE')}</span></td>
                                    <td className="px-4 py-3 text-sm text-right"><Button variant="ghost" size="sm">{_t('عرض', 'View')}</Button></td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 text-sm">{_t('Run Depreciation (Fixed Assets)', 'Run Depreciation (Fixed Assets)')}</td>
                                    <td className="px-4 py-3 text-sm">{_t('Asset Manager', 'Asset Manager')}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">{_t('OVERDUE', 'OVERDUE')}</span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right"><Button variant="ghost" size="sm">{_t('Execute', 'Execute')}</Button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
