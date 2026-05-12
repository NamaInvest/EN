'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';

export default function KitchenDisplaySystemPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    try {
        const res = await fetch('/api/pos/restaurant/kds');
        const data = await res.json();
        if (data.success) {
            setTickets(data.tickets);
        }
    } catch(e) {
        console.error('KDS Fetch Error', e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
      fetchTickets();
      const interval = setInterval(fetchTickets, 10000); // refresh every 10 seconds
      return () => clearInterval(interval);
  }, []);

  const updateStatus = async (invoiceId: number, status: string) => {
      try {
          const res = await fetch('/api/pos/restaurant/kds', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ invoiceId, status })
          });
          const data = await res.json();
          if (data.success) {
              toast.success(_t('تم تحديث حالة الطلب', 'Order status updated'));
              fetchTickets(); // Refresh immediately
          } else {
              toast.error(data.error || _t('حدث خطأ', 'Error occurred'));
          }
      } catch (e) {
          toast.error('Network Error');
      }
  };

  if (loading) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center font-bold text-2xl">{_t('جاري التحميل...', 'Loading...')}</div>;

  const pendingCount = tickets.filter(t => t.status === 'NEW').length;
  const preparingCount = tickets.filter(t => t.status === 'PREPARING').length;

  return (
        <div className="min-h-screen bg-gray-900 text-white p-4 overflow-hidden" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-black text-yellow-500 tracking-tight">{_t('نظام عرض المطبخ (KDS)', 'Kitchen Display System (KDS)')}</h1>
                    <p className="text-gray-400 text-sm mt-1">{_t('إدارة الطلبات المباشرة', 'Live order management')}</p>
                </div>
                <div className="flex space-x-6 space-x-reverse">
                    <div className="text-center bg-gray-800 px-6 py-2 rounded-2xl border border-gray-700">
                        <div className="text-3xl font-black text-red-500 animate-pulse">{pendingCount}</div>
                        <div className="text-xs font-bold uppercase text-gray-400 mt-1">{_t('طلبات جديدة', 'New')}</div>
                    </div>
                    <div className="text-center bg-gray-800 px-6 py-2 rounded-2xl border border-gray-700">
                        <div className="text-3xl font-black text-yellow-500">{preparingCount}</div>
                        <div className="text-xs font-bold uppercase text-gray-400 mt-1">{_t('قيد التحضير', 'Preparing')}</div>
                    </div>
                </div>
            </header>

            {tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[70vh] opacity-50">
                    <div className="text-9xl mb-4">🍽️</div>
                    <h2 className="text-3xl font-black text-gray-500">{_t('لا توجد طلبات معلقة', 'No pending orders')}</h2>
                </div>
            ) : (
                <div className="flex space-x-6 space-x-reverse overflow-x-auto pb-8 custom-scrollbar items-start h-[calc(100vh-140px)]">
                    {tickets.map((t) => {
                        const isLate = (new Date().getTime() - new Date(t.timestamp).getTime()) > 15 * 60000; // 15 mins
                        
                        return (
                        <Card key={t.id} className={`min-w-[320px] max-w-[320px] border shrink-0 transition-all duration-500 shadow-2xl ${isLate && t.status === 'NEW' ? 'bg-red-950 border-red-800' : 'bg-gray-800 border-gray-700'}`}>
                            <CardHeader className={`border-b ${isLate && t.status === 'NEW' ? 'border-red-900 bg-red-900/30' : 'border-gray-700 bg-gray-800/50'} pb-4`}>
                                <div className="flex justify-between items-center mb-2">
                                    <CardTitle className="text-3xl font-black text-white">#{t.invoiceNo}</CardTitle>
                                    <span className={`font-mono font-bold px-3 py-1 rounded-full text-sm ${isLate ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-700 text-gray-300'}`}>{t.time}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm mt-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={`${t.type === 'Dine-in' ? 'border-blue-500 text-blue-400' : 'border-purple-500 text-purple-400'}`}>
                                            {t.type === 'Dine-in' ? _t('محلي', 'Dine-in') : _t('سفري', 'Takeaway')}
                                        </Badge>
                                        <span className="font-bold text-gray-300">{t.table}</span>
                                    </div>
                                    <Badge className={`${t.status === 'PREPARING' ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white'}`}>
                                        {t.status === 'PREPARING' ? _t('جاري التحضير', 'Preparing') : _t('جديد', 'New')}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 flex flex-col justify-between h-[calc(100vh-320px)]">
                                <div className="overflow-y-auto space-y-4 custom-scrollbar pr-2 mb-4">
                                    {t.items.map((item: any, i: number) => (
                                        <div key={i} className="border-b border-gray-700/50 pb-3 last:border-0">
                                            <div className="flex justify-between font-black text-xl text-gray-100">
                                                <span className="leading-tight"><span className="text-yellow-500 mr-2 ml-2">{item.qty}x</span> {item.name}</span>
                                            </div>
                                            {item.notes && <div className="text-sm text-yellow-400/80 font-bold mt-2 bg-yellow-900/20 p-2 rounded-lg border border-yellow-900/50">📝 {item.notes}</div>}
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="pt-4 mt-auto border-t border-gray-700 space-y-3">
                                    {t.status === 'NEW' && (
                                        <Button onClick={() => updateStatus(t.id, 'PREPARING')} className="w-full h-14 text-xl font-black bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                                            {_t('ابدأ بالتحضير', 'Start Preparing')}
                                        </Button>
                                    )}
                                    {t.status === 'PREPARING' && (
                                        <Button onClick={() => updateStatus(t.id, 'READY')} className="w-full h-14 text-xl font-black bg-green-500 hover:bg-green-400 text-black transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                                            {_t('الطلب جاهز', 'Mark Ready')}
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )})}
                </div>
            )}
        </div>
    );
}