"use client";

import React from 'react';
import { GraduationCap, Users, BookOpen, Clock, AlertCircle, CheckCircle2, Search, Plus, Calendar, UserPlus, CreditCard } from 'lucide-react';

const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');`;

export default function SchoolDashboard() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-6 lg:p-10 transition-colors duration-300" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
            <style dangerouslySetInnerHTML={{ __html: fontImport }} />
            
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                            <GraduationCap className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">نظام المدارس والمقاعد</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">إدارة شؤون الطلاب، الفصول الدراسية، والتحصيل</p>
                        </div>
                    </div>
                    <div className="mt-4 md:mt-0 flex gap-3">
                        <button className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors font-medium cursor-pointer">
                            <Calendar className="w-4 h-4 ml-2" /> العام الأكاديمي
                        </button>
                        <button className="flex items-center px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors font-medium shadow-sm cursor-pointer">
                            <UserPlus className="w-4 h-4 ml-2" /> تسجيل طالب
                        </button>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-violet-500 dark:hover:border-violet-500 transition-colors">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">الطلاب المسجلين</p>
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">1,248</h3>
                            </div>
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-4 h-4 ml-1" /> <span>مكتمل التسجيل</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-violet-500 transition-colors">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">إشغال المقاعد</p>
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">92%</h3>
                            </div>
                            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg text-violet-600 dark:text-violet-400">
                                <BookOpen className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-4">
                            <div className="bg-violet-500 h-1.5 rounded-full" style={{ width: '92%' }}></div>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">105 مقعد شاغر فقط</div>
                    </div>

                    <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-violet-500 transition-colors">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">نسبة الحضور اليوم</p>
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">96.5%</h3>
                            </div>
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                                <Clock className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-slate-500 dark:text-slate-400 cursor-pointer hover:text-indigo-600">
                            <span>42 غياب مسجل</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-violet-500 transition-colors">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">رسوم متأخرة</p>
                                <h3 className="text-3xl font-bold text-red-600 dark:text-red-500 font-[Fira_Code]">84</h3>
                            </div>
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-red-500">
                            <span>طالب لم يسدد القسط الثاني</span>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Classes & Seats List */}
                    <div className="lg:col-span-2 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">الفصول والمقاعد المتاحة</h2>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="بحث بالفصل أو المرحلة..." 
                                    className="pl-4 pr-10 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-violet-500 transition-colors dark:text-white w-64"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">المرحلة / الفصل</th>
                                        <th className="px-6 py-4 font-medium">المعلم المشرف</th>
                                        <th className="px-6 py-4 font-medium">الطاقة الاستيعابية</th>
                                        <th className="px-6 py-4 font-medium">المقاعد الشاغرة</th>
                                        <th className="px-6 py-4 font-medium">الحالة</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-[Fira_Code]">
                                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900 dark:text-slate-200">الأول الابتدائي (أ)</div>
                                            <div className="text-xs text-slate-500">مسار عام</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">أ. خالد عبدالرحمن</td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">25 مقعد</td>
                                        <td className="px-6 py-4 text-red-500 font-bold">0</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 rounded text-xs font-medium">مكتمل</span>
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900 dark:text-slate-200">الثاني المتوسط (ج)</div>
                                            <div className="text-xs text-slate-500">مسار دولي</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">أ. جون سميث</td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">20 مقعد</td>
                                        <td className="px-6 py-4 text-emerald-600 font-bold">4</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-xs font-medium">متاح</span>
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900 dark:text-slate-200">الثالث الثانوي (علوم)</div>
                                            <div className="text-xs text-slate-500">مسار علمي</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">أ. محمد العتيبي</td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">30 مقعد</td>
                                        <td className="px-6 py-4 text-amber-600 font-bold">2</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-xs font-medium">محدود</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Quick Actions & Outstanding Fees */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">العمليات السريعة</h2>
                            <div className="grid grid-cols-2 gap-3">
                                <button className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-violet-500 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 text-center transition-colors cursor-pointer group">
                                    <UserPlus className="w-6 h-6 mx-auto text-slate-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 mb-2" />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">قبول طالب</span>
                                </button>
                                <button className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-violet-500 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 text-center transition-colors cursor-pointer group">
                                    <CreditCard className="w-6 h-6 mx-auto text-slate-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 mb-2" />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">سداد رسوم</span>
                                </button>
                                <button className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-violet-500 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 text-center transition-colors cursor-pointer group">
                                    <Clock className="w-6 h-6 mx-auto text-slate-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 mb-2" />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">تسجيل غياب</span>
                                </button>
                                <button className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-violet-500 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 text-center transition-colors cursor-pointer group">
                                    <BookOpen className="w-6 h-6 mx-auto text-slate-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 mb-2" />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">توزيع الفصول</span>
                                </button>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                                طلبات التحاق قيد المراجعة
                            </h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-lg">
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-slate-200">سعود بن عبدالله</p>
                                        <p className="text-xs text-slate-500">الأول الابتدائي</p>
                                    </div>
                                    <div className="flex space-x-2 space-x-reverse">
                                        <button className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold hover:bg-emerald-200">قبول</button>
                                        <button className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-bold hover:bg-red-200">رفض</button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-lg">
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-slate-200">عمر الفهد</p>
                                        <p className="text-xs text-slate-500">الثالث المتوسط</p>
                                    </div>
                                    <div className="flex space-x-2 space-x-reverse">
                                        <button className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold hover:bg-emerald-200">قبول</button>
                                        <button className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-bold hover:bg-red-200">رفض</button>
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
