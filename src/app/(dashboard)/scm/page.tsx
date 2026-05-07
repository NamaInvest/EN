import { _t } from '@/lib/server-t';
'use client';
"use client";

import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { PackageSearch, TrendingUp, Truck, MapPin, AlertCircle, RefreshCcw, Box, ArrowRightLeft, Settings, Search, Plus } from 'lucide-react';

const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');`;

export default function SCMDashboard() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
 return (
 <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-6 lg:p-10 transition-colors duration-300" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
 <style dangerouslySetInnerHTML={{ __html: fontImport }} />
 
 <div className="max-w-7xl mx-auto space-y-6">
 
 {/* Header */}
 <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
 <div className="flex items-center space-x-4 space-x-reverse">
 <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
 <ArrowRightLeft className="w-8 h-8 text-blue-600 dark:text-blue-400" />
 </div>
 <div>
 <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">إدارة سلاسل الإمداد (SCM)</h1>
 <p className="text-slate-500 dark:text-slate-400 mt-1">المشتريات، المستودعات، وتحليلات التوريد الاستراتيجية</p>
 </div>
 </div>
 <div className="mt-4 md:mt-0 flex gap-3">
 <button className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors font-medium cursor-pointer">
 <Settings className="w-4 h-4 ml-2" /> إعدادات التوريد
 </button>
 <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm cursor-pointer">
 <Plus className="w-4 h-4 ml-2" /> أمر شراء جديد
 </button>
 </div>
 </div>

 {/* KPI Grid */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500 transition-colors">
 <div className="flex justify-between items-start">
 <div>
 <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">معدل دوران المخزون</p>
 <h3 className="text-3xl font-bold text-slate-900 font-[Fira_Code]">4.2x</h3>
 </div>
 <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
 <RefreshCcw className="w-5 h-5" />
 </div>
 </div>
 <div className="mt-4 flex items-center text-sm text-emerald-600 dark:text-emerald-400">
 <TrendingUp className="w-4 h-4 ml-1" /> <span>تحسن بنسبة 12%</span>
 </div>
 </div>

 <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500 transition-colors">
 <div className="flex justify-between items-start">
 <div>
 <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">قيمة المخزون الإجمالي</p>
 <h3 className="text-3xl font-bold text-slate-900 font-[Fira_Code]">8.4M ﷼</h3>
 </div>
 <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
 <Box className="w-5 h-5" />
 </div>
 </div>
 <div className="mt-4 flex items-center text-sm text-slate-500 dark:text-slate-400">
 <span>موزع على 4 مستودعات رئيسية</span>
 </div>
 </div>

 <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500 transition-colors">
 <div className="flex justify-between items-start">
 <div>
 <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">أوامر شراء معلقة</p>
 <h3 className="text-3xl font-bold text-slate-900 font-[Fira_Code]">14</h3>
 </div>
 <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
 <Truck className="w-5 h-5" />
 </div>
 </div>
 <div className="mt-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-4">
 <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
 </div>
 <div className="mt-1 text-xs text-amber-600">6 شحنات متأخرة عن الموعد</div>
 </div>

 <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500 transition-colors">
 <div className="flex justify-between items-start">
 <div>
 <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">نواقص المخزون</p>
 <h3 className="text-3xl font-bold text-red-600 dark:text-red-500 font-[Fira_Code]">8</h3>
 </div>
 <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
 <AlertCircle className="w-5 h-5" />
 </div>
 </div>
 <div className="mt-4 flex items-center text-sm text-red-500 cursor-pointer hover:underline">
 <span>أصناف وصلت للحد الأدنى (Reorder Point)</span>
 </div>
 </div>
 </div>

 {/* Main Content Area */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
 {/* Reorder Alerts */}
 <div className="lg:col-span-2 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
 <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
 <h2 className="text-lg font-bold text-slate-900 flex items-center">
 <PackageSearch className="w-5 h-5 ml-2 text-slate-400" /> تنبيهات إعادة الطلب التلقائية
 </h2>
 <button className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-bold transition-colors dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
 توليد أوامر شراء آلية
 </button>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-right text-sm">
 <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
 <tr>
 <th className="px-6 py-4 font-medium">رمز/اسم الصنف</th>
 <th className="px-6 py-4 font-medium">المورد الافتراضي</th>
 <th className="px-6 py-4 font-medium text-center">الرصيد المتاح</th>
 <th className="px-6 py-4 font-medium text-center">حد إعادة الطلب</th>
 <th className="px-6 py-4 font-medium text-center">الكمية المقترحة</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-[Fira_Code]">
 <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
 <td className="px-6 py-4">
 <div className="font-bold text-slate-900 dark:text-slate-200 font-sans">محركات ديزل 200HP</div>
 <div className="text-xs text-slate-500">{_t('ITM-4092', 'ITM-4092')}</div>
 </td>
 <td className="px-6 py-4 font-sans text-slate-700 dark:text-slate-300">مصنع رواد الميكانيكا</td>
 <td className="px-6 py-4 text-center text-red-500 font-bold">12</td>
 <td className="px-6 py-4 text-center text-slate-500">20</td>
 <td className="px-6 py-4 text-center font-bold text-blue-600">50</td>
 </tr>
 <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
 <td className="px-6 py-4">
 <div className="font-bold text-slate-900 dark:text-slate-200 font-sans">أسلاك نحاسية معزولة (لفة)</div>
 <div className="text-xs text-slate-500">{_t('ITM-1021', 'ITM-1021')}</div>
 </td>
 <td className="px-6 py-4 font-sans text-slate-700 dark:text-slate-300">شركة الكابلات المتقدمة</td>
 <td className="px-6 py-4 text-center text-red-500 font-bold">45</td>
 <td className="px-6 py-4 text-center text-slate-500">100</td>
 <td className="px-6 py-4 text-center font-bold text-blue-600">200</td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>

 {/* Quick Tracking */}
 <div className="space-y-6">
 <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
 <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
 <Truck className="w-5 h-5 ml-2 text-slate-400" /> شحنات قيد الوصول
 </h2>
 <div className="space-y-4">
 <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-lg">
 <div className="flex justify-between items-start mb-2">
 <div>
 <p className="text-sm font-bold text-slate-900 dark:text-slate-200">أمر شراء: PO-2026-892</p>
 <p className="text-xs text-slate-500 mt-1">المورد: شركة الحديد والصلب</p>
 </div>
 <span className="text-xs font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-md">في الجمارك</span>
 </div>
 <div className="flex items-center text-xs text-slate-500 mt-3 border-t border-slate-200 dark:border-slate-700 pt-2">
 <MapPin className="w-3 h-3 ml-1" /> ميناء جدة الإسلامي - متوقع غداً
 </div>
 </div>
 
 <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-lg">
 <div className="flex justify-between items-start mb-2">
 <div>
 <p className="text-sm font-bold text-slate-900 dark:text-slate-200">أمر نقل مخزني: TR-442</p>
 <p className="text-xs text-slate-500 mt-1">من: المستودع المركزي (الرياض)</p>
 </div>
 <span className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded-md">في الطريق</span>
 </div>
 <div className="flex items-center text-xs text-slate-500 mt-3 border-t border-slate-200 dark:border-slate-700 pt-2">
 <MapPin className="w-3 h-3 ml-1" /> على بعد 45 كم من فرع الدمام
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>

 </div>
 </div>
 );
}
