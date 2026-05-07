'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function LiquidityForecastPage() {
  const { t } = useTranslation();

    const [data, setData] = useState<any>({ forecasts: [], scenario: null });
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchForecasts();
    }, []);

    async function fetchForecasts() {
        setLoading(true);
        const res = await fetch('/api/treasury/liquidity/forecast');
        if (res.ok) {
            const json = await res.json();
            setData(json);
        }
        setLoading(false);
    }

    async function generateForecast() {
        setGenerating(true);
        const res = await fetch('/api/treasury/liquidity/forecast/generate', { method: 'POST' });
        if (res.ok) {
            fetchForecasts();
        }
        setGenerating(false);
    }

    // Transform flat forecast data into a grid: Categories vs Weeks
    const weeks = Array.from({ length: 13 }, (_, i) => i + 1);
    const categories = ['AR_INFLOW', 'AP_OUTFLOW', 'PAYROLL'];
    const grid: any = {};

    categories.forEach(c => {
        grid[c] = Array(13).fill(0);
    });

    data.forecasts.forEach((f: any) => {
        if (grid[f.category]) {
            grid[f.category][f.weekNumber - 1] = Number(f.expectedAmount);
        }
    });

    const getNet = (weekIndex: number) => {
        const ar = grid['AR_INFLOW'][weekIndex] || 0;
        const ap = grid['AP_OUTFLOW'][weekIndex] || 0;
        const payroll = grid['PAYROLL'][weekIndex] || 0;
        return ar - ap - payroll;
    };

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">{t('treasury.liquidity_title')}</h1>
                    <p className="text-sm text-gray-500">
                        السيناريو الحالي: {data.scenario ? data.scenario.name : 'لا يوجد'}
                    </p>
                </div>
                <div className="space-x-2 space-x-reverse">
                    <Button variant="outline">إدارة السيناريوهات</Button>
                    <Button onClick={generateForecast} disabled={generating}>
                        {generating ? 'جاري السحب من AR/AP...' : 'توليد التوقعات (Generate)'}
                    </Button>
                </div>
            </div>

            {loading ? <p>جاري التحميل...</p> : data.forecasts.length > 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>الجدول الأسبوعي للسيولة المستقبلية (SAR)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-right border-collapse">
                                <thead className="bg-gray-50 text-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 border">التصنيف</th>
                                        {weeks.map(w => (
                                            <th key={w} className="px-2 py-3 border text-center">أسبوع {w}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.map(c => (
                                        <tr key={c} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 border font-medium text-gray-600">{c}</td>
                                            {weeks.map((_, idx) => (
                                                <td key={idx} className={`px-2 py-3 border text-center font-mono text-xs ${c.includes('INFLOW') ? 'text-green-600' : 'text-red-600'}`} dir="ltr">
                                                    {grid[c][idx].toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                                        <td className="px-4 py-3 border">صافي السيولة الأسبوعي (Net)</td>
                                        {weeks.map((_, idx) => {
                                            const net = getNet(idx);
                                            return (
                                                <td key={idx} className={`px-2 py-3 border text-center font-mono ${net < 0 ? 'text-red-600' : 'text-green-600'}`} dir="ltr">
                                                    {net.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="text-center p-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 mb-4">لا توجد توقعات محسوبة مسبقاً.</p>
                    <Button onClick={generateForecast}>توليد التوقعات الآن</Button>
                </div>
            )}
        </div>
    );
}
