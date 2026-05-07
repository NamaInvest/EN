'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CashPositionPage() {
  const { t } = useTranslation();

    const [snapshot, setSnapshot] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchSnapshot();
    }, []);

    async function fetchSnapshot() {
        setLoading(true);
        const res = await fetch('/api/treasury/cash-position');
        if (res.ok) {
            const data = await res.json();
            if (!data.error) setSnapshot(data);
        }
        setLoading(false);
    }

    async function takeSnapshot() {
        setGenerating(true);
        const res = await fetch('/api/treasury/cash-position/snapshot', { method: 'POST' });
        if (res.ok) {
            fetchSnapshot();
        }
        setGenerating(false);
    }

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">{t('treasury.cash_title')}</h1>
                    <p className="text-sm text-gray-500">
                        آخر تحديث: {snapshot ? new Date(snapshot.capturedAt).toLocaleString() : 'لا يوجد'}
                    </p>
                </div>
                <Button onClick={takeSnapshot} disabled={generating}>
                    {generating ? 'جاري السحب...' : 'تحديث المركز (Snapshot)'}
                </Button>
            </div>

            {loading ? <p>جاري التحميل...</p> : snapshot ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-gray-500">إجمالي السيولة (المعادل بالريال)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-bold text-green-600">
                                    {Number(snapshot.totalCashSAR).toLocaleString()} ر.س
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-gray-500">عدد الحسابات البنكية النشطة</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-bold">{snapshot.bankCount}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>تفاصيل الأرصدة البنكية</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-gray-50 text-gray-700">
                                        <tr>
                                            <th className="px-4 py-3 rounded-tr-lg">البنك</th>
                                            <th className="px-4 py-3">رقم الحساب</th>
                                            <th className="px-4 py-3">الرصيد الفعلي</th>
                                            <th className="px-4 py-3">العملة</th>
                                            <th className="px-4 py-3 rounded-tl-lg">المعادل (ر.س)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {snapshot.data?.map((b: any, idx: number) => (
                                            <tr key={idx} className="border-b hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium">{b.bankName}</td>
                                                <td className="px-4 py-3 text-gray-600" dir="ltr">{b.accountNumber}</td>
                                                <td className="px-4 py-3 font-bold" dir="ltr">{Number(b.balance).toLocaleString()}</td>
                                                <td className="px-4 py-3">{b.currency}</td>
                                                <td className="px-4 py-3 text-green-600 font-bold" dir="ltr">
                                                    {Number(b.sarEquivalent).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            ) : (
                <div className="text-center p-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 mb-4">لا توجد سجلات لمركز النقد.</p>
                    <Button onClick={takeSnapshot}>خذ أول لقطة الآن</Button>
                </div>
            )}
        </div>
    );
}
