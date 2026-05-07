'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ShopFloorTerminalPage() {
  const { t } = useTranslation();

    const [sessions, setSessions] = useState<any[]>([]);
    const [andons, setAndons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showStartForm, setShowStartForm] = useState(false);
    const [startForm, setStartForm] = useState({ workCenterId: '', manufacturingOrderId: '', operationId: '' });
    const [completeForm, setCompleteForm] = useState({ sessionId: '', goodQty: 0, scrapQty: 0, scrapReason: '' });
    const [showComplete, setShowComplete] = useState<string | null>(null);

    useEffect(() => { fetchData(); }, []);

    async function fetchData() {
        setLoading(true);
        const [sessRes, andonRes] = await Promise.all([
            fetch('/api/manufacturing/shopfloor?action=active'),
            fetch('/api/manufacturing/shopfloor?action=andon')
        ]);
        if (sessRes.ok) setSessions(await sessRes.json());
        if (andonRes.ok) setAndons(await andonRes.json());
        setLoading(false);
    }

    async function doAction(action: string, data: any) {
        await fetch('/api/manufacturing/shopfloor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...data })
        });
        fetchData();
    }

    async function handleStart(e: any) {
        e.preventDefault();
        await doAction('start', startForm);
        setShowStartForm(false);
        setStartForm({ workCenterId: '', manufacturingOrderId: '', operationId: '' });
    }

    async function handleComplete(e: any) {
        e.preventDefault();
        await doAction('complete', completeForm);
        setShowComplete(null);
    }

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">{t('mfg.shopfloor_title')}</h1>
                    <p className="text-sm text-gray-500">واجهة المشغل لإدارة العمليات الإنتاجية في الوقت الحقيقي</p>
                </div>
                <Button onClick={() => setShowStartForm(!showStartForm)} className="text-lg px-6 py-3">
                    ▶ بدء عملية جديدة
                </Button>
            </div>

            {/* Start New Operation Form */}
            {showStartForm && (
                <Card className="border-2 border-green-200 bg-green-50/30">
                    <CardHeader><CardTitle>بدء عملية تصنيع</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleStart} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm mb-1">محطة العمل (Work Center)</label>
                                <Input value={startForm.workCenterId} onChange={e => setStartForm({...startForm, workCenterId: e.target.value})} placeholder="WC-CNC-01" required />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">أمر التصنيع (MO)</label>
                                <Input value={startForm.manufacturingOrderId} onChange={e => setStartForm({...startForm, manufacturingOrderId: e.target.value})} placeholder="MO-2026-0055" required />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">العملية (Operation)</label>
                                <Input value={startForm.operationId} onChange={e => setStartForm({...startForm, operationId: e.target.value})} placeholder="OP-101" required />
                            </div>
                            <div className="md:col-span-3">
                                <Button type="submit" className="w-full text-lg py-3 bg-green-600 hover:bg-green-700">▶ بدء التشغيل</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Active Sessions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h2 className="text-lg font-bold mb-4">العمليات الجارية ({sessions.length})</h2>
                    {loading ? <p>جاري التحميل...</p> : sessions.length === 0 ? (
                        <Card className="p-8 text-center text-gray-500">لا توجد عمليات جارية حالياً</Card>
                    ) : sessions.map(s => (
                        <Card key={s.id} className={`mb-4 border-2 ${s.status === 'ACTIVE' ? 'border-green-300 bg-green-50/20' : 'border-yellow-300 bg-yellow-50/20'}`}>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${s.status === 'ACTIVE' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}`}>
                                            {s.status === 'ACTIVE' ? '🟢 قيد التشغيل' : '⏸ متوقف مؤقتاً'}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-500" dir="ltr">{new Date(s.startedAt).toLocaleTimeString()}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-sm mb-4">
                                    <div><span className="text-gray-500">المحطة:</span> <span className="font-bold">{s.workCenterId}</span></div>
                                    <div><span className="text-gray-500">الأمر:</span> <span className="font-bold">{s.manufacturingOrderId}</span></div>
                                    <div><span className="text-gray-500">العملية:</span> <span className="font-bold">{s.operationId}</span></div>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    {s.status === 'ACTIVE' ? (
                                        <Button size="sm" variant="outline" className="border-yellow-300" onClick={() => doAction('pause', { sessionId: s.id })}>⏸ إيقاف مؤقت</Button>
                                    ) : (
                                        <Button size="sm" className="bg-green-600" onClick={() => doAction('resume', { sessionId: s.id })}>▶ استئناف</Button>
                                    )}
                                    <Button size="sm" className="bg-blue-600" onClick={() => { setShowComplete(s.id); setCompleteForm({ sessionId: s.id, goodQty: 0, scrapQty: 0, scrapReason: '' }); }}>
                                        ✅ إنهاء العملية
                                    </Button>
                                    <Button size="sm" variant="outline" className="border-red-300 text-red-600" onClick={() => doAction('andon', { workCenterId: s.workCenterId, callType: 'MAINTENANCE' })}>
                                        🚨 Andon - صيانة
                                    </Button>
                                    <Button size="sm" variant="outline" className="border-orange-300 text-orange-600" onClick={() => doAction('andon', { workCenterId: s.workCenterId, callType: 'QUALITY' })}>
                                        🔍 Andon - جودة
                                    </Button>
                                </div>

                                {showComplete === s.id && (
                                    <form onSubmit={handleComplete} className="mt-4 p-3 bg-white rounded-lg border space-y-3">
                                        <h4 className="font-bold text-sm">تسجيل الإنتاج</h4>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="text-xs">الكمية الجيدة</label>
                                                <Input type="number" value={completeForm.goodQty} onChange={e => setCompleteForm({...completeForm, goodQty: Number(e.target.value)})} required />
                                            </div>
                                            <div>
                                                <label className="text-xs">التالف (Scrap)</label>
                                                <Input type="number" value={completeForm.scrapQty} onChange={e => setCompleteForm({...completeForm, scrapQty: Number(e.target.value)})} />
                                            </div>
                                            <div>
                                                <label className="text-xs">سبب التلف</label>
                                                <Input value={completeForm.scrapReason} onChange={e => setCompleteForm({...completeForm, scrapReason: e.target.value})} placeholder="عيب مادة خام" />
                                            </div>
                                        </div>
                                        <Button type="submit" className="w-full">✅ تأكيد الإنهاء</Button>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Andon Calls */}
                <div>
                    <h2 className="text-lg font-bold mb-4">🚨 إنذارات Andon النشطة ({andons.length})</h2>
                    {andons.length === 0 ? (
                        <Card className="p-8 text-center text-gray-500 bg-green-50">✅ لا توجد إنذارات مفتوحة</Card>
                    ) : andons.map(a => (
                        <Card key={a.id} className="mb-4 border-2 border-red-300 bg-red-50/30">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="px-2 py-1 rounded text-xs font-bold bg-red-500 text-white">
                                        {a.callType === 'MAINTENANCE' ? '🔧 صيانة' :
                                         a.callType === 'QUALITY' ? '🔍 جودة' :
                                         a.callType === 'MATERIAL' ? '📦 مواد' : '👤 مشرف'}
                                    </span>
                                    <span className="text-xs text-gray-500">محطة: {a.workCenterId}</span>
                                </div>
                                <p className="text-sm text-gray-600 mb-3" dir="ltr">Called at: {new Date(a.calledAt).toLocaleTimeString()}</p>
                                <Button size="sm" className="w-full bg-green-600" onClick={() => doAction('andon-resolve', { callId: a.id, note: 'تم الحل' })}>
                                    ✅ حل الإنذار
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
