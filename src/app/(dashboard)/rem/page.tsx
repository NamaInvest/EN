"use client";

import React from 'react';
import { Home, Building, Key, Users, DollarSign, TrendingUp, Search, Plus, Filter, AlertTriangle, FileText } from 'lucide-react';

const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');`;

export default function RealEstateDashboard() {
 return (
 <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-6 lg:p-10 transition-colors duration-300" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
 <style dangerouslySetInnerHTML={{ __html: fontImport }} />
 
 <div className="max-w-7xl mx-auto space-y-6">
 
 {/* Header */}
 <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
 <div className="flex items-center space-x-4 space-x-reverse">
 <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
 <Building className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
 </div>
 <div>
 <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">إدارة الأملاك والعقارات</h1>
 <p className="text-slate-500 dark:text-slate-400 mt-1">إدارة العقود، الإيجارات، والتحصيل المالي (IFRS 16)</p>
 </div>
 </div>
 <div className="mt-4 md:mt-0 flex gap-3">
 <button className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors font-medium cursor-pointer">
 <Filter className="w-4 h-4 ml-2" /> تصفية
 </button>
 <button className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium shadow-sm cursor-pointer">
 <Plus className="w-4 h-4 ml-2" /> عقد إيجار جديد
 </button>
 </div>
 </div>

 {/* KPI Grid */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors">
 <div className="flex justify-between items-start">
 <div>
 <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">نسبة الإشغال</p>
 <h3 className="text-3xl font-bold text-slate-900 font-[Fira_Code]">85%</h3>
 </div>
 <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
 <Home className="w-5 h-5" />
 </div>
 </div>
 <div className="mt-4 flex items-center text-sm text-emerald-600 dark:text-emerald-400">
 <TrendingUp className="w-4 h-4 ml-1" /> <span>+2% عن الشهر الماضي</span>
 </div>
 </div>

 <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500 transition-colors">
 <div className="flex justify-between items-start">
 <div>
 <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">التحصيل (هذا الشهر)</p>
 <h3 className="text-3xl font-bold text-slate-900 font-[Fira_Code]">452,000 ﷼</h3>
 </div>
 <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
 <DollarSign className="w-5 h-5" />
 </div>
 </div>
 <div className="mt-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-4">
 <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '75%' }}></div>
 </div>
 <div className="mt-1 text-xs text-slate-500">75% من المستهدف</div>
 </div>

 <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500 transition-colors">
 <div className="flex justify-between items-start">
 <div>
 <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">دفعات متأخرة</p>
 <h3 className="text-3xl font-bold text-red-600 dark:text-red-500 font-[Fira_Code]">12</h3>
 </div>
 <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
 <AlertTriangle className="w-5 h-5" />
 </div>
 </div>
 <div className="mt-4 flex items-center text-sm text-slate-500 dark:text-slate-400 cursor-pointer hover:text-indigo-600">
 <span>بقيمة 145,000 ﷼</span>
 </div>
 </div>

 <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500 transition-colors">
 <div className="flex justify-between items-start">
 <div>
 <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">عقود تنتهي قريباً</p>
 <h3 className="text-3xl font-bold text-slate-900 font-[Fira_Code]">8</h3>
 </div>
 <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
 <FileText className="w-5 h-5" />
 </div>
 </div>
 <div className="mt-4 flex items-center text-sm text-amber-600 dark:text-amber-500">
 <span>خلال 30 يوماً</span>
 </div>
 </div>
 </div>

 {/* Main Content Area */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
 {/* Properties List */}
 <div className="lg:col-span-2 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
 <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
 <h2 className="text-lg font-bold text-slate-900 ">الوحدات الإيجارية</h2>
 <div className="relative">
 <Search className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
 <input 
 type="text" 
 placeholder="بحث برقم الوحدة أو العميل..." 
 className="pl-4 pr-10 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition-colors w-64"
 />
 </div>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-right text-sm">
 <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
 <tr>
 <th className="px-6 py-4 font-medium">العقار / الوحدة</th>
 <th className="px-6 py-4 font-medium">المستأجر</th>
 <th className="px-6 py-4 font-medium">تاريخ النهاية</th>
 <th className="px-6 py-4 font-medium">الحالة</th>
 <th className="px-6 py-4 font-medium">القيمة السنوية</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-[Fira_Code]">
 <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
 <td className="px-6 py-4">
 <div className="font-semibold text-slate-900 dark:text-slate-200">برج النخيل التجاري</div>
 <div className="text-xs text-slate-500">مكتب 402 - الدور الرابع</div>
 </td>
 <td className="px-6 py-4 text-slate-700 dark:text-slate-300">شركة التقنية الحديثة</td>
 <td className="px-6 py-4 text-slate-700 dark:text-slate-300">2026-12-31</td>
 <td className="px-6 py-4">
 <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-xs font-medium">ساري</span>
 </td>
 <td className="px-6 py-4 text-slate-700 dark:text-slate-300">120,000 ﷼</td>
 </tr>
 <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
 <td className="px-6 py-4">
 <div className="font-semibold text-slate-900 dark:text-slate-200">مجمع الورود السكني</div>
 <div className="text-xs text-slate-500">فيلا 12</div>
 </td>
 <td className="px-6 py-4 text-slate-700 dark:text-slate-300">أحمد محمود السالم</td>
 <td className="px-6 py-4 text-red-500 font-bold">2026-05-15</td>
 <td className="px-6 py-4">
 <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-xs font-medium">ينتهي قريباً</span>
 </td>
 <td className="px-6 py-4 text-slate-700 dark:text-slate-300">85,000 ﷼</td>
 </tr>
 <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
 <td className="px-6 py-4">
 <div className="font-semibold text-slate-900 dark:text-slate-200">برج الأعمال</div>
 <div className="text-xs text-slate-500">معرض 01 - الأرضي</div>
 </td>
 <td className="px-6 py-4 text-slate-400 italic">شاغر</td>
 <td className="px-6 py-4 text-slate-400">-</td>
 <td className="px-6 py-4">
 <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 rounded text-xs font-medium">متاح للتأجير</span>
 </td>
 <td className="px-6 py-4 text-slate-700 dark:text-slate-300">250,000 ﷼</td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>

 {/* Quick Actions & Outstanding Installments */}
 <div className="space-y-6">
 <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
 <h2 className="text-lg font-bold text-slate-900 mb-4">العمليات السريعة</h2>
 <div className="grid grid-cols-2 gap-3">
 <button className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-center transition-colors cursor-pointer group">
 <Key className="w-6 h-6 mx-auto text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 mb-2" />
 <span className="text-sm font-medium text-slate-700 dark:text-slate-300">تأجير وحدة</span>
 </button>
 <button className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-center transition-colors cursor-pointer group">
 <DollarSign className="w-6 h-6 mx-auto text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 mb-2" />
 <span className="text-sm font-medium text-slate-700 dark:text-slate-300">تحصيل دفعة</span>
 </button>
 <button className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-center transition-colors cursor-pointer group">
 <Users className="w-6 h-6 mx-auto text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 mb-2" />
 <span className="text-sm font-medium text-slate-700 dark:text-slate-300">المستأجرين</span>
 </button>
 <button className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-center transition-colors cursor-pointer group">
 <Building className="w-6 h-6 mx-auto text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 mb-2" />
 <span className="text-sm font-medium text-slate-700 dark:text-slate-300">تعريف عقار</span>
 </button>
 </div>
 </div>

 <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
 <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
 دفعات مستحقة <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">عاجل</span>
 </h2>
 <div className="space-y-4">
 <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg">
 <div>
 <p className="text-sm font-bold text-slate-900 dark:text-slate-200">شركة التقنية الحديثة</p>
 <p className="text-xs text-slate-500">دفعة الربع الثاني 2026</p>
 </div>
 <div className="text-left">
 <p className="text-sm font-[Fira_Code] font-bold text-red-600">30,000 ﷼</p>
 <p className="text-xs text-red-500">متأخرة 5 أيام</p>
 </div>
 </div>
 <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg">
 <div>
 <p className="text-sm font-bold text-slate-900 dark:text-slate-200">مؤسسة الأفق</p>
 <p className="text-xs text-slate-500">الدفعة النصف سنوية</p>
 </div>
 <div className="text-left">
 <p className="text-sm font-[Fira_Code] font-bold text-amber-600">45,000 ﷼</p>
 <p className="text-xs text-amber-500">تستحق غداً</p>
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
