import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, FileWarning, Handshake, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

import prisma from '@/lib/prisma';
import { _t } from '@/lib/server-t';
export default async function DunningDashboard() {
    // 1. Total Overdue
    const todayDate = new Date();
    const overdueAgg = await prisma.openItem.aggregate({
        _sum: { openAmount: true },
        where: { dueDate: { lt: todayDate }, status: { not: 'CLOSED' } }
    });
    const overdueInvoicesCount = await prisma.openItem.count({
        where: { dueDate: { lt: todayDate }, status: { not: 'CLOSED' } }
    });

    // 2. Letters Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lettersToday = await prisma.dunningLetter.count({
        where: {
            campaign: { startedAt: { gte: today } } 
        }
    });

    // 3. Active Promises
    const activePromises = await prisma.promiseToPay.aggregate({
        _sum: { promisedAmount: true },
        _count: { id: true },
        where: { status: 'ACTIVE' }
    });

    // 4. Blocked Customers
    const blockedCustomersCount = await prisma.customer.count({
        where: { creditHold: true }
    });

    // Recent Letters (from DunningLetter)
    const recentLetters = await prisma.dunningLetter.findMany({
        take: 10,
        orderBy: { id: 'desc' },
        include: { customer: true, level: true }
    });

    // Promises to Pay
    const promises = await prisma.promiseToPay.findMany({
        take: 10,
        where: { status: 'ACTIVE' },
        orderBy: { promisedDate: 'asc' },
        include: { customer: true }
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{_t('Dunning Management', 'Dunning Management')}</h1>
                    <p className="text-muted-foreground">{_t('Automated collections and overdue follow-ups', 'Automated collections and overdue follow-ups')}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="default">
                        <Play className="h-4 w-4 mr-2" />{_t('Run Daily Dunning', 'Run Daily Dunning')}</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{_t('Total Overdue', 'Total Overdue')}</CardTitle>
                        <FileWarning className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">SAR {Number(overdueAgg._sum?.openAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground">Across {overdueInvoicesCount} invoices</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{_t('Letters Today', 'Letters Today')}</CardTitle>
                        <FileWarning className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{lettersToday}</div>
                        <p className="text-xs text-muted-foreground">{_t('Sent automatically', 'Sent automatically')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{_t('Active Promises', 'Active Promises')}</CardTitle>
                        <Handshake className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activePromises._count.id}</div>
                        <p className="text-xs text-muted-foreground">SAR {Number(activePromises._sum.promisedAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} expected</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{_t('Blocked Customers', 'Blocked Customers')}</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{blockedCustomersCount}</div>
                        <p className="text-xs text-muted-foreground">{_t('Credit hold', 'Credit hold')}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex justify-between items-center flex-row">
                        <CardTitle>{_t('Recent Letters', 'Recent Letters')}</CardTitle>
                        <Link href="/accounting/dunning/letters">
                            <Button variant="ghost" size="sm">{_t('View All', 'View All')}</Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium">{_t('Customer', 'Customer')}</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">{_t('المستوى', 'Level')}</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">{_t('المبلغ', 'Amount')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {recentLetters.length === 0 ? (
                                        <tr><td colSpan={3} className="text-center py-4 text-muted-foreground">{_t('No recent letters.', 'No recent letters.')}</td></tr>
                                    ) : recentLetters.map((letter) => (
                                        <tr key={letter.id}>
                                            <td className="px-4 py-3 text-sm">{letter.customer?.name || `Customer ID: ${letter.customerId}`}</td>
                                            <td className="px-4 py-3 text-sm">{letter.level?.nameEn || `Level ${letter.levelId}`}</td>
                                            <td className="px-4 py-3 text-sm">SAR {Number(letter.totalAmountDue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex justify-between items-center flex-row">
                        <CardTitle>{_t('Promises to Pay', 'Promises to Pay')}</CardTitle>
                        <Link href="/accounting/dunning/promises">
                            <Button variant="ghost" size="sm">{_t('View All', 'View All')}</Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium">{_t('Customer', 'Customer')}</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">{_t('Promised Date', 'Promised Date')}</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">{_t('الحالة', 'Status')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {promises.length === 0 ? (
                                        <tr><td colSpan={3} className="text-center py-4 text-muted-foreground">{_t('No active promises.', 'No active promises.')}</td></tr>
                                    ) : promises.map((promise) => (
                                        <tr key={promise.id}>
                                            <td className="px-4 py-3 text-sm">{promise.customer?.name || `Customer ID: ${promise.customerId}`}</td>
                                            <td className="px-4 py-3 text-sm">{format(promise.promisedDate, 'yyyy-MM-dd')}</td>
                                            <td className="px-4 py-3 text-sm"><span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">{promise.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
