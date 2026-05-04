"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Box, Calculator, Settings, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';

export default function FixedAssetsDashboard() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Fixed Assets Register</h1>
                    <p className="text-muted-foreground">Manage asset lifecycle, depreciation, and impairments</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Box className="h-4 w-4 mr-2" /> Add Asset
                    </Button>
                    <Button variant="default">
                        <Calculator className="h-4 w-4 mr-2" /> Run Depreciation
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Assets Value</CardTitle>
                        <Box className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">SAR 45.2M</div>
                        <p className="text-xs text-muted-foreground">Gross book value</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Accumulated Depr.</CardTitle>
                        <Calculator className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">SAR 12.8M</div>
                        <p className="text-xs text-muted-foreground">Life to date</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Book Value</CardTitle>
                        <Settings className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">SAR 32.4M</div>
                        <p className="text-xs text-muted-foreground">Current NBV</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Transfers</CardTitle>
                        <ArrowRightLeft className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">5</div>
                        <p className="text-xs text-muted-foreground">Location or custodian changes</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Asset Acquisitions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Asset ID</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Acquisition Date</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {[1, 2, 3].map((i) => (
                                    <tr key={i}>
                                        <td className="px-4 py-3 text-sm font-medium text-blue-600">FA-26-{1000+i}</td>
                                        <td className="px-4 py-3 text-sm">Industrial Machine Model X{i}</td>
                                        <td className="px-4 py-3 text-sm">Machinery & Equipment</td>
                                        <td className="px-4 py-3 text-sm">2026-04-1{i}</td>
                                        <td className="px-4 py-3 text-sm">SAR {(150000 * i).toLocaleString()}</td>
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
