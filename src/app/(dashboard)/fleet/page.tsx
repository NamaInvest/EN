"use client";

import React, { useState } from 'react';
import { Truck, Navigation, Fuel, AlertCircle, TrendingUp, Settings, Activity, Calendar, Wrench, Search, Plus } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

// Typography for Data-Dense Dashboard
const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');`;

export default function FleetDashboard() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-6 lg:p-10 transition-colors duration-300" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
            <style dangerouslySetInnerHTML={{ __html: fontImport }} />
            
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="p-3 bg-indigo-100 dark:bg-slate-800 rounded-xl">
                            <Truck className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">إدارة الأسطول والمركبات</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">نظام تتبع وحوسبة تكاليف النقل التشغيلية</p>
                        </div>
                    </div>
                    <div className="mt-4 md:mt-0 flex gap-3">
                        <button className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors font-medium cursor-pointer">
                            <Settings className="w-4 h-4 ml-2" /> إعدادات
                        </button>
                        <button className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium shadow-sm cursor-pointer">
                            <Plus className="w-4 h-4 ml-2" /> مركبة جديدة
                        </button>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">المركبات النشطة</p>
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">42/45</h3>
                            </div>
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                                <Activity className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-emerald-600 dark:text-emerald-400">
                            <TrendingUp className="w-4 h-4 ml-1" /> <span>3 رحلات جارية الآن</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500 transition-colors">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">استهلاك الوقود (الشهر)</p>
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">12,450 ﷼</h3>
                            </div>
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                                <Fuel className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-red-500">
                            <AlertCircle className="w-4 h-4 ml-1" /> <span>انحراف 15% عن المعيار</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500 transition-colors">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">مسافات الرحلات</p>
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">8,240 كم</h3>
                            </div>
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                <Navigation className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-slate-500 dark:text-slate-400">
                            <span>معدل 183 كم / للمركبة</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500 transition-colors">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">تنبيهات الصيانة</p>
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">3 مركبات</h3>
                            </div>
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                                <Wrench className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-red-500 cursor-pointer hover:underline">
                            <span>صيانة دورية مستحقة</span>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Fleet List (Data Dense) */}
                    <div className="lg:col-span-2 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">حالة المركبات المباشرة</h2>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="بحث برقم اللوحة..." 
                                    className="pl-4 pr-10 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-colors dark:text-white w-64"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">المركبة</th>
                                        <th className="px-6 py-4 font-medium">اللوحة</th>
                                        <th className="px-6 py-4 font-medium">السائق</th>
                                        <th className="px-6 py-4 font-medium">الحالة</th>
                                        <th className="px-6 py-4 font-medium">قراءة العداد</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-[Fira_Code]">
                                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900 dark:text-slate-200">Isuzu D-MAX 2023</div>
                                            <div className="text-xs text-slate-500">نقل ثقيل</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">أ ب ج 1234</td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">محمد عبدالله</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-xs font-medium">متاحة</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">12,450 كم</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900 dark:text-slate-200">Toyota Hilux 2022</div>
                                            <div className="text-xs text-slate-500">نقل خفيف</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">ح س ن 8821</td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">سعد فهد</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">في رحلة</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">45,120 كم</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900 dark:text-slate-200">Mercedes Actros</div>
                                            <div className="text-xs text-slate-500">شاحنة</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">ط ي ر 9999</td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">غير محدد</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs font-medium">صيانة</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">182,000 كم</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Quick Actions & Recent Trips */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">إجراءات سريعة</h2>
                            <div className="grid grid-cols-2 gap-3">
                                <button className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-center transition-colors cursor-pointer group">
                                    <Fuel className="w-6 h-6 mx-auto text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 mb-2" />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">سند تعبئة وقود</span>
                                </button>
                                <button className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-center transition-colors cursor-pointer group">
                                    <Navigation className="w-6 h-6 mx-auto text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 mb-2" />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">أمر تشغيل رحلة</span>
                                </button>
                                <button className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-center transition-colors cursor-pointer group">
                                    <Wrench className="w-6 h-6 mx-auto text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 mb-2" />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">طلب صيانة</span>
                                </button>
                                <button className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-center transition-colors cursor-pointer group">
                                    <Calendar className="w-6 h-6 mx-auto text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 mb-2" />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">تجديد الاستمارات</span>
                                </button>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">آخر الرحلات المنفذة</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <div className="flex items-center space-x-3 space-x-reverse">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-200">TRP-2023-091</p>
                                            <p className="text-xs text-slate-500">الرياض ➔ الدمام</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-[Fira_Code] text-slate-500">منذ ساعتين</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <div className="flex items-center space-x-3 space-x-reverse">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-200">TRP-2023-090</p>
                                            <p className="text-xs text-slate-500">جدة ➔ مكة</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-[Fira_Code] text-slate-500">منذ 5 ساعات</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
