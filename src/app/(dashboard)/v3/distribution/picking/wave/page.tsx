'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function DistributionWavePickingPage() {
    const [waves, setWaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWaves = async () => {
            try {
                const res = await fetch('/api/v3/distribution/picking/wave');
                const data = await res.json();
                if (data.waves) setWaves(data.waves);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchWaves();
    }, []);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Wave Picking Console</h1>
                <Button>Generate Pick Wave</Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Active Picking Waves</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? <p>Loading...</p> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3">Wave ID</th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Total Orders</th>
                                        <th className="px-4 py-3">Assigned Picker</th>
                                        <th className="px-4 py-3">Progress</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {waves.map((wave, idx) => (
                                        <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                                            <td className="px-4 py-3 font-mono font-bold">{wave.id}</td>
                                            <td className="px-4 py-3">{wave.date}</td>
                                            <td className="px-4 py-3">{wave.type}</td>
                                            <td className="px-4 py-3 text-center">{wave.totalOrders}</td>
                                            <td className="px-4 py-3">{wave.picker}</td>
                                            <td className="px-4 py-3">
                                                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
                                                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${wave.progress}%` }}></div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {wave.status === 'IN_PROGRESS' ? (
                                                    <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
                                                ) : (
                                                    <Badge variant="outline">Pending</Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right space-x-2">
                                                <Button size="sm" variant="outline">Print Slips</Button>
                                                {wave.status === 'PENDING' && (
                                                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-500">Release</Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
