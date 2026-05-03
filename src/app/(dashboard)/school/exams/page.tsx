"use client";

import React from 'react';
import { Award, FileText, BarChart3, Settings, Search, Filter, Download, Plus, Star } from 'lucide-react';

const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');`;

export default function SchoolExams() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-6 lg:p-10 transition-colors duration-300" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
            <style dangerouslySetInnerHTML={{ __html: fontImport }} />
            
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                            <Award className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">الاختبارات والنتائج</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">إدارة درجات الطلاب، التقارير الأكاديمية، وإصدار الشهادات</p>
                        </div>
                    </div>
                    <div className="mt-4 md:mt-0 flex gap-3">
                        <button className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors font-medium cursor-pointer">
                            <Settings className="w-4 h-4 ml-2" /> إعدادات التقييم
                        </button>
                        <button className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium shadow-sm cursor-pointer">
                            <Plus className="w-4 h-4 ml-2" /> إعداد اختبار جديد
                        </button>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500 transition-colors">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">نسبة النجاح العامة</p>
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">94.2%</h3>
                            </div>
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                                <BarChart3 className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-emerald-600 dark:text-emerald-400">
                            <span>الفصل الدراسي الأول</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500 transition-colors">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">شهادات جاهزة للطباعة</p>
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">245</h3>
                            </div>
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                <FileText className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-4">
                            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">تم رصد درجات الصف السادس</div>
                    </div>

                    <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500 transition-colors">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">درجات غير مكتملة</p>
                                <h3 className="text-3xl font-bold text-amber-600 dark:text-amber-500 font-[Fira_Code]">2</h3>
                            </div>
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                                <Search className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-amber-600">
                            مادة العلوم (الأول المتوسط) بانتظار الاعتماد
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500 transition-colors">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">الطلاب المتفوقين</p>
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">54</h3>
                            </div>
                            <div className="p-2 bg-fuchsia-100 dark:bg-fuchsia-900/30 rounded-lg text-fuchsia-600 dark:text-fuchsia-400">
                                <Star className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-slate-500">
                            تقدير (ممتاز - 95% فما فوق)
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Grade Entry Table */}
                    <div className="lg:col-span-2 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">رصد الدرجات</h2>
                                <p className="text-xs text-slate-500">الفصل: الأول الثانوي (أ) | المادة: رياضيات | الفصل الدراسي: الأول</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    <Filter className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                </button>
                                <button className="px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-400">
                                    اعتماد وإقفال الرصد
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">اسم الطالب</th>
                                        <th className="px-6 py-4 font-medium text-center">المشاركة (10)</th>
                                        <th className="px-6 py-4 font-medium text-center">الواجبات (10)</th>
                                        <th className="px-6 py-4 font-medium text-center">اختبار قصير (20)</th>
                                        <th className="px-6 py-4 font-medium text-center">اختبار نهائي (60)</th>
                                        <th className="px-6 py-4 font-medium text-center">المجموع (100)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-[Fira_Code]">
                                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-200 font-sans">عبدالله خالد المطيري</td>
                                        <td className="px-6 py-2 text-center"><input type="number" defaultValue="10" className="w-16 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md py-1 focus:outline-none focus:border-indigo-500" /></td>
                                        <td className="px-6 py-2 text-center"><input type="number" defaultValue="9" className="w-16 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md py-1 focus:outline-none focus:border-indigo-500" /></td>
                                        <td className="px-6 py-2 text-center"><input type="number" defaultValue="18" className="w-16 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md py-1 focus:outline-none focus:border-indigo-500" /></td>
                                        <td className="px-6 py-2 text-center"><input type="number" defaultValue="55" className="w-16 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md py-1 focus:outline-none focus:border-indigo-500" /></td>
                                        <td className="px-6 py-4 text-center font-bold text-emerald-600">92</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-200 font-sans">سعود محمد العتيبي</td>
                                        <td className="px-6 py-2 text-center"><input type="number" defaultValue="8" className="w-16 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md py-1 focus:outline-none focus:border-indigo-500" /></td>
                                        <td className="px-6 py-2 text-center"><input type="number" defaultValue="7" className="w-16 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md py-1 focus:outline-none focus:border-indigo-500" /></td>
                                        <td className="px-6 py-2 text-center"><input type="number" defaultValue="15" className="w-16 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md py-1 focus:outline-none focus:border-indigo-500" /></td>
                                        <td className="px-6 py-2 text-center"><input type="number" defaultValue="" placeholder="--" className="w-16 text-center bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-800 rounded-md py-1 focus:outline-none focus:border-indigo-500" /></td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-400">30</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Quick Actions & Downloads */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">إصدار التقارير والشهادات</h2>
                            <div className="space-y-3">
                                <button className="w-full flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400 ml-3">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">طباعة إشعارات الدرجات (PDF)</span>
                                    </div>
                                    <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                                </button>
                                
                                <button className="w-full flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400 ml-3">
                                            <Award className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">اعتماد وإصدار الشهادات النهائية</span>
                                    </div>
                                    <ChevronLeft className="w-4 h-4 text-slate-400" />
                                </button>
                                
                                <button className="w-full flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400 ml-3">
                                            <BarChart3 className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">تحليل المنحنى (Grade Curve)</span>
                                    </div>
                                    <ChevronLeft className="w-4 h-4 text-slate-400" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

// Inline helper for missing icon above
function ChevronLeft(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
}
