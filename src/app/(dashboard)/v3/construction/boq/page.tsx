'use client';
import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { HardHat, FileBarChart2, Truck, CheckSquare, Hammer, Building2, Plane, CloudRain } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/Toast';

/**
 * ConstructionBOQ - Enterprise Bill of Quantities (BOQ) & Progress Billing Dashboard
 * fully localized with bilingual helper _t supporting both Arabic and English interfaces.
 */
export default function ConstructionBOQ() {
  const { lang, dir } = useTranslation();
  const { error: toastError, success: toastSuccess } = useToast();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

  const handleGenerateInvoice = async () => {
    try {
      const res = await fetch('/api/v3/construction/boq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: 1, totalCost: 14500000 }),
      });
      if (res.ok) {
        toastSuccess(_t('تم توليد فاتورة التقدّم وحفظها بنجاح!', 'Progress invoice generated and saved successfully!'));
      } else {
        toastError(_t('فشل التوليد', 'Generation failed'));
      }
    } catch {
      toastError(_t('خطأ في الاتصال', 'Connection error'));
    }
  };

  return (
    <div className="p-6 bg-stone-100 min-h-screen text-slate-800 space-y-6" dir={dir}>
      {/* Enterprise Features Bar */}
      <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-xl flex justify-between items-center mb-6 animate-fade-in">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 font-black tracking-widest text-sm border border-yellow-400/50 bg-yellow-400/10 px-2 py-1 rounded">
            {_t('ميزات المؤسسة العالمية', 'Global Enterprise Features')}
          </span>
        </div>
        <div className="flex gap-3">
          <Button className="bg-stone-600 text-white font-bold hover:opacity-90 shadow-lg">
            <Building2 className="w-4 h-4 ml-2 mr-2" />
            {_t('عارض BIM ثلاثي الأبعاد', '3D BIM Viewer')}
          </Button>
          <Button className="bg-blue-600 text-white font-bold hover:opacity-90 shadow-lg">
            <Plane className="w-4 h-4 ml-2 mr-2" />
            {_t('استيراد المسح الجوي', 'Import Drone Survey')}
          </Button>
          <Button className="bg-sky-500 text-white font-bold hover:opacity-90 shadow-lg">
            <CloudRain className="w-4 h-4 ml-2 mr-2" />
            {_t('توقعات الطقس', 'Weather Forecast')}
          </Button>
        </div>
      </div>

      {/* Project Main Header Card */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-stone-200">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 text-stone-800">
            <HardHat className="text-amber-500 w-8 h-8" />
            {_t('مشروع: مترو الرياض - الخط الرابع', 'Project: Riyadh Metro - Line 4')}
          </h1>
          <p className="text-stone-500 mt-1 font-medium">
            {_t('جدول الكميات (BOQ) وفواتير التقدّم • إدارة المقاولين الفرعيين', 'Bill of Quantities (BOQ) & Progress Billing • Subcontractor Management')}
          </p>
        </div>
        <div className="text-left">
          <p className="text-sm text-stone-500 font-bold">{_t('إجمالي الميزانية', 'Total Budget')}</p>
          <p className="text-2xl font-black text-amber-600">
            {_t('14,500,000 ر.س', '14,500,000 SAR')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* BOQ Table Grid */}
        <div className="col-span-2 space-y-6">
          <Card className="p-6 bg-white shadow-sm border-stone-200">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 border-b pb-4">
              <FileBarChart2 className="text-stone-600" />
              {_t('جدول الكميات (BOQ)', 'Bill of Quantities (BOQ)')}
            </h2>
            <div className="space-y-3 font-medium">
              <div className="grid grid-cols-12 gap-4 bg-stone-50 p-3 rounded-lg border border-stone-200 font-bold text-sm text-stone-600">
                <div className="col-span-1">{_t('رقم', 'No.')}</div>
                <div className="col-span-5">{_t('الوصف', 'Description')}</div>
                <div className="col-span-2">{_t('الكمية', 'Quantity')}</div>
                <div className="col-span-2">{_t('سعر الوحدة', 'Unit Price')}</div>
                <div className="col-span-2">{_t('الإجمالي', 'Total')}</div>
              </div>
              {[
                { id: '1.1', descAr: 'أعمال الحفر والتسوية', descEn: 'Site Excavation and Leveling', qtyAr: '12,000 م³', qtyEn: '12,000 m³', price: '45', total: '540,000' },
                { id: '1.2', descAr: 'خرسانة مسلحة (الأساسات)', descEn: 'Reinforced Concrete (Foundations)', qtyAr: '3,500 م³', qtyEn: '3,500 m³', price: '320', total: '1,120,000' },
                { id: '1.3', descAr: 'توريد حديد التسليح', descEn: 'Supply of Reinforcement Steel', qtyAr: '800 طن', qtyEn: '800 Tons', price: '2,400', total: '1,920,000' },
              ].map(item => (
                <div key={item.id} className="grid grid-cols-12 gap-4 p-3 border-b border-stone-100 text-sm items-center">
                  <div className="col-span-1 font-mono text-amber-600">{item.id}</div>
                  <div className="col-span-5 font-bold text-stone-700">{_t(item.descAr, item.descEn)}</div>
                  <div className="col-span-2 text-stone-500">{_t(item.qtyAr, item.qtyEn)}</div>
                  <div className="col-span-2 text-stone-500">{_t(`${item.price} ر.س`, `${item.price} SAR`)}</div>
                  <div className="col-span-2 font-bold text-stone-800">{_t(`${item.total} ر.س`, `${item.total} SAR`)}</div>
                </div>
              ))}
            </div>
            <Button onClick={handleGenerateInvoice} className="mt-6 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold">
              <Hammer className="w-4 h-4 ml-2 mr-2" />
              {_t('توليد فاتورة تقدّم', 'Generate Progress Invoice')}
            </Button>
          </Card>
        </div>

        {/* Sidebar Details Panels */}
        <div className="space-y-6">
          <Card className="p-6 shadow-sm border-stone-200 bg-white">
            <h2 className="font-bold flex items-center gap-2 mb-4">
              <Truck className="w-5 h-5 text-stone-600" />
              {_t('توزيع الأسطول', 'Fleet Distribution')}
            </h2>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg bg-stone-50 flex justify-between items-center">
                <span className="font-bold text-sm">{_t('حفّار CAT-320', 'CAT-320 Excavator')}</span>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold">
                  {_t('في الموقع', 'On Site')}
                </span>
              </div>
              <div className="p-3 border rounded-lg bg-stone-50 flex justify-between items-center">
                <span className="font-bold text-sm">{_t('رافعة Liebherr 50 طن', 'Liebherr 50-Ton Crane')}</span>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold">
                  {_t('صيانة', 'Under Maintenance')}
                </span>
              </div>
            </div>
          </Card>
          <Card className="p-6 shadow-sm border-stone-200 bg-white">
            <h2 className="font-bold flex items-center gap-2 mb-4">
              <CheckSquare className="w-5 h-5 text-stone-600" />
              {_t('المقاولون الفرعيون', 'Subcontractors')}
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1 font-bold">
                  <span>{_t('شركة ألفا للحديد', 'Alpha Steel Corp')}</span>
                  <span className="text-stone-500">
                    {_t('120 ألف ر.س محتجز', '120k SAR Retained')}
                  </span>
                </div>
                <div className="w-full bg-stone-200 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full w-[65%]"></div>
                </div>
                <p className="text-xs text-stone-400 mt-1">{_t('65% إنجاز', '65% Complete')}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

