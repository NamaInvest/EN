import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, CheckCircle, FileOutput, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

export default async function PaymentRunDashboard() {
    const pendingApprovalCount = await prisma.paymentRun.count({
        where: { status: 'PENDING_APPROVAL' }
    });

    const failedPaymentsCount = await prisma.paymentRun.count({
        where: { status: 'FAILED' }
    });

    const discountOppAgg = await prisma.paymentRun.aggregate({
        _sum: { estimatedSavings: true },
        where: { status: { in: ['DRAFT', 'PROPOSED'] } }
    });
    const discountOpp = Number(discountOppAgg._sum.estimatedSavings || 0);

    const recentRuns = await prisma.paymentRun.findMany({
        take: 10,
        orderBy: { id: 'desc' }
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Payment Runs</h1>
                    <p className="text-muted-foreground">Manage and automate vendor payments (SARIE, SWIFT, SEPA)</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="default">
                        <Play className="h-4 w-4 mr-2" /> Propose New Run
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Next Run Due</CardTitle>
                        <Play className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">In 2 Days</div>
                        <p className="text-xs text-muted-foreground">Automated Schedule</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingApprovalCount} Run(s)</div>
                        <p className="text-xs text-muted-foreground">Waiting for CFO</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Discount Opportunities</CardTitle>
                        <FileOutput className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">SAR {discountOpp.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Available to capture this week</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{failedPaymentsCount}</div>
                        <p className="text-xs text-muted-foreground">Require attention</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Payment Runs</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Run #</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Payment Method</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Due Date Until</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Total Amount</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {recentRuns.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-4 text-muted-foreground">No recent payment runs.</td></tr>
                                ) : recentRuns.map((run) => (
                                    <tr key={run.id}>
                                        <td className="px-4 py-3 text-sm">{run.runNumber}</td>
                                        <td className="px-4 py-3 text-sm">{run.paymentMethod}</td>
                                        <td className="px-4 py-3 text-sm">{format(run.dueDateUntil, 'yyyy-MM-dd')}</td>
                                        <td className="px-4 py-3 text-sm">SAR {Number(run.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                run.status === 'POSTED' || run.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                run.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                                                run.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {run.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right">
                                            <Button variant="ghost" size="sm">View</Button>
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
