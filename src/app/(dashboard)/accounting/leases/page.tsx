"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Building, FileSignature, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default function LeasesDashboard() {
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
                        <div className="text-2xl font-bold">SAR 15.2M</div>
                        <p className="text-xs text-muted-foreground">Net book value</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lease Liabilities</CardTitle>
                        <Briefcase className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">SAR 16.1M</div>
                        <p className="text-xs text-muted-foreground">Current + Non-current</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
                        <FileSignature className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">24</div>
                        <p className="text-xs text-muted-foreground">Across 5 branches</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Payments Due</CardTitle>
                        <DollarSign className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">SAR 450k</div>
                        <p className="text-xs text-muted-foreground">Next 30 days</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Lease Amortization Schedule (May 2026)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Lease ID</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Depreciation (Dr)</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Interest Expense (Dr)</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {[1, 2, 3].map((i) => (
                                    <tr key={i}>
                                        <td className="px-4 py-3 text-sm font-medium text-blue-600">LSE-00{i}</td>
                                        <td className="px-4 py-3 text-sm">HQ Office Space - Floor {i}</td>
                                        <td className="px-4 py-3 text-sm">SAR {(25000 * i).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-sm">SAR {(4500 * i).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">PENDING</span>
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
