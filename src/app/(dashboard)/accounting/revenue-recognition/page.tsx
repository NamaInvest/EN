import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

export default async function RevenueRecognitionDashboard() {
    // 1. Total Deferred Revenue (Total Unearned)
    const deferredAgg = await prisma.deferredRevenueSchedule.aggregate({
        _sum: { totalAmount: true },
        where: { isCurrent: true }
    });
    
    const schedules = await prisma.deferredRevenueSchedule.findMany({
        where: { isCurrent: true },
        include: { performanceObligation: { include: { contract: true } } }
    });
    
    let totalUnearned = 0;
    schedules.forEach(s => {
        if (s.recognizedLines < s.totalLines) {
             totalUnearned += Number(s.totalAmount) * ((s.totalLines - s.recognizedLines) / s.totalLines);
        }
    });

    // 2. Recognized This Month
    const currentMonthStart = new Date(new Date().setDate(1));
    currentMonthStart.setHours(0, 0, 0, 0);
    
    const recognizedAgg = await prisma.revenueRecognitionLine.aggregate({
        _sum: { scheduledAmount: true },
        where: { 
            status: 'RECOGNIZED',
            recognizedAt: { gte: currentMonthStart }
        }
    });
    const recognizedThisMonth = Number(recognizedAgg._sum?.scheduledAmount || 0);

    // 3. Active Contracts
    const activeContractsCount = await prisma.salesContract.count({
        where: { status: 'ACTIVE' }
    });

    // 4. Exceptions
    const exceptionsCount = await prisma.revenueRecognitionLine.count({
        where: { status: 'EXCEPTION' }
    }).catch(() => 0); // Fallback if EXCEPTION doesn't exist

    // Upcoming Schedules
    const upcomingLines = await prisma.revenueRecognitionLine.findMany({
        where: { status: 'PENDING' },
        take: 10,
        orderBy: { recognitionDate: 'asc' },
        include: { schedule: { include: { performanceObligation: { include: { contract: { include: { customer: true } } } } } } }
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Revenue Recognition (IFRS 15)</h1>
                    <p className="text-muted-foreground">Automated performance obligation tracking and deferred revenue amortization</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <TrendingUp className="h-4 w-4 mr-2" /> Forecast
                    </Button>
                    <Button variant="default">
                        <Target className="h-4 w-4 mr-2" /> Run Amortization
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unearned Revenue</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">SAR {totalUnearned.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground">Total deferred liability</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recognized (This Month)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">SAR {recognizedThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground">Posted to general ledger</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeContractsCount}</div>
                        <p className="text-xs text-muted-foreground">Under active amortization</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Exceptions</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{exceptionsCount}</div>
                        <p className="text-xs text-muted-foreground">Requires manual review</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Amortization Schedules</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Contract #</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Customer</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Schedule Type</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Next Recognition</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {upcomingLines.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-4 text-muted-foreground">No upcoming schedules.</td></tr>
                                ) : upcomingLines.map((line) => (
                                    <tr key={line.id}>
                                        <td className="px-4 py-3 text-sm text-blue-600">
                                            {line.schedule?.performanceObligation?.contract?.contractNumber || 'Unknown'}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {line.schedule?.performanceObligation?.contract?.customer?.name || 'Unknown'}
                                        </td>
                                        <td className="px-4 py-3 text-sm">{line.schedule?.frequency || '-'}</td>
                                        <td className="px-4 py-3 text-sm">{format(new Date(line.recognitionDate), 'yyyy-MM-dd')}</td>
                                        <td className="px-4 py-3 text-sm">SAR {Number(line.scheduledAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
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
