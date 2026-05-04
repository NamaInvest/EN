import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Box, Calculator, Settings, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

export default async function FixedAssetsDashboard() {
    // 1. Total Assets Value (Gross Book Value)
    const gbaAgg = await prisma.fixedAsset.aggregate({
        _sum: { acquisitionCost: true },
        where: { status: 'ACTIVE' }
    });

    // 2. Accumulated Depreciation
    const accDepAgg = await prisma.fixedAsset.aggregate({
        _sum: { accumulatedDepreciation: true },
        where: { status: 'ACTIVE' }
    });

    // 3. Net Book Value
    const nbvAgg = await prisma.fixedAsset.aggregate({
        _sum: { currentBookValue: true },
        where: { status: 'ACTIVE' }
    });

    // 4. Pending Transfers
    // Simplified assumption: Assets with status 'TRANSFERRED' or something similar.
    // Or just fetch assets acquired recently if 'TRANSFERRED' isn't available. Let's count recently added.
    const pendingTransfers = await prisma.fixedAsset.count({
        where: { status: 'HELD_FOR_SALE' }
    });

    // Recent Assets
    const recentAssets = await prisma.fixedAsset.findMany({
        take: 10,
        orderBy: { acquisitionDate: 'desc' },
        include: { category: true }
    });

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
                        <div className="text-2xl font-bold">SAR {Number(gbaAgg._sum.acquisitionCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground">Gross book value</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Accumulated Depr.</CardTitle>
                        <Calculator className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">SAR {Number(accDepAgg._sum.accumulatedDepreciation || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground">Life to date</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Book Value</CardTitle>
                        <Settings className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">SAR {Number(nbvAgg._sum.currentBookValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground">Current NBV</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Held for Sale</CardTitle>
                        <ArrowRightLeft className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingTransfers}</div>
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
                                {recentAssets.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-4 text-muted-foreground">No recent assets.</td></tr>
                                ) : recentAssets.map((asset) => (
                                    <tr key={asset.id}>
                                        <td className="px-4 py-3 text-sm font-medium text-blue-600">{asset.assetNumber}</td>
                                        <td className="px-4 py-3 text-sm">{asset.name}</td>
                                        <td className="px-4 py-3 text-sm">{asset.category?.nameEn || 'Uncategorized'}</td>
                                        <td className="px-4 py-3 text-sm">{format(asset.acquisitionDate, 'yyyy-MM-dd')}</td>
                                        <td className="px-4 py-3 text-sm">SAR {Number(asset.acquisitionCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
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
