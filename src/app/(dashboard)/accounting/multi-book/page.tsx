import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, RefreshCcw, FileText, Settings } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

import prisma from '@/lib/prisma';
export default async function MultiBookDashboard() {
    // 1. Primary Book (IFRS) -> bookId: null or 1
    const primaryBookCount = await prisma.journalEntry.count({
        where: { OR: [{ bookId: null }, { bookId: 1 }] }
    });

    // 2. Tax Book (ZATCA) -> bookId: 2
    const taxBookCount = await prisma.journalEntry.count({
        where: { bookId: 2 }
    });

    // 3. Management Book -> bookId: 3
    const managementBookCount = await prisma.journalEntry.count({
        where: { bookId: 3 }
    });

    const recentAdjustments = await prisma.journalEntry.findMany({
        take: 5,
        where: { AND: [{ bookId: { notIn: [1] } }, { bookId: { not: null } }] },
        orderBy: { id: 'desc' }
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Multi-Book Accounting</h1>
                    <p className="text-muted-foreground">Manage IFRS, ZATCA, and Management accounting ledgers simultaneously</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Settings className="h-4 w-4 mr-2" /> Book Mappings
                    </Button>
                    <Button variant="default">
                        <FileText className="h-4 w-4 mr-2" /> Generate Consolidated Report
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Primary Book (IFRS)</CardTitle>
                        <BookOpen className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{primaryBookCount.toLocaleString()} Entries</div>
                        <p className="text-xs text-muted-foreground">Base ledger</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tax Book (ZATCA)</CardTitle>
                        <BookOpen className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{taxBookCount.toLocaleString()} Entries</div>
                        <p className="text-xs text-muted-foreground">Excludes non-deductible items</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Management Book</CardTitle>
                        <BookOpen className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{managementBookCount.toLocaleString()} Entries</div>
                        <p className="text-xs text-muted-foreground">Includes internal allocations</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Cross-Book Adjustments</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Target Book</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {recentAdjustments.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-4 text-muted-foreground">No recent adjustments.</td></tr>
                                ) : recentAdjustments.map((entry) => (
                                    <tr key={entry.id}>
                                        <td className="px-4 py-3 text-sm">{entry.entryDate}</td>
                                        <td className="px-4 py-3 text-sm truncate max-w-xs">{entry.description || 'No description'}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                                                {entry.bookId === 2 ? 'TAX_BOOK' : 'MANAGEMENT_BOOK'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm">SAR {(entry.totalDebit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-3 text-sm text-right space-x-2">
                                            <Button variant="ghost" size="sm">View JE</Button>
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
