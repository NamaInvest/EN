"use client";

import React from 'react';
import { Factory, Cpu, Wrench, BarChart2, CheckCircle2, AlertTriangle, Settings, Plus, Search } from 'lucide-react';

const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');`;

export default function ManufacturingDashboard() {
 return (
 <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-6 lg:p-10 transition-colors duration-300" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
 <style dangerouslySetInnerHTML={{ __html: fontImport }} />
 
 <div className="max-w-7xl mx-auto space-y-6">
 
 {/* Header */}
 <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
 <div className="flex items-center space-x-4 space-x-reverse">
 <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
 <Factory className="w-8 h-8 text-rose-600 dark:text-rose-400" />
 </div>
 <div>
 <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">التصنيع المتقدم والإنتاج</h1>
 <p className="text-slate-500 dark:text-slate-400 mt-1">إدارة أوامر التصنيع، الآلات، والانحراف المعياري للتكاليف</p>
 </div>
 </div>
 <div className="mt-4 md:mt-0 flex gap-3">
 <button className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors font-medium cursor-pointer">
 <Settings className="w-4 h-4 ml-2" /> إعدادات الوصفات (BOM)
 </button>
 <button className="flex items-center px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors font-medium shadow-sm cursor-pointer">
 <Plus className="w-4 h-4 ml-2" /> أمر إنتاج جديد
 </button>
 </div>
 </div>

 {/* KPI Grid */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-rose-500 transition-colors">
 <div className="flex justify-between items-start">
 <div>
 <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">الكفاءة الكلية (OEE)</p>
 <h3 className="text-3xl font-bold text-slate-900 font-[Fira_Code]">86.4%</h3>
 </div>
 <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
 <BarChart2 className="w-5 h-5" />
 </div>
 </div>
 <div className="mt-4 text-xs text-emerald-600 font-bold">
 تجاوز الهدف (85%) لهذا الأسبوع
 </div>
 </div>

 <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-rose-500 transition-colors">
 <div className="flex justify-between items-start">
 <div>
 <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">أوامر تصنيع جارية</p>
 <h3 className="text-3xl font-bold text-slate-900 font-[Fira_Code]">4</h3>
 </div>
 <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg text-rose-600 dark:text-rose-400">
 <Cpu className="w-5 h-5" />
 </div>
 </div>
 <div className="mt-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-4">
 <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: '40%' }}></div>
 </div>
 <div className="mt-1 text-xs text-slate-500">استخدام 40% من الطاقة القصوى</div>
 </div>

 <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-rose-500 transition-colors">
 <div className="flex justify-between items-start">
 <div>
 <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">انحراف التكاليف</p>
 <h3 className="text-3xl font-bold text-red-600 dark:text-red-500 font-[Fira_Code]">+2.1%</h3>
 </div>
 <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
 <AlertTriangle className="w-5 h-5" />
 </div>
 </div>
 <div className="mt-4 text-xs text-red-500">
 زيادة في استهلاك مواد التغليف
 </div>
 </div>

 <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-rose-500 transition-colors">
 <div className="flex justify-between items-start">
 <div>
 <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">صيانة الآلات</p>
 <h3 className="text-3xl font-bold text-slate-900 font-[Fira_Code]">1</h3>
 </div>
 <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
 <Wrench className="w-5 h-5" />
 </div>
 </div>
 <div className="mt-4 flex items-center text-sm text-amber-600">
 <span>خط التجميع (أ) متوقف برمجياً</span>
 </div>
 </div>
 </div>

 {/* Main Content Area */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
 {/* Active Production Orders */}
 <div className="lg:col-span-2 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
 <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
 <h2 className="text-lg font-bold text-slate-900 ">أوامر الإنتاج الجارية (Live)</h2>
 <div className="relative">
 <Search className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
 <input 
 type="text" 
 placeholder="رقم الأمر أو المنتج..." 
 className="pl-4 pr-10 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-rose-500 transition-colors w-64"
 />
 </div>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-right text-sm">
 <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
 <tr>
 <th className="px-6 py-4 font-medium">رقم الأمر</th>
 <th className="px-6 py-4 font-medium">المنتج النهائي</th>
 <th className="px-6 py-4 font-medium text-center">الكمية المطلوبة</th>
 <th className="px-6 py-4 font-medium text-center">نسبة الإنجاز</th>
 <th className="px-6 py-4 font-medium">خط الإنتاج</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-[Fira_Code]">
 <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
 <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400">MO-26-1042</td>
 <td className="px-6 py-4 font-sans text-slate-900 dark:text-slate-200">طاولات مكتبية خشبية (MDF)</td>
 <td className="px-6 py-4 text-center">200 حبة</td>
 <td className="px-6 py-4">
 <div className="flex items-center justify-center space-x-2 space-x-reverse">
 <span className="font-bold text-emerald-600">75%</span>
 <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
 <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '75%' }}></div>
 </div>
 </div>
 </td>
 <td className="px-6 py-4 font-sans text-slate-500">خط التجميع 1</td>
 </tr>
 <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
 <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400">MO-26-1043</td>
 <td className="px-6 py-4 font-sans text-slate-900 dark:text-slate-200">كراسي دوارة (موديل Z)</td>
 <td className="px-6 py-4 text-center">500 حبة</td>
 <td className="px-6 py-4">
 <div className="flex items-center justify-center space-x-2 space-x-reverse">
 <span className="font-bold text-amber-500">20%</span>
 <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
 <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '20%' }}></div>
 </div>
 </div>
 </td>
 <td className="px-6 py-4 font-sans text-slate-500">خط اللحام والطلاء</td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>

 {/* Quality Control & BOM Alerts */}
 <div className="space-y-6">
 <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
 <h2 className="text-lg font-bold text-slate-900 mb-4">مراقبة الجودة (QC)</h2>
 <div className="space-y-4">
 <div className="flex justify-between items-center p-3 border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl">
 <div>
 <p className="text-sm font-bold text-slate-900 dark:text-slate-200">فحص خط التجميع 1</p>
 <p className="text-xs text-slate-500">عينات عشوائية مطابقة للمعايير</p>
 </div>
 <CheckCircle2 className="w-5 h-5 text-emerald-500" />
 </div>
 <div className="flex justify-between items-center p-3 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 rounded-xl">
 <div>
 <p className="text-sm font-bold text-slate-900 dark:text-slate-200">فحص الطلاء (خط 3)</p>
 <p className="text-xs text-slate-500">سماكة الطلاء أقل من المعيار!</p>
 </div>
 <AlertTriangle className="w-5 h-5 text-red-500" />
 </div>
 </div>
 </div>

 <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm text-white">
 <h2 className="text-lg font-bold mb-4 flex items-center">
 <Cpu className="w-5 h-5 ml-2 text-rose-400" /> نظام AI لجدولة الإنتاج
 </h2>
 <p className="text-sm text-slate-300 mb-4 leading-relaxed">
 يقترح الذكاء الاصطناعي إيقاف خط الإنتاج 3 غداً من الساعة 10 ص إلى 12 م للصيانة الوقائية لتجنب أعطال مفاجئة بناءً على قراءات الاهتزاز للمحركات.
 </p>
 <button className="w-full py-2 bg-rose-600 hover:bg-rose-700 rounded-lg font-bold text-sm transition-colors">
 اعتماد الجدولة المقترحة
 </button>
 </div>
 </div>
 </div>

 </div>
 </div>
 );
}
