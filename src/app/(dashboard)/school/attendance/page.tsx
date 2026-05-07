'use client';
"use client";

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { UserCheck, Clock, UserX, AlertTriangle, Search, Filter, MessageSquare, Check, X, Plus } from 'lucide-react';

const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');`;

export default function SchoolAttendance() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
 return (
 <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-6 lg:p-10 transition-colors duration-300" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
 <style dangerouslySetInnerHTML={{ __html: fontImport }} />
 
 <div className="max-w-7xl mx-auto space-y-6">
 
 {/* Header */}
 <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
 <div className="flex items-center space-x-4 space-x-reverse">
 <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-xl">
 <UserCheck className="w-8 h-8 text-teal-600 dark:text-teal-400" />
 </div>
 <div>
 <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">سجل الحضور والغياب</h1>
 <p className="text-slate-500 dark:text-slate-400 mt-1">تتبع الحضور اليومي، التأخير، والمخالفات السلوكية للطلاب</p>
 </div>
 </div>
 <div className="mt-4 md:mt-0 flex gap-3">
 <select className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 outline-none focus:border-teal-500">
 <option>التاريخ: اليوم (03 مايو 2026)</option>
 <option>التاريخ: الأمس (02 مايو 2026)</option>
 </select>
 <select className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 outline-none focus:border-teal-500">
 <option>الفصل: الأول الثانوي (أ)</option>
 <option>الفصل: الثاني الثانوي (ب)</option>
 </select>
 </div>
 </div>

 {/* KPI Grid */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-500 transition-colors">
 <div className="flex justify-between items-start">
 <div>
 <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">الطلاب الحاضرون</p>
 <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-500 font-[Fira_Code]">23</h3>
 </div>
 <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
 <UserCheck className="w-5 h-5" />
 </div>
 </div>
 <div className="mt-4 text-xs text-slate-500">
 من إجمالي 25 طالباً
 </div>
 </div>

 <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-500 transition-colors">
 <div className="flex justify-between items-start">
 <div>
 <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">الغياب اليوم</p>
 <h3 className="text-3xl font-bold text-red-600 dark:text-red-500 font-[Fira_Code]">2</h3>
 </div>
 <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
 <UserX className="w-5 h-5" />
 </div>
 </div>
 <div className="mt-4 text-xs text-red-500 font-bold">
 يحتاج التواصل مع أولياء الأمور
 </div>
 </div>

 <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-500 transition-colors">
 <div className="flex justify-between items-start">
 <div>
 <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">التأخير الصباحي</p>
 <h3 className="text-3xl font-bold text-amber-600 dark:text-amber-500 font-[Fira_Code]">4</h3>
 </div>
 <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
 <Clock className="w-5 h-5" />
 </div>
 </div>
 <div className="mt-4 text-xs text-slate-500">
 متوسط التأخير: 15 دقيقة
 </div>
 </div>

 <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-500 transition-colors">
 <div className="flex justify-between items-start">
 <div>
 <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">مخالفات سلوكية</p>
 <h3 className="text-3xl font-bold text-slate-900 font-[Fira_Code]">1</h3>
 </div>
 <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">
 <AlertTriangle className="w-5 h-5" />
 </div>
 </div>
 <div className="mt-4 text-xs text-slate-500">
 تم توثيقها في النظام
 </div>
 </div>
 </div>

 {/* Main Content Area */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
 {/* Attendance List */}
 <div className="lg:col-span-2 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
 <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
 <h2 className="text-lg font-bold text-slate-900 ">رصد الحضور اليومي</h2>
 <div className="relative">
 <Search className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
 <input 
 type="text" 
 placeholder="بحث باسم الطالب..." 
 className="pl-4 pr-10 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-teal-500 transition-colors w-64"
 />
 </div>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-right text-sm">
 <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
 <tr>
 <th className="px-6 py-4 font-medium">اسم الطالب</th>
 <th className="px-6 py-4 font-medium">رقم الطالب</th>
 <th className="px-6 py-4 font-medium text-center">حاضر</th>
 <th className="px-6 py-4 font-medium text-center">متأخر</th>
 <th className="px-6 py-4 font-medium text-center">غائب</th>
 <th className="px-6 py-4 font-medium">ملاحظات</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-[Fira_Code]">
 <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
 <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-200">عبدالله خالد المطيري</td>
 <td className="px-6 py-4 text-slate-500">STU-10042</td>
 <td className="px-6 py-4 text-center">
 <button className="p-2 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 mx-auto transition-colors">
 <Check className="w-4 h-4" />
 </button>
 </td>
 <td className="px-6 py-4 text-center">
 <button className="p-2 rounded-full bg-slate-100 text-slate-400 hover:bg-amber-100 hover:text-amber-600 mx-auto transition-colors">
 <Clock className="w-4 h-4" />
 </button>
 </td>
 <td className="px-6 py-4 text-center">
 <button className="p-2 rounded-full bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-red-600 mx-auto transition-colors">
 <X className="w-4 h-4" />
 </button>
 </td>
 <td className="px-6 py-4"><input type="text" className="bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-teal-500 outline-none w-full" /></td>
 </tr>
 <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
 <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-200">سعود محمد العتيبي</td>
 <td className="px-6 py-4 text-slate-500">STU-10045</td>
 <td className="px-6 py-4 text-center">
 <button className="p-2 rounded-full bg-slate-100 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600 mx-auto transition-colors">
 <Check className="w-4 h-4" />
 </button>
 </td>
 <td className="px-6 py-4 text-center">
 <button className="p-2 rounded-full bg-amber-100 text-amber-600 hover:bg-amber-200 mx-auto transition-colors">
 <Clock className="w-4 h-4" />
 </button>
 </td>
 <td className="px-6 py-4 text-center">
 <button className="p-2 rounded-full bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-red-600 mx-auto transition-colors">
 <X className="w-4 h-4" />
 </button>
 </td>
 <td className="px-6 py-4 text-amber-600 text-xs">تأخير 15 دقيقة</td>
 </tr>
 <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
 <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-200">فيصل سعد السالم</td>
 <td className="px-6 py-4 text-slate-500">STU-10051</td>
 <td className="px-6 py-4 text-center">
 <button className="p-2 rounded-full bg-slate-100 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600 mx-auto transition-colors">
 <Check className="w-4 h-4" />
 </button>
 </td>
 <td className="px-6 py-4 text-center">
 <button className="p-2 rounded-full bg-slate-100 text-slate-400 hover:bg-amber-100 hover:text-amber-600 mx-auto transition-colors">
 <Clock className="w-4 h-4" />
 </button>
 </td>
 <td className="px-6 py-4 text-center">
 <button className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 mx-auto transition-colors">
 <X className="w-4 h-4" />
 </button>
 </td>
 <td className="px-6 py-4 text-red-600 text-xs">تم إرسال SMS لولي الأمر</td>
 </tr>
 </tbody>
 </table>
 </div>
 <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
 <button className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition-colors shadow-sm">
 حفظ السجل
 </button>
 </div>
 </div>

 {/* Auto-Actions & Notifications */}
 <div className="space-y-6">
 <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
 <h2 className="text-lg font-bold text-slate-900 mb-4">التواصل الآلي (الغياب)</h2>
 <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
 النظام مربوط مع بوابة الرسائل القصيرة SMS لإرسال إشعارات فورية لأولياء أمور الطلاب الغائبين.
 </p>
 <button className="w-full flex items-center justify-center p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors font-bold group">
 <MessageSquare className="w-5 h-5 ml-2" /> إرسال الإشعارات الآن (2 طالب)
 </button>
 </div>

 <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
 <h2 className="text-lg font-bold text-slate-900 mb-4">تسجيل سلوكيات</h2>
 <div className="space-y-3">
 <button className="w-full flex items-center p-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors">
 <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center ml-3">
 <Plus className="w-4 h-4" />
 </div>
 <div className="text-right">
 <p className="text-sm font-bold text-slate-900 dark:text-slate-200">سلوك إيجابي (مكافأة)</p>
 <p className="text-xs text-slate-500">إضافة نقاط إيجابية في ملف الطالب</p>
 </div>
 </button>
 <button className="w-full flex items-center p-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
 <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center ml-3">
 <AlertTriangle className="w-4 h-4" />
 </div>
 <div className="text-right">
 <p className="text-sm font-bold text-slate-900 dark:text-slate-200">سلوك سلبي (لفت نظر)</p>
 <p className="text-xs text-slate-500">توجيه إنذار أو استدعاء ولي أمر</p>
 </div>
 </button>
 </div>
 </div>
 </div>
 </div>

 </div>
 </div>
 );
}
