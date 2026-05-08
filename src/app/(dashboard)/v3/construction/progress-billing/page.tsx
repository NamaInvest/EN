'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ConstructionProgressBillingPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [billings, setBillings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBillings = async () => {
            try {
                const res = await fetch('/api/v3/construction/progress-billing');
                const data = await res.json();
                if (data.billings) setBillings(data.billings);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchBillings();
    }, []);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">{_t('Progress Billing & Retention', 'Progress Billing & Retention')}</h1>
                <Button>+ New Payment Certificate</Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>{_t('Interim Payment Certificates (IPC)', 'Interim Payment Certificates (IPC)')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? <p>{_t('جاري التحميل...', 'Loading...')}</p> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3">{_t('Certificate No', 'Certificate No')}</th>
                                        <th className="px-4 py-3">{_t('الفترة (Period)', 'Period')}</th>
                                        <th className="px-4 py-3">{_t('منتج', 'Project')}</th>
                                        <th className="px-4 py-3 text-right">{_t('Work Done', 'Work Done')}</th>
                                        <th className="px-4 py-3 text-right">{_t('Retention', 'Retention')}</th>
                                        <th className="px-4 py-3 text-right font-bold text-blue-600">{_t('Net Payable', 'Net Payable')}</th>
                                        <th className="px-4 py-3">{_t('الحالة', 'Status')}</th>
                                        <th className="px-4 py-3 text-right">{_t('إجراءات', 'Actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {billings.map((pb, idx) => (
                                        <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                                            <td className="px-4 py-3 font-mono font-bold">{pb.certificateNo}</td>
                                            <td className="px-4 py-3">{pb.period}</td>
                                            <td className="px-4 py-3 font-bold">{pb.project}</td>
                                            <td className="px-4 py-3 text-right">${pb.totalWorkDone.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right text-red-600">${pb.retentionAmount.toLocaleString()} ({pb.retentionPercentage}%)</td>
                                            <td className="px-4 py-3 text-right font-bold text-blue-600">${pb.netPayable.toLocaleString()}</td>
                                            <td className="px-4 py-3">
                                                {pb.status === 'CERTIFIED' ? (
                                                    <Badge className="bg-green-100 text-green-800">{_t('Certified', 'Certified')}</Badge>
                                                ) : (
                                                    <Badge variant="outline">{_t('مسودة', 'Draft')}</Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right space-x-2">
                                                <Button size="sm" variant="outline">{_t('طباعة / Print', 'Print')}</Button>
                                                {pb.status === 'DRAFT' && (
                                                    <Button size="sm" variant="outline" className="text-green-600 border-green-500">{_t('Certify', 'Certify')}</Button>
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
