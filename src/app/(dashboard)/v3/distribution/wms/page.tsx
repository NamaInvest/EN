'use client';
import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';
import { PackageCheck, Map, MapPin, Truck, Layers, Route, Mic, Bot } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * DistributionWMS - Advanced Warehouse Management System (WMS) Dashboard
 * fully localized with bilingual helper _t supporting both Arabic and English interfaces.
 */
export default function DistributionWMS() {
  const { lang, dir } = useTranslation();
  const { error: toastError, success: toastSuccess } = useToast();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

  const handleReplenishment = async () => {
    try {
      const res = await fetch('/api/v3/distribution/wms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: 1 }),
      });
      if (res.ok) {
        toastSuccess(_t('تم بدء عملية التزويد وحفظها في قاعدة البيانات!', 'Replenishment process started and saved in database!'));
      } else {
        toastError(_t('فشلت العملية', 'Process failed'));
      }
    } catch {
      toastError(_t('خطأ في الاتصال', 'Connection error'));
    }
  };

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-100 space-y-6" dir={dir}>
      {/* Enterprise Features Bar */}
      <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-xl flex justify-between items-center mb-6 animate-fade-in">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 font-black tracking-widest text-sm border border-yellow-400/50 bg-yellow-400/10 px-2 py-1 rounded">
            {_t('ميزات المؤسسة العالمية', 'Global Enterprise Features')}
          </span>
        </div>
        <div className="flex gap-3">
          <Button className="bg-emerald-600 text-white font-bold hover:opacity-90 shadow-lg">
            <Route className="w-4 h-4 ml-2 mr-2" />
            {_t('تحسين المسار بالذكاء الاصطناعي', 'AI Route Optimization')}
          </Button>
          <Button className="bg-blue-500 text-white font-bold hover:opacity-90 shadow-lg">
            <Mic className="w-4 h-4 ml-2 mr-2" />
            {_t('الالتقاط الصوتي', 'Voice Picking')}
          </Button>
          <Button className="bg-slate-700 text-white font-bold hover:opacity-90 shadow-lg">
            <Bot className="w-4 h-4 ml-2 mr-2" />
            {_t('واجهة الناقلات الآلية', 'AGV Telemetry API')}
          </Button>
        </div>
      </div>

      {/* Main WMS Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/20 rounded-xl">
            <PackageCheck className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black">{_t('إدارة المستودعات المتقدمة (WMS)', 'Advanced Warehouse Management (WMS)')}</h1>
            <p className="text-slate-400 mt-1">
              {_t('مواقع الصناديق ثلاثية الأبعاد • توصيل المسارات', '3D Bin Slotting & Mapping • Final-Mile Routing')}
            </p>
          </div>
        </div>
        <Button onClick={handleReplenishment} className="bg-indigo-600 hover:bg-indigo-500 font-bold">
          <Layers className="w-4 h-4 ml-2 mr-2" />
          {_t('بدء التزويد', 'Trigger Replenishment')}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Interactive Warehouse Grid Map */}
        <div className="col-span-2">
          <Card className="p-0 border-slate-700 bg-slate-800 overflow-hidden h-[600px] flex flex-col">
            <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
              <h2 className="font-bold flex items-center gap-2">
                <Map className="w-5 h-5 text-indigo-400" />
                {_t('تخطيط المستودع التفاعلي', 'Interactive WMS Warehouse Layout')}
              </h2>
              <span className="text-xs bg-slate-700 px-2 py-1 rounded font-mono">
                {_t('المنطقة A - الرفوف', 'Zone A - Heavy Racks')}
              </span>
            </div>
            <div className="flex-1 p-6 grid grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(rack => (
                <div key={rack} className="bg-slate-900 border border-slate-700 rounded-lg p-2 space-y-2 flex flex-col justify-end">
                  <div className="text-center font-black text-slate-600 text-xs mb-2">
                    {_t(`ممر ${rack}`, `Aisle ${rack}`)}
                  </div>
                  <div className="h-12 bg-emerald-500/20 border border-emerald-500/50 rounded flex items-center justify-center text-xs text-emerald-400 font-bold">
                    {_t('100% ممتلئ', '100% Occupied')}
                  </div>
                  <div className="h-12 bg-amber-500/20 border border-amber-500/50 rounded flex items-center justify-center text-xs text-amber-400 font-bold">
                    {_t('45% ممتلئ', '45% Occupied')}
                  </div>
                  <div className="h-12 bg-red-500/20 border border-red-500/50 rounded flex items-center justify-center text-xs text-red-400 font-bold">
                    {_t('فارغ', 'Empty Bin')}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar Dispatch Status */}
        <div className="space-y-6">
          <Card className="p-6 border-slate-700 bg-slate-800">
            <h2 className="font-bold flex items-center gap-2 mb-4">
              <Truck className="w-5 h-5 text-indigo-400" />
              {_t('مسارات الأسطول النشطة', 'Active Fleet Dispatch')}
            </h2>
            <div className="space-y-4">
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold">{_t('شاحنة #42', 'Truck #42 (Volvo FMX)')}</span>
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded">
                    {_t('قيد التوصيل', 'Transit')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400 mt-3">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  {_t('المحطة التالية: هايبر بنده (العليا)', 'Next: Hyper Panda (Olaya)')}
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-4">
                  <div className="bg-indigo-500 h-1.5 rounded-full w-[40%]"></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

