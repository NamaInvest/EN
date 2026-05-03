"use client";

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Activity, CheckCircle2, AlertTriangle, FileWarning, Search, Wrench, ShieldCheck } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function CAPAPage() {
    const { success, error: toastError } = useToast();
    const [ncrs, setNcrs] = useState<any[]>([]);
    const [inspections, setInspections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isNcrModalOpen, setIsNcrModalOpen] = useState(false);
    const [isCapaModalOpen, setIsCapaModalOpen] = useState(false);
    const [selectedNcr, setSelectedNcr] = useState<any>(null);

    // Forms
    const [ncrForm, setNcrForm] = useState({
        inspectionId: '', severity: 'MEDIUM', description: '', dispositionType: 'SCRAP', costImpact: 0
    });

    const [capaForm, setCapaForm] = useState({
        rootCause: '', correctiveAction: '', owner: '', dueDate: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [capaRes, inspRes] = await Promise.all([
                fetch('/api/manufacturing/capa'),
                fetch('/api/manufacturing/quality-control') // or wherever inspections are listed
            ]);
            
            if (capaRes.ok) setNcrs(await capaRes.json());
            if (inspRes.ok) setInspections(await inspRes.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const submitNcr = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/manufacturing/capa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...ncrForm, actionType: 'CREATE_NCR' })
            });
            if (res.ok) {
                success('تم إنشاء تقرير عدم المطابقة بنجاح');
                setIsNcrModalOpen(false);
                fetchData();
            } else {
                toastError('فشل إنشاء التقرير');
            }
        } catch (e) {
            toastError('خطأ في الشبكة');
        }
    };

    const submitCapa = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/manufacturing/capa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...capaForm, ncrId: selectedNcr.id, actionType: 'CREATE_CAPA' })
            });
            if (res.ok) {
                success('تم تسجيل الإجراء التصحيحي بنجاح');
                setIsCapaModalOpen(false);
                fetchData();
            } else {
                toastError('فشل تسجيل الإجراء');
            }
        } catch (e) {
            toastError('خطأ في الشبكة');
        }
    };

    const updateCapaStatus = async (capaId: number, status: string) => {
        const review = prompt('أدخل مراجعة فعالية الإجراء التصحيحي (اختياري):');
        try {
            const res = await fetch('/api/manufacturing/capa', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ capaId, status, effectivenessReview: review })
            });
            if (res.ok) {
                success('تم التحديث بنجاح');
                fetchData();
            }
        } catch (e) {
            toastError('خطأ في الشبكة');
        }
    };

    const getSeverityBadge = (sev: string) => {
        switch(sev) {
            case 'CRITICAL': return <span className="bg-red-500/10 text-red-500 px-2 py-1 rounded text-xs font-bold">حرج (Critical)</span>;
            case 'HIGH': return <span className="bg-orange-500/10 text-orange-500 px-2 py-1 rounded text-xs font-bold">مرتفع</span>;
            case 'MEDIUM': return <span className="bg-yellow-500/10 text-yellow-600 px-2 py-1 rounded text-xs font-bold">متوسط</span>;
            default: return <span className="bg-blue-500/10 text-blue-500 px-2 py-1 rounded text-xs font-bold">منخفض</span>;
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 p-6 lg:p-10 font-sans text-slate-200">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex items-center justify-between bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="p-4 bg-rose-500/20 rounded-2xl">
                            <ShieldAlert className="w-8 h-8 text-rose-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">نظام الـ NCR & CAPA</h1>
                            <p className="text-slate-400 mt-1">تقارير عدم المطابقة والإجراءات التصحيحية والوقائية</p>
                        </div>
                    </div>
                    <button onClick={() => setIsNcrModalOpen(true)} className="flex items-center px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-rose-600/20">
                        <FileWarning className="w-5 h-5 ml-2" /> تقرير عدم مطابقة (NCR)
                    </button>
                </div>

                {/* NCR Modal */}
                {isNcrModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-700 overflow-hidden">
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                                <h3 className="text-xl font-bold text-white flex items-center">
                                    <FileWarning className="w-6 h-6 ml-2 text-rose-400" /> إصدار NCR
                                </h3>
                            </div>
                            <form onSubmit={submitNcr} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">رقم الفحص (Inspection ID)</label>
                                    <input type="number" required value={ncrForm.inspectionId} onChange={e => setNcrForm({...ncrForm, inspectionId: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500" />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">وصف الانحراف والمشكلة</label>
                                    <textarea required rows={3} value={ncrForm.description} onChange={e => setNcrForm({...ncrForm, description: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"></textarea>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">الخطورة</label>
                                        <select value={ncrForm.severity} onChange={e => setNcrForm({...ncrForm, severity: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-rose-500">
                                            <option value="CRITICAL">حرج (Critical)</option>
                                            <option value="HIGH">عالي (High)</option>
                                            <option value="MEDIUM">متوسط (Medium)</option>
                                            <option value="LOW">منخفض (Low)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">الإجراء المتخذ (Disposition)</label>
                                        <select value={ncrForm.dispositionType} onChange={e => setNcrForm({...ncrForm, dispositionType: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-rose-500">
                                            <option value="SCRAP">إتلاف (Scrap)</option>
                                            <option value="REWORK">إعادة عمل (Rework)</option>
                                            <option value="RETURN_VENDOR">إرجاع للمورد</option>
                                            <option value="USE_AS_IS">استخدام بحالته</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">الأثر المالي المتوقع (Cost Impact)</label>
                                    <input type="number" value={ncrForm.costImpact} onChange={e => setNcrForm({...ncrForm, costImpact: parseFloat(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500" />
                                </div>
                                <div className="flex justify-end pt-4 space-x-3 space-x-reverse">
                                    <button type="button" onClick={() => setIsNcrModalOpen(false)} className="px-5 py-2.5 bg-slate-800 text-white rounded-xl">إلغاء</button>
                                    <button type="submit" className="px-5 py-2.5 bg-rose-600 text-white rounded-xl font-bold">حفظ واعتماد</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* CAPA Modal */}
                {isCapaModalOpen && selectedNcr && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-700 overflow-hidden">
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                                <h3 className="text-xl font-bold text-white flex items-center">
                                    <Wrench className="w-6 h-6 ml-2 text-blue-400" /> إصدار خطة تصحيحية (CAPA)
                                </h3>
                            </div>
                            <form onSubmit={submitCapa} className="p-6 space-y-4">
                                <div className="bg-slate-800 p-3 rounded-lg text-sm text-slate-300 border border-slate-700">
                                    مرتبط بـ NCR #{selectedNcr.id}: {selectedNcr.description}
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">السبب الجذري (Root Cause)</label>
                                    <textarea required rows={2} value={capaForm.rootCause} onChange={e => setCapaForm({...capaForm, rootCause: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">الإجراء التصحيحي (Corrective Action)</label>
                                    <textarea required rows={2} value={capaForm.correctiveAction} onChange={e => setCapaForm({...capaForm, correctiveAction: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"></textarea>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">المسؤول (Owner)</label>
                                        <input type="text" required value={capaForm.owner} onChange={e => setCapaForm({...capaForm, owner: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">تاريخ الاستحقاق</label>
                                        <input type="date" required value={capaForm.dueDate} onChange={e => setCapaForm({...capaForm, dueDate: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500" />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4 space-x-3 space-x-reverse">
                                    <button type="button" onClick={() => setIsCapaModalOpen(false)} className="px-5 py-2.5 bg-slate-800 text-white rounded-xl">إلغاء</button>
                                    <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold">تسجيل الـ CAPA</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* NCR List */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="text-center p-10 text-slate-500">جاري تحميل البيانات...</div>
                    ) : (
                        ncrs.map(ncr => (
                            <div key={ncr.id} className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden p-6">
                                <div className="flex justify-between items-start mb-6 border-b border-slate-800 pb-4">
                                    <div>
                                        <div className="flex items-center space-x-3 space-x-reverse mb-2">
                                            <h3 className="text-xl font-bold text-white">NCR #{ncr.id}</h3>
                                            {getSeverityBadge(ncr.severity)}
                                            <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs">معالجة: {ncr.dispositionType}</span>
                                        </div>
                                        <p className="text-slate-400">{ncr.description}</p>
                                    </div>
                                    <div className="text-left">
                                        <div className="text-sm text-slate-500">الأثر المالي</div>
                                        <div className="font-mono text-rose-400 font-bold">{ncr.costImpact} SAR</div>
                                    </div>
                                </div>

                                <div className="mb-4 flex items-center justify-between">
                                    <h4 className="text-lg font-bold text-white flex items-center">
                                        <Wrench className="w-5 h-5 ml-2 text-blue-400" />
                                        سجل الإجراءات التصحيحية (CAPAs)
                                    </h4>
                                    <button onClick={() => { setSelectedNcr(ncr); setIsCapaModalOpen(true); }} className="text-sm text-blue-400 hover:text-blue-300 font-medium">
                                        + إضافة إجراء تصحيحي
                                    </button>
                                </div>

                                {ncr.capas && ncr.capas.length > 0 ? (
                                    <div className="space-y-3">
                                        {ncr.capas.map((capa: any) => (
                                            <div key={capa.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex justify-between items-center">
                                                <div>
                                                    <div className="flex items-center space-x-3 space-x-reverse mb-1">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${capa.status === 'CLOSED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                                            {capa.status === 'CLOSED' ? 'مغلق (تم التثبت)' : 'مفتوح (قيد العمل)'}
                                                        </span>
                                                        <span className="text-white font-medium">المسؤول: {capa.owner}</span>
                                                        <span className="text-slate-500 text-xs">يستحق في: {new Date(capa.dueDate).toLocaleDateString('ar-SA')}</span>
                                                    </div>
                                                    <p className="text-slate-400 text-sm"><span className="text-slate-500 font-bold">السبب:</span> {capa.rootCause}</p>
                                                    <p className="text-slate-300 text-sm mt-1"><span className="text-blue-400 font-bold">الإجراء:</span> {capa.action}</p>
                                                    {capa.effectivenessReview && (
                                                        <p className="text-emerald-400 text-xs mt-2 bg-emerald-500/5 p-2 rounded">
                                                            <ShieldCheck className="w-3 h-3 inline ml-1"/> نتيجة التثبت: {capa.effectivenessReview}
                                                        </p>
                                                    )}
                                                </div>
                                                {capa.status === 'OPEN' && (
                                                    <button onClick={() => updateCapaStatus(capa.id, 'CLOSED')} className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg text-sm font-medium transition-colors border border-emerald-500/20 flex items-center">
                                                        <CheckCircle2 className="w-4 h-4 ml-1" /> إغلاق وتثبت
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center p-4 bg-slate-950/50 rounded-xl border border-slate-800 border-dashed text-slate-500 text-sm">
                                        لم يتم تسجيل أي إجراءات تصحيحية لهذا التقرير بعد.
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
