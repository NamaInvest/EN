"use client";

import React, { useState, useEffect } from 'react';
import { Columns, PlayCircle, CheckCircle2, MoreHorizontal, Leaf, QrCode, ArrowRightLeft, RadioReceiver } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function LeanKanbanPage() {
    const { lang } = useTranslation();
    const { success, info } = useToast();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const res = await fetch('/api/manufacturing/kanban');
        if (res.ok) setData(await res.json());
        setLoading(false);
    };

    const updateStatus = async (orderId: number, newStatus: string) => {
        await fetch('/api/manufacturing/kanban', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actionType: 'update_status', orderId, newStatus })
        });
        fetchData();
    };

    if (loading) return <div className="p-10 text-slate-400">جاري تحميل بيانات Kanban...</div>;

    return (
        <div className="min-h-screen bg-slate-950 p-6 lg:p-10 font-sans text-slate-200">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl gap-4">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="p-4 bg-fuchsia-500/20 rounded-2xl relative overflow-hidden group">
                            <Columns className="w-8 h-8 text-fuchsia-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
                                لوحة التصنيع الرشيق (Kanban & Lean)
                            </h1>
                            <p className="text-slate-400 mt-1">تطبيق JIT، تتبع Genealogy، والاستدامة (Green Manufacturing)</p>
                        </div>
                    </div>
                </div>

                {/* Kanban Board */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* To Do */}
                    <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-4">
                        <h2 className="text-lg font-bold text-slate-300 mb-4 flex items-center justify-between">
                            <span>مسودة (مطلوب للإنتاج - JIT)</span>
                            <span className="bg-slate-800 px-2 py-0.5 rounded-full text-xs">{data?.kanban?.todo?.length || 0}</span>
                        </h2>
                        <div className="space-y-3">
                            {data?.kanban?.todo?.map((order: any) => (
                                <div key={order.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm hover:border-slate-700 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-mono text-fuchsia-400">{order.orderNumber}</span>
                                        <MoreHorizontal className="w-4 h-4 text-slate-600" />
                                    </div>
                                    <h3 className="font-bold text-white text-sm mb-1">{order.recipe?.finishedProduct?.name || 'منتج مخصص'}</h3>
                                    <p className="text-xs text-slate-500 mb-3">الكمية: {order.quantityToProduce}</p>
                                    <button onClick={() => updateStatus(order.id, 'in_progress')} className="w-full py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium transition-colors flex items-center justify-center">
                                        <PlayCircle className="w-4 h-4 ml-1" /> سحب للإنتاج (Pull)
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* In Progress */}
                    <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-4">
                        <h2 className="text-lg font-bold text-blue-400 mb-4 flex items-center justify-between">
                            <span>قيد التشغيل (WIP)</span>
                            <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full text-xs">{data?.kanban?.inProgress?.length || 0}</span>
                        </h2>
                        <div className="space-y-3">
                            {data?.kanban?.inProgress?.map((order: any) => (
                                <div key={order.id} className="bg-slate-900 p-4 rounded-xl border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)] relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50 animate-pulse"></div>
                                    <div className="flex justify-between items-start mb-2 mt-1">
                                        <span className="text-xs font-mono text-blue-400">{order.orderNumber}</span>
                                    </div>
                                    <h3 className="font-bold text-white text-sm mb-1">{order.recipe?.finishedProduct?.name}</h3>
                                    <p className="text-xs text-slate-500 mb-2">الآلة: {order.machine?.name || 'غير محدد'}</p>
                                    <div className="flex justify-between items-center mt-3">
                                        <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400 flex items-center"><QrCode className="w-3 h-3 ml-1"/> تتبع نشط</span>
                                        <button onClick={() => updateStatus(order.id, 'completed')} className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium transition-colors">
                                            إتمام وإرسال
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Done */}
                    <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-4">
                        <h2 className="text-lg font-bold text-emerald-400 mb-4 flex items-center justify-between">
                            <span>مكتمل (بانتظار المستودع)</span>
                            <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-xs">{data?.kanban?.done?.length || 0}</span>
                        </h2>
                        <div className="space-y-3">
                            {data?.kanban?.done?.map((order: any) => (
                                <div key={order.id} className="bg-slate-900 p-4 rounded-xl border border-emerald-500/20 opacity-70">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-mono text-emerald-400 line-through">{order.orderNumber}</span>
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <h3 className="font-bold text-slate-400 text-sm">{order.recipe?.finishedProduct?.name}</h3>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Bottom Analytics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Traceability (Genealogy) */}
                    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center">
                            <ArrowRightLeft className="w-5 h-5 ml-2 text-indigo-400" /> سجل التتبع العكسي (Traceability)
                        </h2>
                        <div className="space-y-3">
                            {data?.traceability?.length === 0 ? <p className="text-slate-500 text-sm">لا توجد سجلات تتبع حالياً.</p> : data?.traceability?.map((log: any) => (
                                <div key={log.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800/50 flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-slate-300 font-mono">أمر: #{log.orderId}</p>
                                        <p className="text-xs text-slate-500 mt-1">تمت الحركة: {new Date(log.recordedAt).toLocaleString()}</p>
                                    </div>
                                    <div className="text-left text-xs">
                                        <span className="block text-indigo-400">شحنة خامات: {log.rawBatchId || 'مختلط'}</span>
                                        <span className="block text-emerald-400">دفعة تام: {log.finishedBatchId || 'N/A'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Green Manufacturing & IoT */}
                    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/10 blur-3xl rounded-full"></div>
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center relative z-10">
                            <Leaf className="w-5 h-5 ml-2 text-emerald-400" /> الاستدامة وبيانات الحساسات (IoT)
                        </h2>
                        
                        <div className="bg-slate-950 rounded-xl p-4 border border-emerald-500/20 mb-6 relative z-10">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-400">البصمة الكربونية المقدرة اليوم</span>
                                <span className="text-emerald-400 font-bold">14.5 kg CO2</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-1.5">
                                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '30%' }}></div>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">توفر الاستدامة 12% من تكاليف الطاقة.</p>
                        </div>

                        <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center relative z-10">
                            <RadioReceiver className="w-4 h-4 ml-1" /> قراءات الحساسات (Live Telemetry)
                        </h3>
                        <div className="space-y-3 relative z-10">
                            {data?.telemetry?.length === 0 ? <p className="text-slate-500 text-sm">لا توجد قراءات للحساسات.</p> : data?.telemetry?.map((t: any) => (
                                <div key={t.id} className="flex justify-between items-center p-3 bg-slate-950 rounded-lg border border-slate-800/50">
                                    <span className="text-xs font-bold text-slate-300">{t.machine?.name}</span>
                                    <div className="flex space-x-4 space-x-reverse text-xs font-mono">
                                        <span className="text-amber-400">{t.temperature}°C</span>
                                        <span className="text-sky-400">{t.piecesProduced} PCS</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
