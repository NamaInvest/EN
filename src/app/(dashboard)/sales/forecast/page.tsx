'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SalesForecastPage() {
    const [data, setData] = useState<any[]>([]);
    const [period, setPeriod] = useState('2026');
    const [loading, setLoading] = useState(true);

    const fetchForecast = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/sales/forecast?period=${period}`);
            const json = await res.json();
            if (json.data) {
                setData(json.data);
            }
        } catch (err) {
            console.error('Failed to fetch forecast', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchForecast();
    }, [period]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Sales Forecast & Pipeline</h1>
                <div className="space-x-2 flex">
                    <Input 
                        placeholder="Year (e.g. 2026)" 
                        value={period} 
                        onChange={e => setPeriod(e.target.value)}
                        className="w-32"
                    />
                    <Button onClick={fetchForecast}>Refresh</Button>
                    <Button variant="outline">Lock Forecast</Button>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Pipeline Waterfall - {period}</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? <p>Loading...</p> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3">Month</th>
                                        <th className="px-4 py-3 text-right text-green-600">Won (Actual)</th>
                                        <th className="px-4 py-3 text-right text-red-600">Lost</th>
                                        <th className="px-4 py-3 text-right text-blue-600">In Progress</th>
                                        <th className="px-4 py-3 text-right font-bold">Total Pipeline</th>
                                        <th className="px-4 py-3 text-right">Win Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((row, idx) => {
                                        const totalClosed = row.won + row.lost;
                                        const winRate = totalClosed > 0 ? ((row.won / totalClosed) * 100).toFixed(1) + '%' : 'N/A';
                                        return (
                                            <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                                                <td className="px-4 py-3 font-medium">{row.month}</td>
                                                <td className="px-4 py-3 text-right text-green-600">${row.won.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right text-red-600">${row.lost.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right text-blue-600">${row.inProgress.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right font-bold">${row.pipeline.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right">{winRate}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
