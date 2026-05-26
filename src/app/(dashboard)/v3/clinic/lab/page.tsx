'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type LabTest = {
    id: string | number;
    date: string;
    patient: string;
    testName: string;
    doctor: string;
    status: string;
    result?: string;
};

/**
 * ClinicLabPage - Healthcare & Clinic Lab Orders and Diagnostics Panel
 * fully localized with bilingual helper _t supporting both Arabic and English interfaces.
 */
export default function ClinicLabPage() {
  const { lang, dir } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [tests, setTests] = useState<LabTest[]>([]);
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
        <div className="p-6 space-y-6" dir={dir}>
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">
                    {_t('طلبات وفحوصات المختبر', 'Lab Orders & Diagnostic Tests')}
                </h1>
                <Button>{_t('طلب فحص جديد', '+ Create Lab Request')}</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{_t('طلبات المختبر الحديثة', 'Recent Lab Requests')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? <p>{_t('جاري التحميل...', 'Loading...')}</p> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-right">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3">{_t('رقم الطلب', 'Order ID')}</th>
                                        <th className="px-4 py-3">{_t('التاريخ', 'Date')}</th>
                                        <th className="px-4 py-3">{_t('المريض', 'Patient')}</th>
                                        <th className="px-4 py-3">{_t('اسم الفحص', 'Test Name')}</th>
                                        <th className="px-4 py-3">{_t('الطبيب الطالب', 'Ordering Doctor')}</th>
                                        <th className="px-4 py-3">{_t('الحالة', 'Status')}</th>
                                        <th className="px-4 py-3">{_t('ملخص النتيجة', 'Result Summary')}</th>
                                        <th className="px-4 py-3 text-left">{_t('الإجراءات', 'Actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tests.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                                {_t('لا توجد طلبات حالياً', 'No lab orders registered currently')}
                                            </td>
                                        </tr>
                                    )}
                                    {tests.map((t, idx) => (
                                        <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                                            <td className="px-4 py-3 font-mono font-bold">{t.id}</td>
                                            <td className="px-4 py-3">{t.date}</td>
                                            <td className="px-4 py-3 font-bold">{t.patient}</td>
                                            <td className="px-4 py-3 font-medium text-gray-800">{t.testName}</td>
                                            <td className="px-4 py-3 text-blue-600">{t.doctor}</td>
                                            <td className="px-4 py-3">
                                                {t.status === 'COMPLETED' ? (
                                                    <Badge className="bg-green-100 text-green-800">{_t('مكتمل', 'Completed')}</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
                                                        {_t('بانتظار العينة', 'Awaiting Sample')}
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-green-600">{t.result || '—'}</td>
                                            <td className="px-4 py-3 text-left space-x-2">
                                                {t.status === 'COMPLETED' ? (
                                                    <Button size="sm" variant="outline">{_t('عرض النتيجة PDF', 'View PDF Result')}</Button>
                                                ) : (
                                                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-500">
                                                        {_t('جمع العينة', 'Collect Sample')}
                                                    </Button>
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

