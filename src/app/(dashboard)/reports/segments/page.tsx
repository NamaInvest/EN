'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SegmentReportingPage() {
    const [segments] = useState([
        { id: 'SEG-01', name: 'Retail Electronics', revenue: 4500000, cost: 2800000, margin: 1700000, marginPct: 37.7 },
        { id: 'SEG-02', name: 'B2B Software Services', revenue: 3200000, cost: 1200000, margin: 2000000, marginPct: 62.5 },
    ]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Segment Reporting (IFRS 8)</h1>
                <Button>Export Segment Report</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="pb-2"><CardTitle className="text-blue-800 text-sm">Total Segment Revenue</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold text-blue-900">SAR 7,700,000</div></CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                    <CardHeader className="pb-2"><CardTitle className="text-green-800 text-sm">Total Segment Margin</CardTitle></CardHeader>
                    <CardContent><div className="text-3xl font-bold text-green-900">SAR 3,700,000</div></CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Performance by Operating Segment</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-4 py-3">Segment Name</th>
                                    <th className="px-4 py-3 text-right">Revenue (SAR)</th>
                                    <th className="px-4 py-3 text-right">Cost (SAR)</th>
                                    <th className="px-4 py-3 text-right">Gross Margin (SAR)</th>
                                    <th className="px-4 py-3 text-center">Margin %</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {segments.map((seg, idx) => (
                                    <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                                        <td className="px-4 py-3 font-bold">{seg.name}</td>
                                        <td className="px-4 py-3 text-right font-medium text-gray-700">{seg.revenue.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right font-medium text-red-600">{seg.cost.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right font-bold text-green-600">{seg.margin.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-center font-bold bg-gray-50">{seg.marginPct}%</td>
                                        <td className="px-4 py-3 text-right">
                                            <Button size="sm" variant="outline">Drilldown</Button>
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
