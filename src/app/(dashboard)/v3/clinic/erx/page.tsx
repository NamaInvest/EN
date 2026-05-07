'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function ClinicERxPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPrescriptions = async () => {
            try {
                const res = await fetch('/api/v3/clinic/erx');
                const data = await res.json();
                if (data.prescriptions) setPrescriptions(data.prescriptions);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPrescriptions();
    }, []);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Electronic Prescriptions (e-Rx)</h1>
                <Button>Create New Prescription</Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Recent Prescriptions</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? <p>Loading...</p> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3">e-Rx ID</th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Patient</th>
                                        <th className="px-4 py-3">Prescribing Doctor</th>
                                        <th className="px-4 py-3">Medications</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {prescriptions.map((rx, idx) => (
                                        <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                                            <td className="px-4 py-3 font-mono font-bold">{rx.id}</td>
                                            <td className="px-4 py-3">{rx.date}</td>
                                            <td className="px-4 py-3 font-bold">{rx.patient}</td>
                                            <td className="px-4 py-3 text-blue-600">{rx.doctor}</td>
                                            <td className="px-4 py-3 text-gray-500">{rx.medications.join(', ')}</td>
                                            <td className="px-4 py-3">
                                                {rx.status === 'ACTIVE' ? (
                                                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                                                ) : (
                                                    <Badge variant="outline">Dispensed</Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right space-x-2">
                                                <Button size="sm" variant="outline">Print / PDF</Button>
                                                {rx.status === 'ACTIVE' && (
                                                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-500">Send to Pharmacy</Button>
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
