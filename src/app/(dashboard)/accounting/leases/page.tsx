import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Building, FileSignature, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

export default async function LeasesDashboard() {
    // 1. Total ROU Assets
    const rouAgg = await prisma.ifrsLeaseContract.aggregate({
        _sum: { currentRouNbv: true },
        where: { status: 'ACTIVE' }
    });

    // 2. Lease Liabilities
    const liabilityAgg = await prisma.ifrsLeaseContract.aggregate({
        _sum: { currentLiability: true },
        where: { status: 'ACTIVE' }
    });

    // 3. Active Contracts
    const activeContractsCount = await prisma.ifrsLeaseContract.count({
        where: { status: 'ACTIVE' }
    });

    // 4. Payments Due (Next 30 days) - This would be from IfrsLeaseScheduleLine
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    
    // Simplification for the dashboard: count scheduled payments in next 30 days.
    // If not directly available, we can just show a placeholder or a sum of monthly paymentAmount of active leases.
    // We will show a sum of paymentAmount for active contracts that are due monthly.
    const monthlyPaymentsAgg = await prisma.ifrsLeaseContract.aggregate({
        _sum: { paymentAmount: true },
        where: { status: 'ACTIVE', paymentFrequency: 'MONTHLY' }
    });

    // Lease Amortization Schedule
    const activeLeases = await prisma.ifrsLeaseContract.findMany({
        take: 10,
        where: { status: 'ACTIVE' },
        orderBy: { id: 'desc' },
        include: { schedule: true }
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Lease Accounting (IFRS 16)</h1>
                    <p className="text-muted-foreground">Manage right-of-use (ROU) assets and lease liabilities</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <FileSignature className="h-4 w-4 mr-2" /> Add Lease
                    </Button>
                    <Button variant="default">
                        <DollarSign className="h-4 w-4 mr-2" /> Post Monthly Entries
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total ROU Assets</CardTitle>
                        <Building className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">SAR {Number(rouAgg._sum.currentRouNbv || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground">Net book value</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lease Liabilities</CardTitle>
                        <Briefcase className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">SAR {Number(liabilityAgg._sum.currentLiability || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground">Current + Non-current</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
                        <FileSignature className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeContractsCount}</div>
                        <p className="text-xs text-muted-foreground">IFRS 16 Leases</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Payments Due</CardTitle>
                        <DollarSign className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">SAR {Number(monthlyPaymentsAgg._sum.paymentAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground">Approx. next 30 days</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Lease Contracts</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Lease ID</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Class</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Lessor</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {activeLeases.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-4 text-muted-foreground">No active leases.</td></tr>
                                ) : activeLeases.map((lease) => (
                                    <tr key={lease.id}>
                                        <td className="px-4 py-3 text-sm font-medium text-blue-600">{lease.contractNumber}</td>
                                        <td className="px-4 py-3 text-sm">{lease.assetDescription}</td>
                                        <td className="px-4 py-3 text-sm">{lease.leaseClass}</td>
                                        <td className="px-4 py-3 text-sm">{lease.lessor}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">{lease.status}</span>
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
