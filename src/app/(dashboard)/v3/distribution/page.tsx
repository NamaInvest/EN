'use client';
import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Truck, TrendingUp, Activity, BarChart, Settings, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * WholesaleDistributionDashboard - Wholesale & Distribution Industry Module Dashboard
 * fully localized with bilingual helper _t supporting both Arabic and English interfaces.
 */
export default function WholesaleDistributionDashboard() {
  const { lang, dir } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6" dir={dir}>
            <div className="flex justify-between items-center bg-white p-6 rounded-xl border shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Truck className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">
                          {_t('البيع بالجملة والتوزيع V3', 'Wholesale & Distribution V3')}
                        </h1>
                        <p className="text-slate-500 mt-1">
                          {_t('محاسبة المسارات، حدود الائتمان B2B، WMS مع مواقع الصناديق', 'Route Accounting, B2B Credit Limits, WMS with Bin Mapping')}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="flex gap-2">
                      <Download className="w-4 h-4 ml-2 mr-2" />
                      {_t('تصدير التقرير', 'Export Report')}
                    </Button>
                    <Button className="flex gap-2">
                      <Settings className="w-4 h-4 ml-2 mr-2" />
                      {_t('إعدادات الموديول', 'Module Settings')}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-5 border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow">
                    <p className="text-sm font-medium text-slate-500">
                      {_t('نسبة تلبية الطلبات', 'Order Fulfillment Rate')}
                    </p>
                    <h3 className="text-2xl font-bold mt-2 text-slate-800">
                      {_t('450,200 ر.س', '450,200 SAR')}
                    </h3>
                    <div className="mt-2 flex items-center text-xs text-emerald-600 font-medium">
                        <TrendingUp className="w-3 h-3 ml-1 mr-1" />
                        {_t('+4.2% عن الشهر الماضي', '+4.2% vs last month')}
                    </div>
                </Card>
                <Card className="p-5 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
                    <p className="text-sm font-medium text-slate-500">
                      {_t('مدة دورة الطلب', 'Order Cycle Time')}
                    </p>
                    <h3 className="text-2xl font-bold mt-2 text-slate-800">
                      84.5%
                    </h3>
                    <div className="mt-2 flex items-center text-xs text-emerald-600 font-medium">
                        <TrendingUp className="w-3 h-3 ml-1 mr-1" />
                        {_t('+4.2% عن الشهر الماضي', '+4.2% vs last month')}
                    </div>
                </Card>
                <Card className="p-5 border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow">
                    <p className="text-sm font-medium text-slate-500">
                      {_t('دوران المخزون', 'Inventory Turnover')}
                    </p>
                    <h3 className="text-2xl font-bold mt-2 text-slate-800">
                      1,204
                    </h3>
                    <div className="mt-2 flex items-center text-xs text-emerald-600 font-medium">
                        <TrendingUp className="w-3 h-3 ml-1 mr-1" />
                        {_t('+4.2% عن الشهر الماضي', '+4.2% vs last month')}
                    </div>
                </Card>
                <Card className="p-5 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
                    <p className="text-sm font-medium text-slate-500">
                      {_t('العائد على المخزون (GMROI)', 'GMROI on Stock')}
                    </p>
                    <h3 className="text-2xl font-bold mt-2 text-slate-800">
                      15%
                    </h3>
                    <div className="mt-2 flex items-center text-xs text-emerald-600 font-medium">
                        <TrendingUp className="w-3 h-3 ml-1 mr-1" />
                        {_t('+4.2% عن الشهر الماضي', '+4.2% vs last month')}
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="col-span-2 p-6 h-96 flex flex-col items-center justify-center border-dashed bg-slate-50">
                    <BarChart className="w-16 h-16 text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-600">
                      {_t('تحليلات العمليات الأساسية', 'Core Operational Analytics')}
                    </h3>
                    <p className="text-sm text-slate-500 text-center max-w-sm mt-2">
                        {_t('ستُعرض المخططات التشغيلية هنا اعتماداً على V3 EventBus حسب احتياجات قطاع البيع بالجملة والتوزيع.', 'Operational charts will be rendered here via V3 EventBus telemetry according to Wholesale & Distribution sector requirements.')}
                    </p>
                </Card>

                <Card className="p-6 h-96 flex flex-col items-start justify-start">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-blue-500"/>
                        {_t('سجل النشاط المباشر', 'Live Telemetry Stream')}
                    </h3>
                    <div className="space-y-4 w-full">
                        {[1,2,3,4,5].map(n => (
                            <div key={n} className="flex gap-3 text-sm border-b pb-3 last:border-0">
                                <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500"></div>
                                <div>
                                    <p className="font-medium text-slate-700">
                                      {_t(`حدث النظام #${Math.floor(Math.random()*1000)}`, `System Event #${Math.floor(Math.random()*1000)}`)}
                                    </p>
                                    <p className="text-slate-500 text-xs mt-0.5">
                                      {_t('معالجة منذ دقيقتين عبر محرك V3', 'Processed 2 mins ago via V3 Engine')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}

