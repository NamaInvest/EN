'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function PeriodCloseChecklistPage() {
    const [checklist, setChecklist] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [periodId, setPeriodId] = useState('1'); // Mock default

    const fetchChecklist = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/finance/period-close?periodId=${periodId}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setChecklist(data);
            }
        } catch (err) {
            console.error('Failed to fetch period close checklist', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChecklist();
    }, [periodId]);

    const startClose = async () => {
        try {
            await fetch('/api/finance/period-close', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fiscalPeriodId: periodId })
            });
            fetchChecklist();
        } catch (err) {
            console.error(err);
        }
    };

    const updateStatus = async (id: number, status: string) => {
        try {
            await fetch(`/api/finance/period-close/${id}/step`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            fetchChecklist();
        } catch (err) {
            console.error(err);
        }
    };

    const renderBadge = (status: string) => {
        if (status === 'DONE') return <Badge className="bg-green-100 text-green-800">DONE</Badge>;
        if (status === 'IN_PROGRESS') return <Badge className="bg-blue-100 text-blue-800">IN PROGRESS</Badge>;
        return <Badge className="bg-gray-100 text-gray-800">PENDING</Badge>;
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Period Close Checklist</h1>
                <div className="space-x-2 flex">
                    <Input 
                        placeholder="Fiscal Period ID" 
                        value={periodId} 
                        onChange={e => setPeriodId(e.target.value)}
                        className="w-32"
                    />
                    <Button onClick={startClose}>Start Close</Button>
                    <Button variant="destructive">Lock Period</Button>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Close Steps for Period #{periodId}</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? <p>Loading...</p> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3">Step #</th>
                                        <th className="px-4 py-3">Task</th>
                                        <th className="px-4 py-3">Owner</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Notes</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {checklist.map((item, idx) => (
                                        <tr key={item.id} className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                                            <td className="px-4 py-3 font-medium">{item.sequence}</td>
                                            <td className="px-4 py-3">{item.taskName}</td>
                                            <td className="px-4 py-3">{item.owner}</td>
                                            <td className="px-4 py-3">{renderBadge(item.status)}</td>
                                            <td className="px-4 py-3 max-w-xs truncate">{item.notes || '-'}</td>
                                            <td className="px-4 py-3 text-right space-x-2">
                                                {item.status !== 'DONE' && (
                                                    <Button size="sm" variant="outline" className="border-green-500 text-green-600 hover:bg-green-50" onClick={() => updateStatus(item.id, 'DONE')}>Mark Done</Button>
                                                )}
                                                {item.status === 'DONE' && (
                                                    <Button size="sm" variant="outline" className="text-gray-600" onClick={() => updateStatus(item.id, 'PENDING')}>Reopen</Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {checklist.length === 0 && (
                                        <tr><td colSpan={6} className="text-center py-6 text-gray-500">No close checklist started for this period. Click 'Start Close' to generate tasks.</td></tr>
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
