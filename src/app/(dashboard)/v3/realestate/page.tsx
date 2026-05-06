'use client';
import React from 'react';
import { Building, TrendingUp, Activity, BarChart, Settings, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function RealEstatePropertyDashboard() {
    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6" dir="rtl">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl border shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Building className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">العقارات والأملاك V3</h1>
                        <p className="text-slate-500 mt-1">إدارة الوحدات، عقود الإيجار، تتبع الشيكات الآجلة، IFRS 16</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="flex gap-2"><Download className="w-4 h-4"/> تصدير التقرير</Button>
                    <Button className="flex gap-2"><Settings className="w-4 h-4"/> إعدادات الموديول</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-5 border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow">
                    <p className="text-sm font-medium text-slate-500">نسبة الإشغال</p>
                    <h3 className="text-2xl font-bold mt-2 text-slate-800">450,200 ر.س</h3>
                    <div className="mt-2 flex items-center text-xs text-emerald-600 font-medium">
                        <TrendingUp className="w-3 h-3 ml-1" /> +4.2% عن الشهر الماضي
                    </div>
                </Card>
                <Card className="p-5 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
                    <p className="text-sm font-medium text-slate-500">العائد الإيجاري</p>
                    <h3 className="text-2xl font-bold mt-2 text-slate-800">84.5%</h3>
                    <div className="mt-2 flex items-center text-xs text-emerald-600 font-medium">
                        <TrendingUp className="w-3 h-3 ml-1" /> +4.2% عن الشهر الماضي
                    </div>
                </Card>
                <Card className="p-5 border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow">
                    <p className="text-sm font-medium text-slate-500">تكلفة الصيانة/م²</p>
                    <h3 className="text-2xl font-bold mt-2 text-slate-800">1,204</h3>
                    <div className="mt-2 flex items-center text-xs text-emerald-600 font-medium">
                        <TrendingUp className="w-3 h-3 ml-1" /> +4.2% عن الشهر الماضي
                    </div>
                </Card>
                <Card className="p-5 border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
                    <p className="text-sm font-medium text-slate-500">متأخرات الإيجار</p>
                    <h3 className="text-2xl font-bold mt-2 text-slate-800">15%</h3>
                    <div className="mt-2 flex items-center text-xs text-emerald-600 font-medium">
                        <TrendingUp className="w-3 h-3 ml-1" /> +4.2% عن الشهر الماضي
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="col-span-2 p-6 h-96 flex flex-col items-center justify-center border-dashed bg-slate-50">
                    <BarChart className="w-16 h-16 text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-600">تحليلات العمليات الأساسية</h3>
                    <p className="text-sm text-slate-500 text-center max-w-sm mt-2">
                        ستُعرض المخططات التشغيلية هنا اعتماداً على V3 EventBus حسب احتياجات قطاع العقارات والأملاك.
                    </p>
                </Card>

                <Card className="p-6 h-96 flex flex-col items-start justify-start">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-blue-500"/> سجل النشاط المباشر
                    </h3>
                    <div className="space-y-4 w-full">
                        {[1,2,3,4,5].map(n => (
                            <div key={n} className="flex gap-3 text-sm border-b pb-3 last:border-0">
                                <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500"></div>
                                <div>
                                    <p className="font-medium text-slate-700">حدث النظام #{Math.floor(Math.random()*1000)}</p>
                                    <p className="text-slate-500 text-xs mt-0.5">معالجة منذ دقيقتين عبر محرك V3</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
