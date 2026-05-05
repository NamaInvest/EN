'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function BudgetVarianceDashboard() {
    const [varianceData, setVarianceData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVariance = async () => {
            try {
                const res = await fetch('/api/finance/budget/variance');
                const data = await res.json();
                if (Array.isArray(data)) {
                    setVarianceData(data);
                }
            } catch (err) {
                console.error('Failed to fetch budget variance', err);
            } finally {
                setLoading(false);
            }
        };

        fetchVariance();
    }, []);

    const renderStatusBadge = (variancePct: number) => {
        if (variancePct < 0) return <Badge className="bg-red-100 text-red-800">OVER BUDGET</Badge>;
        if (variancePct < 20) return <Badge className="bg-yellow-100 text-yellow-800">WARNING (0-20%)</Badge>;
        return <Badge className="bg-green-100 text-green-800">UNDER BUDGET</Badge>;
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Budget vs Actual Variance</h1>
            
            <Card>
                <CardHeader>
                    <CardTitle>Variance Report</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? <p>Loading...</p> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3">Account</th>
                                        <th className="px-4 py-3 text-right">Budget</th>
                                        <th className="px-4 py-3 text-right">Actual</th>
                                        <th className="px-4 py-3 text-right">Encumbered</th>
                                        <th className="px-4 py-3 text-right">Available</th>
                                        <th className="px-4 py-3 text-right">Variance</th>
                                        <th className="px-4 py-3 text-right">Var %</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {varianceData.map((row, idx) => (
                                        <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                                            <td className="px-4 py-3 font-medium">{row.accountName}</td>
                                            <td className="px-4 py-3 text-right">{row.budgetAmount.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right">{row.actualAmount.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right">{row.encumberedAmount.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right">{row.available.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right">{row.variance.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right">{row.variancePct.toFixed(2)}%</td>
                                            <td className="px-4 py-3 text-center">{renderStatusBadge(row.variancePct)}</td>
                                        </tr>
                                    ))}
                                    {varianceData.length === 0 && (
                                        <tr><td colSpan={8} className="text-center py-6 text-gray-500">No active budget or data found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
