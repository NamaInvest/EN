'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BellRing, CheckCircle2, UtensilsCrossed } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

export default function QRMenuPage({ params }: { params: { token: string } }) {
  const [table, setTable] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [callSuccess, setCallSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTableInfo = async () => {
      try {
        const res = await fetch(`/api/restaurant/table/info?token=${params.token}`);
        const data = await res.json();
        
        if (!res.ok || !data.success) {
          setError(data.error || 'Invalid QR Code');
        } else {
          setTable(data.table);
        }
      } catch (err) {
        setError('Connection error');
      } finally {
        setLoading(false);
      }
    };

    fetchTableInfo();
  }, [params.token]);

  const handleCallWaiter = async () => {
    setCalling(true);
    try {
      const res = await fetch('/api/restaurant/table/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: params.token })
      });
      const data = await res.json();
      
      if (data.success) {
        setCallSuccess(true);
        toast.success('تم استدعاء النادل بنجاح. سيأتيك فوراً!');
        
        // Reset the success state after 10 seconds
        setTimeout(() => setCallSuccess(false), 10000);
      } else {
        toast.error(data.error || 'Failed to call waiter');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setCalling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <UtensilsCrossed className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">جاري التجهيز...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <Card className="w-full max-w-md border-red-200 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600 text-xl">عذراً، الباركود غير صالح</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-slate-600">
            {error}. يرجى الطلب من المحاسب إعادة طباعة باركود جديد للطاولة.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" style={{ direction: 'rtl' }}>
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4 flex items-center justify-center">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <UtensilsCrossed className="text-blue-600" />
          المنيو الرقمي
        </h1>
      </div>

      <div className="flex-1 p-4 max-w-md mx-auto w-full space-y-6 mt-6">
        {/* Table Info */}
        <Card className="border-none shadow-md bg-linear-to-br from-blue-50 to-white">
          <CardContent className="p-6 text-center">
            <h2 className="text-sm font-semibold text-blue-600 mb-1">{table?.zone}</h2>
            <div className="text-4xl font-black text-slate-800">{table?.tableNumber}</div>
            <p className="text-xs text-slate-400 mt-2">السعة: {table?.capacity} أشخاص</p>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="pt-8">
          {callSuccess ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex flex-col items-center text-center animate-in zoom-in duration-300">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="text-lg font-bold text-green-800 mb-2">النادل في الطريق إليك!</h3>
              <p className="text-sm text-green-600">يرجى الانتظار قليلاً في مقعدك.</p>
            </div>
          ) : (
            <Button 
              onClick={handleCallWaiter}
              disabled={calling}
              className="w-full h-24 rounded-2xl bg-yellow-500 hover:bg-yellow-600 text-white shadow-xl hover:shadow-2xl transition-all flex flex-col items-center justify-center gap-2"
            >
              <BellRing className={`w-8 h-8 ${calling ? 'animate-ping' : 'animate-bounce'}`} />
              <span className="text-xl font-bold">
                {calling ? 'جاري الاستدعاء...' : 'استدعاء النادل'}
              </span>
            </Button>
          )}
        </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Example Categories & Items Mapping from Dummy Data */}
            <div className="bg-white/5 dark:bg-black/20 p-6 rounded-2xl border border-white/10">
              <h3 className="text-xl font-bold text-slate-800 mb-4">العروض والمميزات (Specials)</h3>
              <ul className="space-y-4">
                <li className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <div>
                    <h4 className="font-bold text-slate-800">وجبة الكومبو العائلي</h4>
                    <p className="text-sm text-slate-500">تشمل 3 أطباق رئيسية، مقبلات، ومشروبات</p>
                  </div>
                  <span className="text-emerald-600 font-bold">120 SAR</span>
                </li>
                <li className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                  <div>
                    <h4 className="font-bold text-slate-800">عصير برتقال طازج</h4>
                    <p className="text-sm text-slate-500">محضر يومياً</p>
                  </div>
                  <span className="text-emerald-600 font-bold">15 SAR</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                <h3 className="text-xl font-bold text-slate-800 mb-2">هل أنت جاهز للطلب؟</h3>
                <p className="text-sm text-slate-500 mb-6">يمكنك الإضافة للسلة مباشرة وإرسال الطلب للمطبخ دون الحاجة للنادل.</p>
                <button className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold shadow-lg shadow-blue-500/20 transition-all">
                  فتح القائمة الكاملة (View Full Menu)
                </button>
            </div>
          </div>
      </div>
    </div>
  );
}
