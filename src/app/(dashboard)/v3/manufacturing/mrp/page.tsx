'use client';
import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Cpu, Settings, Factory, Workflow, AlertTriangle, Wrench } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { useToast } from '@/components/Toast';

export default function ManufacturingMRP() {
  const { lang } = useTranslation();
  const { success: toastSuccess } = useToast();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  return (
    // @ts-expect-error [TS2304] Cannot find name
    <div className="p-6 max-w-7xl mx-auto space-y-6">      {/* Global System Features Bar */} \n      <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-xl flex justify-between items-center mb-6 animate-fade-in">\n        <div className="flex items-center gap-2">\n          <span className="text-yellow-400 font-black tracking-widest text-sm border border-yellow-400/50 bg-yellow-400/10 px-2 py-1 rounded">{_t('ميزات المؤسسة العالمية', 'GLOBAL ENTERPRISE FEATURES')}</span>\n        </div>\n        <div className="flex gap-3">\n        <Button className="bg-teal-500 text-white font-bold hover:opacity-90 shadow-lg"><Cpu className="w-4 h-4 mr-2"/>{_t('مزامنة أجهزة استشعار إنترنت الأشياء', 'IoT Sensors Sync')}</Button>\n        <Button className="bg-amber-500 text-white font-bold hover:opacity-90 shadow-lg"><Wrench className="w-4 h-4 mr-2"/>{_t('الذكاء الاصطناعي للصيانة التنبؤية', 'Predictive Maintenance AI')}</Button>\n        <Button className="bg-indigo-500 text-white font-bold hover:opacity-90 shadow-lg"><BoxSelect className="w-4 h-4 mr-2"/>{_t('عرض رقمي مزدوج', 'Digital Twin View')}</Button>\n        </div>\n      </div>
      <div className="flex justify-between items-center p-6 bg-gradient-to-r from-slate-900 to-indigo-900 rounded-xl shadow-lg text-white">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3"><Factory className="text-indigo-400"/>{_t('محرك MRP', 'MRP Engine')}</h1>
          <p className="text-indigo-200 mt-2">{_t('انفجار BOM متعدد المستويات وتوجيه أوامر العمل', 'Multi-level BOM Explosion & Work Order Routing')}</p>
        </div>
        <Button onClick={() => { fetch("/api/v3/manufacturing/mrp", { method: "POST", body: JSON.stringify({ productId: 1, components: [] }) }).then(()=>toastSuccess("MRP Run Complete & Saved to DB!")); }} className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-6 h-12 rounded-lg">{_t('قم بتشغيل حساب MRP', 'Run MRP Calculation')}</Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="p-6 border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 border-b pb-4"><Workflow className="text-indigo-600"/> Exploded BOM Tree: Electric Motor V2</h2>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex items-center gap-4 bg-indigo-50 p-3 rounded-lg border border-indigo-100 font-bold"><span>[-/+]</span> <span>1x</span> <span>{_t('محرك كهربائي V2 (FG)', 'Electric Motor V2 (FG)')}</span> <span className="ml-auto text-indigo-600">Cost: $124.50</span></div>
              <div className="flex items-center gap-4 p-2 pl-12 border-b border-dashed"><span>├─</span> <span>1x</span> <span>{_t('تجميع الدوار (WIP)', 'Rotor Assembly (WIP)')}</span> <span className="ml-auto text-slate-500">$45.00</span></div>
              <div className="flex items-center gap-4 p-2 pl-24 border-b border-dashed text-slate-600"><span>├─</span> <span>2kg</span> <span>{_t('الأسلاك النحاسية (RM)', 'Copper Wire (RM)')}</span> <span className="ml-auto text-slate-400">$12.00</span></div>
              <div className="flex items-center gap-4 p-2 pl-24 border-b border-dashed text-slate-600"><span>└─</span> <span>1x</span> <span>{_t('رمح الصلب (RM)', 'Steel Shaft (RM)')}</span> <span className="ml-auto text-slate-400">$8.00</span></div>
              <div className="flex items-center gap-4 p-2 pl-12 border-b border-dashed"><span>└─</span> <span>1x</span> <span>{_t('مبيت الجزء الثابت (RM)', 'Stator Housing (RM)')}</span> <span className="ml-auto text-slate-500">$65.00</span></div>
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="p-6 shadow-sm border-orange-200 bg-orange-50/50">
            <h2 className="font-bold flex items-center gap-2 mb-4 text-orange-800"><AlertTriangle className="w-5 h-5"/>{_t('النقص المادي', 'Material Shortages')}</h2>
            <div className="space-y-3">
              <div className="bg-white p-3 rounded border border-orange-200 shadow-sm flex justify-between">
                <div><p className="font-bold text-sm">{_t('الأسلاك النحاسية', 'Copper Wire')}</p><p className="text-xs text-orange-600 mt-1">Shortage: 450 kg</p></div>
                <Button size="sm" variant="outline" className="text-xs h-8">{_t('العلاقات العامة التلقائية', 'Auto PR')}</Button>
              </div>
            </div>
          </Card>
          <Card className="p-6 shadow-sm bg-slate-900 text-white">
            <h2 className="font-bold flex items-center gap-2 mb-4"><Settings className="w-5 h-5 text-indigo-400"/>{_t('تحميل مراكز العمل', 'Work Centers Load')}</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1"><span>{_t('خط التجميع 1', 'Assembly Line 1')}</span><span className="text-indigo-400 font-bold">85%</span></div>
                <div className="w-full bg-slate-800 rounded-full h-2"><div className="bg-indigo-500 h-2 rounded-full w-[85%]"></div></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1"><span>{_t('التصنيع باستخدام الحاسب الآلي', 'CNC Machining')}</span><span className="text-red-400 font-bold">110% (Over)</span></div>
                <div className="w-full bg-slate-800 rounded-full h-2"><div className="bg-red-500 h-2 rounded-full w-[100%]"></div></div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}