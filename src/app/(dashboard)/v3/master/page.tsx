'use client';
import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { LayoutDashboard, TrendingUp, ShoppingCart, Activity, ChefHat, Factory, Building2, ServerCog, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * V3MasterDashboard - Central Enterprise Industry Verticals Hub Dashboard
 * fully localized with bilingual helper _t supporting both Arabic and English interfaces.
 */
export default function V3MasterDashboard() {
  const { lang, dir } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const [stats, setStats] = useState({ retail: 0, kds: 0, mrp: 0, boq: 0 });

  useEffect(() => {
    Promise.all([
      fetch('/api/v3/retail/pos').then(r => r.json()).catch(() => ({})),
      fetch('/api/v3/restaurant/kds').then(r => r.json()).catch(() => ({})),
      fetch('/api/v3/manufacturing/mrp').then(r => r.json()).catch(() => ({})),
      fetch('/api/v3/construction/boq').then(r => r.json()).catch(() => ({}))
    ]).then(([retail, kds, mrp, boq]) => {
      setStats({
        retail: retail?.data?.length || 0,
        kds: kds?.data?.length || 0,
        mrp: mrp?.data?.length || 0,
        boq: boq?.data?.length || 0
      });
    }).catch(e => console.error("Error fetching stats:", e));
  }, []);

  return (
    <div className="p-8 bg-slate-50 min-h-screen" dir={dir}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3">
            <LayoutDashboard className="w-10 h-10 text-indigo-600" />
            {_t('لوحة V3 المركزية', 'Central V3 Hub')}
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            {_t('حلول القطاعات المؤسسية • نظرة شاملة على البيانات الحية', 'Enterprise Verticals Solutions • Real-Time Live Feed')}
          </p>
        </div>
        <Button className="bg-slate-900 text-white h-12 px-6 rounded-xl shadow-lg hover:bg-slate-800 font-bold">
          <ServerCog className="w-5 h-5 ml-2 mr-2" />
          {_t('الإعدادات العامة للنظام', 'Global Settings')}
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <Card className="p-6 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow bg-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                {_t('طلبات التجزئة', 'Retail Orders')}
              </p>
              <h2 className="text-4xl font-black text-slate-800 mt-2">{stats.retail}</h2>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl"><ShoppingCart className="w-6 h-6 text-blue-500" /></div>
          </div>
          <div className="mt-4 flex items-center text-sm font-bold text-emerald-500">
            <TrendingUp className="w-4 h-4 ml-1 mr-1" />
            {_t('+12% اليوم', '+12% Today')}
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow bg-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                {_t('تذاكر المطبخ (KDS)', 'Kitchen Tickets (KDS)')}
              </p>
              <h2 className="text-4xl font-black text-slate-800 mt-2">{stats.kds}</h2>
            </div>
            <div className="p-3 bg-orange-50 rounded-xl"><ChefHat className="w-6 h-6 text-orange-500" /></div>
          </div>
          <div className="mt-4 flex items-center text-sm font-bold text-emerald-500">
            <TrendingUp className="w-4 h-4 ml-1 mr-1" />
            {_t('+5% اليوم', '+5% Today')}
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-shadow bg-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                {_t('أوامر تشغيل MRP', 'MRP Work Orders')}
              </p>
              <h2 className="text-4xl font-black text-slate-800 mt-2">{stats.mrp}</h2>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl"><Factory className="w-6 h-6 text-indigo-500" /></div>
          </div>
          <div className="mt-4 flex items-center text-sm font-bold text-emerald-500">
            <TrendingUp className="w-4 h-4 ml-1 mr-1" />
            {_t('عمليات نشطة', 'Active Operations')}
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow bg-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                {_t('جدول الكميات (BOQ)', 'Bill of Quantities (BOQ)')}
              </p>
              <h2 className="text-4xl font-black text-slate-800 mt-2">{stats.boq}</h2>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl"><Building2 className="w-6 h-6 text-amber-500" /></div>
          </div>
          <div className="mt-4 flex items-center text-sm font-bold text-emerald-500">
            <TrendingUp className="w-4 h-4 ml-1 mr-1" />
            {_t('مراحل مكتملة', 'Phases Complete')}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="p-6 shadow-sm border-slate-200 bg-white min-h-[400px]">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6 border-b pb-4 text-slate-800">
              <Activity className="text-indigo-600" />
              {_t('بيانات المنصة الحية', 'Live Platform Stream')}
            </h2>
            <div className="flex h-[300px] items-end gap-4 px-4">
              {[40, 60, 45, 80, 55, 90, 75, 100, 65, 85, 70, 95].map((h, i) => (
                <div key={i} className="flex-1 bg-indigo-100 hover:bg-indigo-200 transition-colors rounded-t-lg relative group flex items-end justify-center" style={{ height: `${h}%` }}>
                  <div className="w-full bg-indigo-500 rounded-t-lg transition-all group-hover:bg-indigo-600" style={{ height: `${h - 20}%` }}></div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-0 shadow-sm border-slate-200 bg-white overflow-hidden">
            <div className="p-6 bg-slate-900 text-white">
              <h2 className="font-bold text-lg">{_t('صحة النظام', 'System Diagnostics')}</h2>
              <p className="text-slate-400 text-sm mt-1">
                {_t('جميع واجهات القطاعات الـ 9 متصلة', 'All 9 vertical telemetry APIs operational')}
              </p>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border">
                <span className="font-bold text-sm text-slate-700">{_t('قاعدة بيانات نقاط البيع', 'Retail POS Database')}</span>
                <span className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  {_t('جاري المزامنة', 'Syncing')}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border">
                <span className="font-bold text-sm text-slate-700">{_t('سجلات العيادات الإلكترونية', 'Clinic EMR Registry')}</span>
                <span className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  {_t('مستقرة', 'Stable')}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border">
                <span className="font-bold text-sm text-slate-700">{_t('فاتورة (ZATCA Phase 2)', 'Fatoora (ZATCA Phase 2)')}</span>
                <span className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  {_t('متصلة', 'Connected')}
                </span>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t text-center">
              <a href="#" className="text-indigo-600 font-bold text-sm flex justify-center items-center gap-1 hover:text-indigo-800">
                {_t('عرض السجلات الكاملة', 'View Full Diagnostics Log')}
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

