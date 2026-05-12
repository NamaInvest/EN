'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Utensils, CheckCircle2, Coffee } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CustomerTablePage({ params }: { params: { qrToken: string } }) {
    const [loading, setLoading] = useState(true);
    const [tableData, setTableData] = useState<any>(null);
    const [callStatus, setCallStatus] = useState<'IDLE' | 'CALLING' | 'CALLED'>('IDLE');

    useEffect(() => {
        // Fetch table details using the token
        const fetchTable = async () => {
            try {
                const res = await fetch(\`/api/customer/table/\${params.qrToken}\`);
                const data = await res.json();
                if (data.success) {
                    setTableData(data.table);
                } else {
                    toast.error('لم يتم العثور على الطاولة');
                }
            } catch (e) {
                toast.error('خطأ في الاتصال بالخادم');
            } finally {
                setLoading(false);
            }
        };
        fetchTable();
    }, [params.qrToken]);

    const callWaiter = async () => {
        setCallStatus('CALLING');
        try {
            const res = await fetch(\`/api/customer/table/\${params.qrToken}\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'CALL_WAITER' })
            });
            const data = await res.json();
            if (data.success) {
                setCallStatus('CALLED');
                toast.success('تم استدعاء النادل بنجاح، سيأتيك قريباً!');
                setTimeout(() => setCallStatus('IDLE'), 60000); // Reset after 1 min
            } else {
                setCallStatus('IDLE');
                toast.error('حدث خطأ أثناء المحاولة');
            }
        } catch (e) {
            setCallStatus('IDLE');
            toast.error('خطأ في الاتصال');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-orange-50 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <Coffee className="w-12 h-12 text-orange-500 mb-4" />
                    <p className="text-orange-800 font-bold">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    if (!tableData) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center p-8 border-red-200">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-black">X</div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">عفواً، الرابط غير صالح</h2>
                    <p className="text-slate-500 text-sm">يرجى التأكد من مسح الباركود بشكل صحيح من الطاولة.</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-cairo" dir="rtl">
            {/* Header */}
            <div className="bg-orange-500 text-white p-6 rounded-b-[2rem] shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black opacity-10 rounded-full -ml-8 -mb-8 blur-lg"></div>
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black mb-1">أهلاً بك 👋</h1>
                        <p className="text-orange-100 text-sm font-semibold">نحن سعداء بخدمتك اليوم</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                        <Utensils className="w-8 h-8 text-white" />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 flex flex-col gap-6 -mt-6 relative z-20">
                {/* Table Info Card */}
                <Card className="border-0 shadow-xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                                <Coffee className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-bold">أنت تجلس على</p>
                                <h2 className="text-3xl font-black text-slate-800">{tableData.name}</h2>
                                <p className="text-xs text-slate-400 mt-1">المنطقة: {tableData.zone?.name}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Action - Call Waiter */}
                <div className="flex-1 flex flex-col items-center justify-center pb-12">
                    <button 
                        onClick={callWaiter}
                        disabled={callStatus !== 'IDLE'}
                        className={\`relative group w-48 h-48 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-2xl \${
                            callStatus === 'CALLED' 
                                ? 'bg-emerald-500 text-white shadow-emerald-500/40 scale-95' 
                                : callStatus === 'CALLING'
                                ? 'bg-orange-400 text-white shadow-orange-500/40 animate-pulse'
                                : 'bg-linear-to-br from-orange-400 to-red-500 text-white shadow-red-500/30 hover:scale-105 active:scale-95'
                        }\`}
                    >
                        {/* Ripples */}
                        {callStatus === 'IDLE' && (
                            <>
                                <div className="absolute inset-0 rounded-full border-2 border-orange-500 opacity-20 group-hover:animate-ping"></div>
                                <div className="absolute -inset-4 rounded-full border border-red-500 opacity-10 group-hover:animate-ping" style={{ animationDelay: '200ms' }}></div>
                            </>
                        )}
                        
                        {callStatus === 'CALLED' ? (
                            <CheckCircle2 className="w-20 h-20 mb-2" />
                        ) : (
                            <Bell className={\`w-20 h-20 mb-2 \${callStatus === 'IDLE' ? 'group-hover:-rotate-12 transition-transform' : 'animate-bounce'}\`} />
                        )}
                        
                        <span className="text-2xl font-black tracking-tight">
                            {callStatus === 'CALLED' ? 'تم الاستدعاء' : callStatus === 'CALLING' ? 'جاري...' : 'استدعاء النادل'}
                        </span>
                    </button>
                    <p className="text-slate-400 font-bold mt-8 text-center max-w-[200px]">
                        {callStatus === 'CALLED' 
                            ? 'لقد استلمنا طلبك، النادل في الطريق إليك!' 
                            : 'اضغط على الزر إذا كنت بحاجة للمساعدة أو للطلب'}
                    </p>
                </div>
            </div>
            
            {/* Minimal Footer */}
            <div className="py-4 text-center text-xs font-bold text-slate-300">
                Powered by NamaSoft
            </div>
        </div>
    );
}
