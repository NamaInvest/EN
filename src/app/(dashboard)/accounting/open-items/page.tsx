import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layers, FileSearch, ArrowRightLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

export default async function OpenItemsDashboard() {
    // 1. Total Open AP
    const openApAgg = await prisma.openItem.aggregate({
        _sum: { openAmount: true },
        where: { partyType: 'vendor', openAmount: { gt: 0 } }
    });
    const totalOpenAp = Number(openApAgg._sum.openAmount || 0);

    // 2. Total Open AR
    const openArAgg = await prisma.openItem.aggregate({
        _sum: { openAmount: true },
        where: { partyType: 'customer', openAmount: { gt: 0 } }
    });
    const totalOpenAr = Number(openArAgg._sum.openAmount || 0);

    // 3. Unapplied Payments
    const unappliedAgg = await prisma.openItem.aggregate({
        _sum: { openAmount: true },
        where: { documentType: 'payment', openAmount: { gt: 0 } }
    });
    const totalUnapplied = Number(unappliedAgg._sum.openAmount || 0);

    // 4. Suggested Clearings (For now, just list some open items)
    const openItems = await prisma.openItem.findMany({
        where: { openAmount: { gt: 0 } },
        take: 10,
        orderBy: { documentDate: 'desc' }
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Open Items Clearing</h1>
                    <p className="text-muted-foreground">Match and clear open AP/AR invoices against payments</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <FileSearch className="h-4 w-4 mr-2" /> Find Matches
                    </Button>
                    <Button variant="default">
                        <Layers className="h-4 w-4 mr-2" /> Auto-Clear
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open AP (Vendors)</CardTitle>
                        <ArrowRightLeft className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">SAR {totalOpenAp.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open AR (Customers)</CardTitle>
                        <ArrowRightLeft className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">SAR {totalOpenAr.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unapplied Payments</CardTitle>
                        <Layers className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">SAR {totalUnapplied.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground">Payments without matched invoices</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Open Items (Pending Clearance)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Party Type</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Doc Type</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Doc Number</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Doc Date</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Open Amount</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {openItems.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-4 text-muted-foreground">No open items found.</td></tr>
                                ) : openItems.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3 text-sm font-medium capitalize">{item.partyType}</td>
                                        <td className="px-4 py-3 text-sm capitalize">{item.documentType.replace('_', ' ')}</td>
                                        <td className="px-4 py-3 text-sm">{item.documentNumber}</td>
                                        <td className="px-4 py-3 text-sm">{format(item.documentDate, 'yyyy-MM-dd')}</td>
                                        <td className="px-4 py-3 text-sm">SAR {Number(item.openAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-3 text-sm text-right space-x-2">
                                            <Button variant="default" size="sm">Clear</Button>
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
