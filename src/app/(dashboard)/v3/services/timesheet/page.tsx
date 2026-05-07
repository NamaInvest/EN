'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function ProjectTimeBillingPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [entries] = useState([
        { id: 'TS-001', employee: 'Sami K.', project: 'ERP Implementation', task: 'Requirements Gathering', hours: 8, billable: true, rate: 150, status: 'APPROVED' },
        { id: 'TS-002', employee: 'Rami A.', project: 'Cloud Migration', task: 'Server Setup', hours: 5.5, billable: true, rate: 200, status: 'DRAFT' },
    ]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Project Time & Billing</h1>
                <div className="space-x-2">
                    <Button variant="outline">Log Time</Button>
                    <Button>Generate Invoices</Button>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Timesheet Entries</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-4 py-3">Entry ID</th>
                                    <th className="px-4 py-3">Employee</th>
                                    <th className="px-4 py-3">Project / Task</th>
                                    <th className="px-4 py-3 text-center">Hours</th>
                                    <th className="px-4 py-3 text-center">Billable</th>
                                    <th className="px-4 py-3 text-right">Total (SAR)</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map((ts, idx) => (
                                    <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                                        <td className="px-4 py-3 font-mono text-gray-500">{ts.id}</td>
                                        <td className="px-4 py-3 font-bold">{ts.employee}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-blue-600">{ts.project}</div>
                                            <div className="text-xs text-gray-500">{ts.task}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold">{ts.hours}</td>
                                        <td className="px-4 py-3 text-center">
                                            {ts.billable ? <span className="text-green-600">✔</span> : <span className="text-gray-400">✖</span>}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-green-700">${(ts.hours * ts.rate).toLocaleString()}</td>
                                        <td className="px-4 py-3">
                                            {ts.status === 'APPROVED' ? (
                                                <Badge className="bg-green-100 text-green-800">Approved</Badge>
                                            ) : (
                                                <Badge variant="outline">Draft</Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                            <Button size="sm" variant="outline">Edit</Button>
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