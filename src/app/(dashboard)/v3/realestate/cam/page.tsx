'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function CAMReconciliationPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [properties] = useState([
        { id: 'PROP-01', name: 'Riyadh Business Park', totalArea: 10000, totalCAMExpenses: 500000, period: '2025', status: 'PENDING_RECONCILIATION' },
        { id: 'PROP-02', name: 'Jeddah Commercial Center', totalArea: 15000, totalCAMExpenses: 750000, period: '2025', status: 'RECONCILED' },
    ]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">{_t('المصالحة كام', 'CAM Reconciliation')}</h1>
                <Button>{_t('قم بتشغيل CAM Recon السنوي', 'Run Annual CAM Recon')}</Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>{_t('صيانة المنطقة المشتركة (CAM) حسب العقار', 'Common Area Maintenance (CAM) by Property')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-4 py-3">{_t('معرف العقار', 'Property ID')}</th>
                                    <th className="px-4 py-3">{_t('الاسم', 'Name')}</th>
                                    <th className="px-4 py-3">{_t('المساحة الإجمالية (متر مربع)', 'Total Area (sqm)')}</th>
                                    <th className="px-4 py-3">{_t('الفترة (Period)', 'Period')}</th>
                                    <th className="px-4 py-3 text-right">{_t('إجمالي مصاريف CAM (ريال سعودي)', 'Total CAM Expenses (SAR)')}</th>
                                    <th className="px-4 py-3">{_t('الحالة', 'Status')}</th>
                                    <th className="px-4 py-3 text-right">{_t('إجراءات', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {properties.map((prop, idx) => (
                                    <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                                        <td className="px-4 py-3 font-mono font-bold">{prop.id}</td>
                                        <td className="px-4 py-3">{prop.name}</td>
                                        <td className="px-4 py-3">{prop.totalArea.toLocaleString()}</td>
                                        <td className="px-4 py-3">{prop.period}</td>
                                        <td className="px-4 py-3 text-right font-bold text-red-600">${prop.totalCAMExpenses.toLocaleString()}</td>
                                        <td className="px-4 py-3">
                                            {prop.status === 'RECONCILED' ? (
                                                <Badge className="bg-green-100 text-green-800">{_t('التوفيق', 'Reconciled')}</Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-yellow-50 text-yellow-800">{_t('قيد الانتظار', 'Pending')}</Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                            <Button size="sm" variant="outline">{_t('عرض الانهيار', 'View Breakdown')}</Button>
                                            {prop.status === 'PENDING_RECONCILIATION' && (
                                                <Button size="sm" variant="outline" className="text-blue-600 border-blue-500">{_t('تصالح', 'Reconcile')}</Button>
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
