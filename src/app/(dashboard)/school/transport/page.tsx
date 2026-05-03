"use client";

import React from 'react';
import { Bus, MapPin, Users, AlertCircle, Search, Plus, Filter, ShieldCheck, CheckCircle2 } from 'lucide-react';

const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');`;

export default function SchoolTransport() {
 return (
 <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-6 lg:p-10 transition-colors duration-300" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
 <style dangerouslySetInnerHTML={{ __html: fontImport }} />
 
 <div className="max-w-7xl mx-auto space-y-6">
 
 {/* Header */}
 <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
 <div className="flex items-center space-x-4 space-x-reverse">
 <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
 <Bus className="w-8 h-8 text-amber-600 dark:text-amber-400" />
 </div>
 <div>
 <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">النقل المدرسي والحافلات</h1>
 <p className="text-slate-500 dark:text-slate-400 mt-1">إدارة المسارات، توزيع الطلاب، والربط مع الأسطول</p>
 </div>
 </div>
 <div className="mt-4 md:mt-0 flex gap-3">
 <button className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors font-medium cursor-pointer">
 <Filter className="w-4 h-4 ml-2" /> تصفية المسارات
 </button>
 <button className="flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-medium shadow-sm cursor-pointer">
 <Plus className="w-4 h-4 ml-2" /> مسار جديد
 </button>
 </div>
 </div>

 {/* KPI Grid */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-500 transition-colors">
 <div className="flex justify-between items-start">
 <div>
 <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">المشتركين في النقل</p>
 <h3 className="text-3xl font-bold text-slate-900 font-[Fira_Code]">485</h3>
 </div>
 <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
 <Users className="w-5 h-5" />
 </div>
 </div>
 <div className="mt-4 text-xs text-slate-500">
 38% من إجمالي الطلاب
 </div>
 </div>

 <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-500 transition-colors">
 <div className="flex justify-between items-start">
 <div>
 <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">الحافلات النشطة</p>
 <h3 className="text-3xl font-bold text-slate-900 font-[Fira_Code]">12</h3>
 </div>
 <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
 <ShieldCheck className="w-5 h-5" />
 </div>
 </div>
 <div className="mt-4 flex items-center text-sm text-emerald-600 dark:text-emerald-400">
 <CheckCircle2 className="w-4 h-4 ml-1" /> <span>جميعها مجتازة للفحص</span>
 </div>
 </div>

 <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-500 transition-colors">
 <div className="flex justify-between items-start">
 <div>
 <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">المسارات المعتمدة</p>
 <h3 className="text-3xl font-bold text-slate-900 font-[Fira_Code]">15</h3>
 </div>
 <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
 <MapPin className="w-5 h-5" />
 </div>
 </div>
 <div className="mt-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-4">
 <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '80%' }}></div>
 </div>
 <div className="mt-1 text-xs text-slate-500">معدل الإشغال 80%</div>
 </div>

 <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-500 transition-colors">
 <div className="flex justify-between items-start">
 <div>
 <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">تنبيهات الأسطول</p>
 <h3 className="text-3xl font-bold text-red-600 dark:text-red-500 font-[Fira_Code]">1</h3>
 </div>
 <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
 <AlertCircle className="w-5 h-5" />
 </div>
 </div>
 <div className="mt-4 flex items-center text-sm text-red-500 cursor-pointer hover:underline">
 <span>حافلة (رقم 4) تحتاج صيانة وقائية</span>
 </div>
 </div>
 </div>

 {/* Main Content Area */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
 {/* Routes List */}
 <div className="lg:col-span-2 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
 <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
 <h2 className="text-lg font-bold text-slate-900 ">مسارات الحافلات</h2>
 <div className="relative">
 <Search className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
 <input 
 type="text" 
 placeholder="بحث برقم المسار أو الحي..." 
 className="pl-4 pr-10 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-amber-500 transition-colors w-64"
 />
 </div>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-right text-sm">
 <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
 <tr>
 <th className="px-6 py-4 font-medium">رقم المسار</th>
 <th className="px-6 py-4 font-medium">الأحياء المخدومة</th>
 <th className="px-6 py-4 font-medium">السائق / المركبة</th>
 <th className="px-6 py-4 font-medium">الطلاب</th>
 <th className="px-6 py-4 font-medium">الحالة</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-[Fira_Code]">
 <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
 <td className="px-6 py-4">
 <div className="font-bold text-slate-900 dark:text-slate-200">R-101</div>
 <div className="text-xs text-slate-500">مسار الصباح</div>
 </td>
 <td className="px-6 py-4 text-slate-700 dark:text-slate-300">الياسمين، الملقا</td>
 <td className="px-6 py-4">
 <div className="text-slate-900 dark:text-slate-200">أحمد محمود</div>
 <div className="text-xs text-slate-500">حافلة رقم 04 (ب ط ر 112)</div>
 </td>
 <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
 <span className="font-bold text-slate-900 ">32</span> / 40
 </td>
 <td className="px-6 py-4">
 <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-xs font-medium">قيد التشغيل</span>
 </td>
 </tr>
 <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
 <td className="px-6 py-4">
 <div className="font-bold text-slate-900 dark:text-slate-200">R-102</div>
 <div className="text-xs text-slate-500">مسار الصباح</div>
 </td>
 <td className="px-6 py-4 text-slate-700 dark:text-slate-300">الصحافة، النرجس</td>
 <td className="px-6 py-4">
 <div className="text-slate-900 dark:text-slate-200">عبدالله سعد</div>
 <div className="text-xs text-slate-500">حافلة رقم 07 (س م ح 554)</div>
 </td>
 <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
 <span className="font-bold text-slate-900 ">40</span> / 40
 </td>
 <td className="px-6 py-4">
 <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">مكتمل العدد</span>
 </td>
 </tr>
 <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
 <td className="px-6 py-4">
 <div className="font-bold text-slate-900 dark:text-slate-200">R-105</div>
 <div className="text-xs text-slate-500">مسار المساء</div>
 </td>
 <td className="px-6 py-4 text-slate-700 dark:text-slate-300">حطين، العقيق</td>
 <td className="px-6 py-4">
 <div className="text-slate-900 dark:text-slate-200">غير محدد</div>
 <div className="text-xs text-red-500">يلزم تعيين سائق</div>
 </td>
 <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
 <span className="font-bold text-slate-900 ">15</span> / 40
 </td>
 <td className="px-6 py-4">
 <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-xs font-medium">مسار جديد</span>
 </td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>

 {/* Quick Actions & Sync */}
 <div className="space-y-6">
 <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
 <h2 className="text-lg font-bold text-slate-900 mb-4">ارتباطات النظام</h2>
 
 <div className="space-y-3">
 <button className="w-full flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
 <div className="flex items-center">
 <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400 ml-3">
 <Users className="w-4 h-4" />
 </div>
 <span className="text-sm font-medium text-slate-700 dark:text-slate-200">مزامنة اشتراكات الطلاب</span>
 </div>
 <CheckCircle2 className="w-4 h-4 text-emerald-500" />
 </button>
 
 <button className="w-full flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
 <div className="flex items-center">
 <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400 ml-3">
 <Bus className="w-4 h-4" />
 </div>
 <span className="text-sm font-medium text-slate-700 dark:text-slate-200">تحديث بيانات الأسطول</span>
 </div>
 <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded font-bold">جاري المزامنة...</span>
 </button>
 </div>
 </div>

 <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
 <h2 className="text-lg font-bold text-slate-900 mb-4">العمليات السريعة</h2>
 <div className="grid grid-cols-2 gap-3">
 <button className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-center transition-colors">
 <MapPin className="w-6 h-6 mx-auto text-slate-400 mb-2" />
 <span className="text-xs font-medium text-slate-700 dark:text-slate-300">رسم مسار</span>
 </button>
 <button className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-center transition-colors">
 <Users className="w-6 h-6 mx-auto text-slate-400 mb-2" />
 <span className="text-xs font-medium text-slate-700 dark:text-slate-300">توزيع الطلاب</span>
 </button>
 </div>
 </div>
 </div>
 </div>

 </div>
 </div>
 );
}
