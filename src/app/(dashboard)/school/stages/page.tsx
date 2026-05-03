"use client";

import React from 'react';
import { Layers, BookOpen, GraduationCap, Users, Settings, Plus, Search, MoreVertical, Edit2, Trash2 } from 'lucide-react';

const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');`;

export default function SchoolStages() {
 return (
 <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-6 lg:p-10 transition-colors duration-300" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
 <style dangerouslySetInnerHTML={{ __html: fontImport }} />
 
 <div className="max-w-7xl mx-auto space-y-6">
 
 {/* Header */}
 <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
 <div className="flex items-center space-x-4 space-x-reverse">
 <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-xl">
 <Layers className="w-8 h-8 text-pink-600 dark:text-pink-400" />
 </div>
 <div>
 <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">المراحل والصفوف الدراسية</h1>
 <p className="text-slate-500 dark:text-slate-400 mt-1">الهيكل الأكاديمي، الرسوم الدراسية المربوطة، والمقاعد</p>
 </div>
 </div>
 <div className="mt-4 md:mt-0 flex gap-3">
 <button className="flex items-center px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors font-medium shadow-sm cursor-pointer">
 <Plus className="w-4 h-4 ml-2" /> مرحلة جديدة
 </button>
 </div>
 </div>

 {/* Main Content */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 
 {/* List of Stages */}
 <div className="lg:col-span-2 space-y-6">
 
 {/* Stage 1 */}
 <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:border-pink-500 transition-colors">
 <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
 <div className="flex items-center space-x-3 space-x-reverse">
 <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
 <BookOpen className="w-5 h-5" />
 </div>
 <div>
 <h2 className="text-lg font-bold text-slate-900 ">المرحلة الابتدائية</h2>
 <p className="text-sm text-slate-500 dark:text-slate-400">الصفوف: 1 إلى 6 | الرسوم الأساسية: 12,000 ﷼</p>
 </div>
 </div>
 <div className="flex space-x-2 space-x-reverse">
 <button className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"><Edit2 className="w-4 h-4" /></button>
 </div>
 </div>
 <div className="p-5">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
 <div>
 <p className="font-bold text-slate-900 dark:text-slate-200">الصف الأول (أ, ب, ج)</p>
 <p className="text-xs text-slate-500">75 طالب / 3 فصول</p>
 </div>
 <ChevronRight className="w-4 h-4 text-slate-400" />
 </div>
 <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
 <div>
 <p className="font-bold text-slate-900 dark:text-slate-200">الصف الثاني (أ, ب)</p>
 <p className="text-xs text-slate-500">48 طالب / 2 فصول</p>
 </div>
 <ChevronRight className="w-4 h-4 text-slate-400" />
 </div>
 </div>
 </div>
 </div>

 {/* Stage 2 */}
 <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:border-pink-500 transition-colors">
 <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
 <div className="flex items-center space-x-3 space-x-reverse">
 <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
 <Users className="w-5 h-5" />
 </div>
 <div>
 <h2 className="text-lg font-bold text-slate-900 ">المرحلة المتوسطة</h2>
 <p className="text-sm text-slate-500 dark:text-slate-400">الصفوف: 1 إلى 3 | الرسوم الأساسية: 15,000 ﷼</p>
 </div>
 </div>
 <div className="flex space-x-2 space-x-reverse">
 <button className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"><Edit2 className="w-4 h-4" /></button>
 </div>
 </div>
 <div className="p-5">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
 <div>
 <p className="font-bold text-slate-900 dark:text-slate-200">الأول المتوسط (عام)</p>
 <p className="text-xs text-slate-500">60 طالب / 3 فصول</p>
 </div>
 <ChevronRight className="w-4 h-4 text-slate-400" />
 </div>
 <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
 <div>
 <p className="font-bold text-slate-900 dark:text-slate-200">الثاني المتوسط (عام)</p>
 <p className="text-xs text-slate-500">55 طالب / 2 فصول</p>
 </div>
 <ChevronRight className="w-4 h-4 text-slate-400" />
 </div>
 </div>
 </div>
 </div>

 {/* Stage 3 */}
 <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:border-pink-500 transition-colors">
 <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
 <div className="flex items-center space-x-3 space-x-reverse">
 <div className="p-2 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-lg">
 <GraduationCap className="w-5 h-5" />
 </div>
 <div>
 <h2 className="text-lg font-bold text-slate-900 ">المرحلة الثانوية (المسارات)</h2>
 <p className="text-sm text-slate-500 dark:text-slate-400">الصفوف: 1 إلى 3 | الرسوم الأساسية: 18,000 ﷼</p>
 </div>
 </div>
 <div className="flex space-x-2 space-x-reverse">
 <button className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"><Edit2 className="w-4 h-4" /></button>
 </div>
 </div>
 <div className="p-5">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border-l-4 border-l-emerald-500">
 <div>
 <p className="font-bold text-slate-900 dark:text-slate-200">مسار الصحة والحياة</p>
 <p className="text-xs text-slate-500">الرسوم الإضافية: 2,000 ﷼ (معامل)</p>
 </div>
 <ChevronRight className="w-4 h-4 text-slate-400" />
 </div>
 <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border-l-4 border-l-blue-500">
 <div>
 <p className="font-bold text-slate-900 dark:text-slate-200">مسار علوم الحاسب والهندسة</p>
 <p className="text-xs text-slate-500">الرسوم الإضافية: 3,500 ﷼ (مختبرات)</p>
 </div>
 <ChevronRight className="w-4 h-4 text-slate-400" />
 </div>
 </div>
 </div>
 </div>

 </div>

 {/* Quick Stats Sidebar */}
 <div className="space-y-6">
 <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
 <h2 className="text-lg font-bold text-slate-900 mb-6">إحصائيات هيكل المدرسة</h2>
 
 <div className="space-y-5">
 <div>
 <div className="flex justify-between text-sm mb-2">
 <span className="text-slate-500 dark:text-slate-400">المرحلة الابتدائية</span>
 <span className="font-bold text-slate-900 ">45%</span>
 </div>
 <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
 <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '45%' }}></div>
 </div>
 </div>
 <div>
 <div className="flex justify-between text-sm mb-2">
 <span className="text-slate-500 dark:text-slate-400">المرحلة المتوسطة</span>
 <span className="font-bold text-slate-900 ">35%</span>
 </div>
 <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
 <div className="bg-blue-500 h-2 rounded-full" style={{ width: '35%' }}></div>
 </div>
 </div>
 <div>
 <div className="flex justify-between text-sm mb-2">
 <span className="text-slate-500 dark:text-slate-400">المرحلة الثانوية</span>
 <span className="font-bold text-slate-900 ">20%</span>
 </div>
 <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
 <div className="bg-violet-500 h-2 rounded-full" style={{ width: '20%' }}></div>
 </div>
 </div>
 </div>

 <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
 <div className="grid grid-cols-2 gap-4 text-center">
 <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
 <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">إجمالي الفصول</p>
 <p className="text-2xl font-bold font-[Fira_Code] text-slate-900 ">48</p>
 </div>
 <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
 <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">متوسط الكثافة</p>
 <p className="text-2xl font-bold font-[Fira_Code] text-slate-900 ">26</p>
 </div>
 </div>
 </div>
 </div>

 <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
 <Settings className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
 <h3 className="font-bold text-slate-900 mb-2">إعدادات الرسوم والضرائب</h3>
 <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
 يمكنك ربط كل مرحلة ببنود حسابية وضرائبية مختلفة (معفي، خاضع للنسبة الأساسية) لدعم الفوترة الآلية لزاتكا.
 </p>
 <button className="text-pink-600 hover:text-pink-700 font-bold text-sm">
 إدارة بنود الرسوم ←
 </button>
 </div>
 </div>

 </div>
 </div>
 </div>
 );
}
