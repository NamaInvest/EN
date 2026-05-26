'use client';
import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Play, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * E2ETesterDashboard - End-to-End Enterprise Integration & Workflow Simulator
 * fully localized with bilingual helper _t supporting both Arabic and English interfaces.
 */
export default function E2ETesterDashboard() {
  const { lang, dir } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [loading, setLoading] = useState<string | null>(null);
    const [results, setResults] = useState<Record<string, any>>({});

    const runScenario = async (scenario: string) => {
        setLoading(scenario);
        try {
            const res = await fetch(`/api/admin/e2e-test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scenario })
            });
            const data = await res.json();
            setResults(prev => ({ ...prev, [scenario]: data }));
        } catch (e: any) {
            setResults(prev => ({ ...prev, [scenario]: { error: e.message } }));
        }
        setLoading(null);
    };

    const scenarios = [
        { 
            id: 'Q2C', 
            nameAr: 'من عرض السعر إلى التحصيل (Q2C)', 
            nameEn: 'Quote to Cash (Q2C)', 
            descAr: 'ينشئ عميلاً ← عرض سعر ← أمر بيع ← فاتورة ← دفعة مالية.',
            descEn: 'Creates Customer → Quote → Sales Order → Invoice → Payment.' 
        },
        { 
            id: 'P2P', 
            nameAr: 'من الشراء إلى الدفع (P2P)', 
            nameEn: 'Procure to Pay (P2P)', 
            descAr: 'ينشئ مورداً ← طلب شراء ← أمر شراء ← سند استلام ← فاتورة ← دفعة مالية.',
            descEn: 'Creates Supplier → PR → PO → GRN → Bill → Payment.' 
        },
        { 
            id: 'H2R', 
            nameAr: 'من التوظيف إلى التقاعد (H2R)', 
            nameEn: 'Hire to Retire (H2R)', 
            descAr: 'ينشئ موظفاً ← تشغيل مسير الرواتب ← قيود اليومية الآلية.',
            descEn: 'Creates Employee → Payroll Run → JEs.' 
        },
        { 
            id: 'R2R', 
            nameAr: 'من التسجيل إلى التقرير (R2R)', 
            nameEn: 'Record to Report (R2R)', 
            descAr: 'يحاكي إقفال نهاية الشهر وإعادة تقييم فروق العملة للقيود.',
            descEn: 'Simulates month-end close and FX revaluation JEs.' 
        },
        { 
            id: 'O2D', 
            nameAr: 'من الطلب إلى التوصيل (O2D)', 
            nameEn: 'Order to Delivery (O2D)', 
            descAr: 'أمر البيع ← التقاط WMS المستودعي ← توزيع الأسطول ← إثبات التوصيل.',
            descEn: 'Sales Order → WMS Picking → Fleet Dispatch → PoD.' 
        },
        { 
            id: 'P2P_MFG', 
            nameAr: 'من التخطيط إلى الإنتاج', 
            nameEn: 'Plan to Produce', 
            descAr: 'توقع الطلب ← تخطيط الإنتاج MRP ← أمر العمل ← منتج جاهز.',
            descEn: 'Demand Forecast → MRP → Work Order → FG.' 
        },
        { 
            id: 'A2R', 
            nameAr: 'من الحيازة إلى الاستبعاد (A2R)', 
            nameEn: 'Acquire to Retire (A2R)', 
            descAr: 'النفقات الرأسمالية ← إنشاء الأصول ← الإهلاك ← استبعاد الأصول.',
            descEn: 'CapEx → Asset Creation → Depreciation → Disposal.' 
        },
        { 
            id: 'I2R', 
            nameAr: 'من تقديم التذكرة إلى الحل (I2R)', 
            nameEn: 'Issue to Resolve (I2R)', 
            descAr: 'تذكرة الدعم ← الخدمة الميدانية ← مقاييس اتفاقية الخدمة (SLA).',
            descEn: 'Ticket → Field Service → SLA Metrics.' 
        }
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-6 p-6" dir={dir}>
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Play className="text-blue-600 w-8 h-8" />
                    {_t('أداة اختبار التكامل الشامل V2', 'V2 End-to-End Integrations Tester')}
                </h1>
                <p className="text-gray-500 mt-2">
                    {_t('محاكاة تدفقات الأعمال المعقدة تلقائيًا للتحقق من معاملات Saga وحافلة الأحداث وإدخالات دفتر اليومية عبر الوحدات.', 'Automatically simulate complex business flows to verify Saga Transactions, Event Bus, and Cross-Module Journal Entries.')}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {scenarios.map(s => (
                    <Card key={s.id} className="p-6 space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold">{_t(s.nameAr, s.nameEn)}</h3>
                                <p className="text-sm text-gray-500">{_t(s.descAr, s.descEn)}</p>
                            </div>
                            <Button 
                                onClick={() => runScenario(s.id)} 
                                disabled={loading !== null}
                                className="flex gap-2"
                            >
                                {loading === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                {_t('تشغيل', 'Run')}
                            </Button>
                        </div>

                        {results[s.id] && (
                            <div className={`p-4 rounded border text-sm ${results[s.id].error ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
                                <div className="font-semibold mb-2 flex items-center gap-2">
                                    {results[s.id].error ? <XCircle className="w-4 h-4"/> : <CheckCircle className="w-4 h-4"/>}
                                    {results[s.id].error ? _t('فشلت المحاكاة', 'Simulation Failed') : _t('نجحت المحاكاة', 'Simulation Success')}
                                </div>
                                <pre className="whitespace-pre-wrap overflow-x-auto">
                                    {JSON.stringify(results[s.id], null, 2)}
                                </pre>
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
}

