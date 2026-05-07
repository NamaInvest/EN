'use client';
import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { PackageCheck, Map, MapPin, Truck, Layers, Route, Mic, Bot } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DistributionWMS() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const handleReplenishment = async () => {
    try {
      const res = await fetch('/api/v3/distribution/wms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: 1 }),
      });
      if (res.ok) alert('تم بدء عملية التزويد وحفظها في قاعدة البيانات!');
      else alert('فشلت العملية');
    } catch {
      alert('خطأ في الاتصال');
    }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100 space-y-6" dir="rtl">
      <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-xl flex justify-between items-center mb-6 animate-fade-in">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 font-black tracking-widest text-sm border border-yellow-400/50 bg-yellow-400/10 px-2 py-1 rounded">ميزات المؤسسة العالمية</span>
        </div>
        <div className="flex gap-3">
          <Button className="bg-emerald-600 text-white font-bold hover:opacity-90 shadow-lg"><Route className="w-4 h-4 ml-2"/> تحسين المسار بالذكاء الاصطناعي</Button>
          <Button className="bg-blue-500 text-white font-bold hover:opacity-90 shadow-lg"><Mic className="w-4 h-4 ml-2"/> الالتقاط الصوتي</Button>
          <Button className="bg-slate-700 text-white font-bold hover:opacity-90 shadow-lg"><Bot className="w-4 h-4 ml-2"/> واجهة الناقلات الآلية</Button>
        </div>
      </div>

      <div className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/20 rounded-xl"><PackageCheck className="w-8 h-8 text-indigo-400"/></div>
          <div>
            <h1 className="text-3xl font-black">إدارة المستودعات المتقدمة (WMS)</h1>
            <p className="text-slate-400 mt-1">مواقع الصناديق ثلاثية الأبعاد • توصيل المسارات</p>
          </div>
        </div>
        <Button onClick={handleReplenishment} className="bg-indigo-600 hover:bg-indigo-500 font-bold">
          <Layers className="w-4 h-4 ml-2"/> بدء التزويد
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <Card className="p-0 border-slate-700 bg-slate-800 overflow-hidden h-[600px] flex flex-col">
            <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
              <h2 className="font-bold flex items-center gap-2"><Map className="w-5 h-5 text-indigo-400"/> تخطيط المستودع التفاعلي</h2>
              <span className="text-xs bg-slate-700 px-2 py-1 rounded font-mono">المنطقة A - الرفوف</span>
            </div>
            <div className="flex-1 p-6 grid grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(rack => (
                <div key={rack} className="bg-slate-900 border border-slate-700 rounded-lg p-2 space-y-2 flex flex-col justify-end">
                  <div className="text-center font-black text-slate-600 text-xs mb-2">ممر {rack}</div>
                  <div className="h-12 bg-emerald-500/20 border border-emerald-500/50 rounded flex items-center justify-center text-xs text-emerald-400 font-bold">100% ممتلئ</div>
                  <div className="h-12 bg-amber-500/20 border border-amber-500/50 rounded flex items-center justify-center text-xs text-amber-400 font-bold">45% ممتلئ</div>
                  <div className="h-12 bg-red-500/20 border border-red-500/50 rounded flex items-center justify-center text-xs text-red-400 font-bold">فارغ</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 border-slate-700 bg-slate-800">
            <h2 className="font-bold flex items-center gap-2 mb-4"><Truck className="w-5 h-5 text-indigo-400"/> مسارات الأسطول النشطة</h2>
            <div className="space-y-4">
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold">شاحنة #42</span>
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded">قيد التوصيل</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400 mt-3">
                  <MapPin className="w-4 h-4 text-emerald-400"/> المحطة التالية: هايبر بنده (العليا)
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-4"><div className="bg-indigo-500 h-1.5 rounded-full w-[40%]"></div></div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
