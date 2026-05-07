'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function SLATrackingPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [slas] = useState([
        { id: 'WO-1001', client: 'Alpha Corp', type: 'Resolution Time', target: '4 Hours', elapsed: '2h 15m', status: 'ON_TRACK' },
        { id: 'TKT-992', client: 'Gamma Inc', type: 'First Response', target: '1 Hour', elapsed: '1h 10m', status: 'BREACHED' },
    ]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">SLA Tracking & Compliance</h1>
                <Button variant="outline">Export Report</Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Active SLAs</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-4 py-3">Reference ID</th>
                                    <th className="px-4 py-3">Client</th>
                                    <th className="px-4 py-3">SLA Type</th>
                                    <th className="px-4 py-3">Target Time</th>
                                    <th className="px-4 py-3">Elapsed Time</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {slas.map((sla, idx) => (
                                    <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                                        <td className="px-4 py-3 font-mono font-bold">{sla.id}</td>
                                        <td className="px-4 py-3 font-bold">{sla.client}</td>
                                        <td className="px-4 py-3">{sla.type}</td>
                                        <td className="px-4 py-3 font-mono">{sla.target}</td>
                                        <td className="px-4 py-3 font-mono">{sla.elapsed}</td>
                                        <td className="px-4 py-3">
                                            {sla.status === 'ON_TRACK' ? (
                                                <Badge className="bg-green-100 text-green-800">On Track</Badge>
                                            ) : (
                                                <Badge className="bg-red-100 text-red-800 animate-pulse">Breached</Badge>
                                            )}
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
