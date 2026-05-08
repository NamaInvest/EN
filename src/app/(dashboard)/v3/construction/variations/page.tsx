'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ConstructionVariationsPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [variations, setVariations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVariations = async () => {
            try {
                const res = await fetch('/api/v3/construction/variations');
                const data = await res.json();
                if (data.variations) setVariations(data.variations);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchVariations();
    }, []);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">{_t('Construction Variation Orders (VO)', 'Construction Variation Orders (VO)')}</h1>
                <Button>+ Create Variation Order</Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>{_t('Project Variation Orders', 'Project Variation Orders')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? <p>{_t('جاري التحميل...', 'Loading...')}</p> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3">{_t('VO Number', 'VO Number')}</th>
                                        <th className="px-4 py-3">{_t('التاريخ', 'Date')}</th>
                                        <th className="px-4 py-3">{_t('منتج', 'Project')}</th>
                                        <th className="px-4 py-3">{_t('الوصف', 'Description')}</th>
                                        <th className="px-4 py-3 text-right">{_t('Amount (SAR)', 'Amount (SAR)')}</th>
                                        <th className="px-4 py-3">{_t('الحالة', 'Status')}</th>
                                        <th className="px-4 py-3 text-right">{_t('إجراءات', 'Actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {variations.map((vo, idx) => (
                                        <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                                            <td className="px-4 py-3 font-mono font-bold">{vo.id}</td>
                                            <td className="px-4 py-3">{vo.date}</td>
                                            <td className="px-4 py-3 font-bold">{vo.project}</td>
                                            <td className="px-4 py-3 text-gray-600">{vo.description}</td>
                                            <td className="px-4 py-3 text-right font-bold text-blue-600">${vo.amount.toLocaleString()}</td>
                                            <td className="px-4 py-3">
                                                {vo.status === 'APPROVED' ? (
                                                    <Badge className="bg-green-100 text-green-800">{_t('Approved', 'Approved')}</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-800">{_t('Pending', 'Pending')}</Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right space-x-2">
                                                <Button size="sm" variant="outline">{_t('عرض', 'View')}</Button>
                                                {vo.status === 'PENDING_APPROVAL' && (
                                                    <Button size="sm" variant="outline" className="text-green-600 border-green-500">{_t('Approve', 'Approve')}</Button>
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
