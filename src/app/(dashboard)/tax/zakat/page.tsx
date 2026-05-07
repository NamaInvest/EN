'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

type Assessment = {
    id: number;
    fiscalYearId: number;
    status: string;
    hijriYear: string | null;
    zakatableBase: string;
    zakatRate: string;
    zakatDue: string;
    saudiOwnershipPct: string;
    createdAt: string;
};

type FiscalYear = { id: number; yearNumber: number; status: string };

export default function ZakatPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
    const [selectedFy, setSelectedFy] = useState<number | null>(null);
    const [ownership, setOwnership] = useState<string>('1.0');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

    const fetchData = useCallback(async () => {
        // Fetch assessments (always)
        try {
            const aRes = await fetch('/api/zakat/assessments');
            if (aRes.ok) setAssessments(await aRes.json());
        } catch { /* ignore */ }

        // Fetch fiscal years (optional — graceful fallback if 404 or any error)
        try {
            const fRes = await fetch('/api/accounting/fiscal-years');
            if (fRes.ok) {
                const fys = await fRes.json();
                setFiscalYears(Array.isArray(fys) ? fys : (fys.fiscalYears || []));
            }
        } catch { /* endpoint may not exist on older deployments — keep dropdown empty */ }
    }, []);

    useEffect(() => {
        let mounted = true;
        if (mounted) fetchData();
        return () => { mounted = false; };
    }, [fetchData]);

    const handleCreate = async () => {
        if (!selectedFy) {
            setMessage({ type: 'error', text: 'اختر السنة المالية أولاً' });
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/zakat/assessments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fiscalYearId: selectedFy, saudiOwnershipPct: parseFloat(ownership) }),
            });
            if (res.ok) {
                setMessage({ type: 'success', text: 'تم إنشاء تقدير الزكاة بنجاح' });
                fetchData();
            } else {
                const err = await res.json();
                setMessage({ type: 'error', text: err.error || 'فشل الإنشاء' });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFinalize = async (id: number) => {
        if (!confirm('هل أنت متأكد من اعتماد التقدير؟ سيتم ترحيل قيد محاسبي.')) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/zakat/assessments/${id}/finalize`, { method: 'POST' });
            if (res.ok) {
                setMessage({ type: 'success', text: 'تم الاعتماد وترحيل القيد' });
                fetchData();
            } else {
                const err = await res.json();
                setMessage({ type: 'error', text: err.error || 'فشل الاعتماد' });
            }
        } finally {
            setLoading(false);
        }
    };

    const fmt = (v: string | number) => Number(v).toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6" dir="rtl">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Calculator className="w-8 h-8 text-teal-600" />
                    إقرارات الزكاة
                </h1>
                <p className="text-gray-500 mt-1">حساب وتقديم إقرار الزكاة 2.5% وفق متطلبات ZATCA</p>
            </div>

            {message && (
                <div className={`p-4 rounded-lg flex items-start gap-2 ${
                    message.type === 'success' ? 'bg-green-50 text-green-800' :
                    message.type === 'error' ? 'bg-red-50 text-red-800' :
                    'bg-blue-50 text-blue-800'
                }`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 mt-0.5" /> : <AlertCircle className="w-5 h-5 mt-0.5" />}
                    <span>{message.text}</span>
                </div>
            )}

            <Card>
                <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4">إنشاء تقدير جديد</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">السنة المالية</label>
                            <select
                                value={selectedFy ?? ''}
                                onChange={e => setSelectedFy(parseInt(e.target.value) || null)}
                                className="w-full border rounded px-3 py-2"
                            >
                                <option value="">— اختر —</option>
                                {fiscalYears.map(fy => (
                                    <option key={fy.id} value={fy.id}>{fy.yearNumber} ({fy.status})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">نسبة الملكية السعودية</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="1"
                                value={ownership}
                                onChange={e => setOwnership(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                placeholder="1.0 = 100% سعودي"
                            />
                            <p className="text-xs text-gray-500 mt-1">للشركات المختلطة: نسبة الملكية السعودية فقط</p>
                        </div>
                        <div className="flex items-end">
                            <Button
                                onClick={handleCreate}
                                disabled={loading || !selectedFy}
                                className="bg-teal-600 hover:bg-teal-700 text-white w-full"
                            >
                                <Calculator className="w-4 h-4 ml-2" />
                                احسب التقدير
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-right px-4 py-3">#</th>
                                    <th className="text-right px-4 py-3">السنة المالية</th>
                                    <th className="text-right px-4 py-3">السنة الهجرية</th>
                                    <th className="text-right px-4 py-3">الوعاء (ر.س)</th>
                                    <th className="text-right px-4 py-3">المعدّل</th>
                                    <th className="text-right px-4 py-3">الزكاة المستحقة (ر.س)</th>
                                    <th className="text-right px-4 py-3">الحالة</th>
                                    <th className="text-right px-4 py-3">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assessments.length === 0 && (
                                    <tr><td colSpan={8} className="text-center py-8 text-gray-500">لا توجد تقديرات بعد</td></tr>
                                )}
                                {assessments.map(a => (
                                    <tr key={a.id} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 font-mono">{a.id}</td>
                                        <td className="px-4 py-3">{a.fiscalYearId}</td>
                                        <td className="px-4 py-3">{a.hijriYear ?? '—'}</td>
                                        <td className="px-4 py-3 font-mono">{fmt(a.zakatableBase)}</td>
                                        <td className="px-4 py-3">{(Number(a.zakatRate) * 100).toFixed(2)}%</td>
                                        <td className="px-4 py-3 font-mono font-bold text-teal-700">{fmt(a.zakatDue)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-block px-2 py-1 rounded text-xs ${
                                                a.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' :
                                                a.status === 'FINALIZED' ? 'bg-blue-100 text-blue-700' :
                                                a.status === 'FILED' ? 'bg-green-100 text-green-700' :
                                                'bg-gray-100'
                                            }`}>
                                                {a.status === 'DRAFT' ? 'مسودة' :
                                                 a.status === 'FINALIZED' ? 'معتمد' :
                                                 a.status === 'FILED' ? 'مُقدَّم' : a.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {a.status === 'DRAFT' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleFinalize(a.id)}
                                                    disabled={loading}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                                >
                                                    <FileText className="w-3 h-3 ml-1" />
                                                    اعتماد
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4 text-sm text-gray-600">
                    <p className="mb-1">📌 <strong>ملاحظات:</strong></p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>وعاء الزكاة = (حقوق الملكية + الالتزامات طويلة الأجل + صافي الربح) − (الأصول الثابتة بصافي قيمتها + الاستثمارات طويلة الأجل) ± التسويات</li>
                        <li>التصنيف يتم عبر حقل <code>zakatCategory</code> في الحسابات</li>
                        <li>الزكاة 2.5% للملكية السعودية فقط — ضع نسبة الملكية بدقة للشركات المختلطة</li>
                        <li>عند الاعتماد: يُرحّل قيد <strong>مدين: مصروف الزكاة / دائن: الزكاة المستحقة</strong></li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
