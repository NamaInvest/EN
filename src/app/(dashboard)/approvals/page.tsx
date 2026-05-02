'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { Check, X, Clock } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function ApprovalsPage() {

    const { t } = useTranslation();
    const [steps, setSteps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    useEffect(() => {
        fetchApprovals();
    }, []);

    const fetchApprovals = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/approvals');
            const data = await res.json();
            if (Array.isArray(data)) setSteps(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (stepId: number, action: 'APPROVED' | 'REJECTED') => {
        const notes = prompt(action === 'APPROVED' ? 'أضف ملاحظة للموافقة (اختياري)' : 'أضف سبب الرفض (إلزامي)');
        
        if (action === 'REJECTED' && !notes) {
            alert('الرجاء إدخال سبب الرفض');
            return;
        }

        setActionLoading(stepId);
        try {
            const res = await fetch(`/api/approvals/${stepId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, notes })
            });
            const data = await res.json();
            
            if (data.error) {
                alert(data.error);
            } else {
                // Refresh list
                setSteps(steps.filter(s => s.id !== stepId));
            }
        } catch (error) {
            alert('حدث خطأ');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="p-6" dir="rtl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">طلبات الاعتماد المعلقة</h1>
                <button onClick={fetchApprovals} className="text-slate-500 hover:text-slate-800 font-medium transition">
                    تحديث القائمة
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">جاري التحميل...</div>
                ) : steps.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">لا توجد طلبات اعتماد معلقة بانتظارك.</div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {steps.map(step => (
                            <div key={step.id} className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center hover:bg-slate-50 transition">
                                
                                <div className="p-3 bg-amber-100 text-amber-600 rounded-full">
                                    <Clock size={24} />
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-slate-800">
                                        طلب اعتماد: {step.request?.documentType} #{step.request?.documentId}
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        المستوى: {step.level} • تم الطلب في: {new Date(step.request?.createdAt).toLocaleString('ar-SA')}
                                    </p>
                                </div>

                                <div className="flex gap-2 w-full md:w-auto">
                                    <button 
                                        disabled={actionLoading === step.id}
                                        onClick={() => handleAction(step.id, 'APPROVED')}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition"
                                    >
                                        <Check size={18} />
                                        موافقة
                                    </button>
                                    <button 
                                        disabled={actionLoading === step.id}
                                        onClick={() => handleAction(step.id, 'REJECTED')}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition"
                                    >
                                        <X size={18} />
                                        رفض
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
