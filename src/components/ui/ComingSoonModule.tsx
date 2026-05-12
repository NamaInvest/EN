'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { Rocket, ArrowRight, BellRing, Sparkles } from 'lucide-react';

interface ComingSoonProps {
    title: string;
    englishTitle?: string;
    icon?: string;
}

export default function ComingSoonModule({ title, englishTitle, icon = '🚀' }: ComingSoonProps) {
    const router = useRouter();
    const { success: toastSuccess } = useToast();
    const [notified, setNotified] = useState(false);

    const handleNotify = () => {
        setNotified(true);
        toastSuccess('تم تسجيل طلبك! سيتم إشعارك فور إطلاق هذه الوحدة.');
    };

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-500" dir="rtl">
            <div className="bg-white p-10 md:p-14 rounded-4xl shadow-2xl border border-slate-100 max-w-2xl w-full text-center relative overflow-hidden group">
                
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-orange-200/50 transition-colors duration-700" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 group-hover:bg-blue-200/50 transition-colors duration-700" />

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center text-5xl shadow-sm mb-8 relative">
                        {icon}
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg">
                            <Sparkles size={12} />
                        </div>
                    </div>

                    <h1 className="text-4xl font-extrabold text-slate-800 mb-3 tracking-tight">
                        {title}
                    </h1>
                    {englishTitle && (
                        <p className="text-sm font-bold text-slate-400 mb-6 tracking-widest uppercase">
                            {englishTitle}
                        </p>
                    )}

                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl font-bold mb-10 shadow-sm">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                        </span>
                        هذه الوحدة قيد التطوير المتقدم وسيتوفر تحديثها قريباً
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                        <button 
                            onClick={() => router.back()}
                            className="flex items-center justify-center h-14 px-8 gap-3 bg-white text-slate-700 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md transition-all group/btn"
                        >
                            <ArrowRight size={20} className="text-slate-400 group-hover/btn:-translate-x-1 transition-transform" />
                            العودة للوحة القيادة
                        </button>
                        
                        <button 
                            onClick={handleNotify}
                            disabled={notified}
                            className={`flex items-center justify-center h-14 px-8 gap-3 font-bold rounded-2xl border transition-all shadow-lg ${
                                notified 
                                ? 'bg-green-50 text-green-700 border-green-200 shadow-green-500/10' 
                                : 'bg-linear-to-r from-orange-500 to-orange-600 text-white border-transparent hover:shadow-orange-500/30 hover:scale-[1.02]'
                            }`}
                        >
                            {notified ? (
                                <>
                                    <Sparkles size={20} className="animate-pulse" />
                                    تم تسجيل الاهتمام
                                </>
                            ) : (
                                <>
                                    <BellRing size={20} />
                                    أبلغني عند الإطلاق
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
