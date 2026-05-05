'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ClinicLabPage() {
    const [tests, setTests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTests = async () => {
            try {
                const res = await fetch('/api/v3/clinic/lab');
                const data = await res.json();
                if (data.tests) setTests(data.tests);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTests();
    }, []);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Lab Tests & Results Integration</h1>
                <Button>Order Lab Test</Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Recent Lab Orders</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? <p>Loading...</p> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3">Order ID</th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Patient</th>
                                        <th className="px-4 py-3">Test Name</th>
                                        <th className="px-4 py-3">Ordering Doctor</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Result Summary</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tests.map((t, idx) => (
                                        <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                                            <td className="px-4 py-3 font-mono font-bold">{t.id}</td>
                                            <td className="px-4 py-3">{t.date}</td>
                                            <td className="px-4 py-3 font-bold">{t.patient}</td>
                                            <td className="px-4 py-3 font-medium text-gray-800">{t.testName}</td>
                                            <td className="px-4 py-3 text-blue-600">{t.doctor}</td>
                                            <td className="px-4 py-3">
                                                {t.status === 'COMPLETED' ? (
                                                    <Badge className="bg-green-100 text-green-800">Completed</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-800">Pending Sample</Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-green-600">{t.result || '-'}</td>
                                            <td className="px-4 py-3 text-right space-x-2">
                                                {t.status === 'COMPLETED' ? (
                                                    <Button size="sm" variant="outline">View Results PDF</Button>
                                                ) : (
                                                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-500">Collect Sample</Button>
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
