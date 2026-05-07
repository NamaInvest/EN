'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function LLMCostsPage() {
  const { t } = useTranslation();

    const [data, setData] = useState<any>({ logs: [], stats: null });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        const res = await fetch('/api/admin/llm-costs');
        if (res.ok) {
            setData(await res.json());
        }
        setLoading(false);
    }

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">{t('ai.llm_costs_title')}</h1>
            </div>

            {loading ? <p>جاري التحميل...</p> : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-gray-500">إجمالي الطلبات</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">{data.stats?.totalRequests}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-gray-500">إجمالي التوكنز (Tokens)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-blue-600">{data.stats?.totalTokens.toLocaleString()}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-gray-500">متوسط الاستجابة (ms)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-amber-600">{data.stats?.avgLatency} ms</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-gray-500">نسبة النجاح</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-green-600">{data.stats?.successRate}%</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>سجل العمليات (آخر 100 طلب)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-gray-50 text-gray-700">
                                        <tr>
                                            <th className="px-4 py-3 rounded-tr-lg">الوقت</th>
                                            <th className="px-4 py-3">المعرف (Prompt Key)</th>
                                            <th className="px-4 py-3">النموذج</th>
                                            <th className="px-4 py-3">Tokens (P/C)</th>
                                            <th className="px-4 py-3">الاستجابة</th>
                                            <th className="px-4 py-3 rounded-tl-lg">الحالة</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.logs.map((log: any) => (
                                            <tr key={log.id} className="border-b hover:bg-gray-50">
                                                <td className="px-4 py-3 text-gray-500" dir="ltr">
                                                    {new Date(log.createdAt).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-blue-600">
                                                    {log.promptKey} (v{log.promptVersion})
                                                </td>
                                                <td className="px-4 py-3">{log.model}</td>
                                                <td className="px-4 py-3 font-mono text-xs text-gray-600" dir="ltr">
                                                    {log.promptTokens} / {log.completionTokens}
                                                </td>
                                                <td className="px-4 py-3">{log.latencyMs} ms</td>
                                                <td className="px-4 py-3">
                                                    {log.success ? (
                                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">نجاح</span>
                                                    ) : (
                                                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs" title={log.errorCode}>فشل</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {data.logs.length === 0 && <p className="text-gray-500 py-4 text-center">لا يوجد سجلات حتى الآن.</p>}
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
