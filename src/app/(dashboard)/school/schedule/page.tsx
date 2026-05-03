"use client";

import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, BookOpen, Users, ChevronRight, ChevronLeft, Plus, Filter, MoreVertical } from 'lucide-react';

const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');`;

export default function SchoolSchedule() {
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    const periods = [
        { id: 1, time: '07:30 - 08:15' },
        { id: 2, time: '08:15 - 09:00' },
        { id: 3, time: '09:00 - 09:45' },
        { id: 'break', time: '09:45 - 10:15', label: 'فسحة' },
        { id: 4, time: '10:15 - 11:00' },
        { id: 5, time: '11:00 - 11:45' },
        { id: 6, time: '11:45 - 12:30' },
        { id: 7, time: '12:30 - 01:15' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-6 lg:p-10 transition-colors duration-300" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
            <style dangerouslySetInnerHTML={{ __html: fontImport }} />
            
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="p-3 bg-fuchsia-100 dark:bg-fuchsia-900/30 rounded-xl">
                            <CalendarIcon className="w-8 h-8 text-fuchsia-600 dark:text-fuchsia-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">الجدول الدراسي (الحصص)</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">إدارة توزيع الحصص، المعلمين، والقاعات</p>
                        </div>
                    </div>
                    <div className="mt-4 md:mt-0 flex gap-3">
                        <select className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 outline-none focus:border-fuchsia-500">
                            <option>الفصل: الأول الثانوي (أ)</option>
                            <option>الفصل: الثاني الثانوي (ب)</option>
                            <option>الفصل: الثالث الثانوي (ج)</option>
                        </select>
                        <button className="flex items-center px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-lg transition-colors font-medium shadow-sm cursor-pointer">
                            <Plus className="w-4 h-4 ml-2" /> تخصيص حصة
                        </button>
                    </div>
                </div>

                {/* Main Schedule Grid */}
                <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                            </button>
                            <span className="font-bold text-slate-900 dark:text-white px-2">الأسبوع الحالي</span>
                            <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                            </button>
                        </div>
                        <div className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400">
                            <Filter className="w-4 h-4 ml-2" /> عرض حسب: الفصل
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm border-collapse">
                            <thead>
                                <tr>
                                    <th className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 p-4 font-bold text-slate-700 dark:text-slate-300 w-24 text-center">اليوم</th>
                                    {periods.map((p, i) => (
                                        <th key={i} className={`border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 p-3 text-center ${p.id === 'break' ? 'w-16' : 'min-w-[140px]'}`}>
                                            {p.id !== 'break' && <div className="font-bold text-slate-900 dark:text-slate-100">الحصة {p.id}</div>}
                                            <div className="text-xs text-slate-500 dark:text-slate-400 font-[Fira_Code] mt-1">{p.time}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {days.map((day, dayIdx) => (
                                    <tr key={dayIdx}>
                                        <td className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 font-bold text-slate-900 dark:text-slate-200 text-center">
                                            {day}
                                        </td>
                                        {periods.map((p, pIdx) => {
                                            if (p.id === 'break') {
                                                return (
                                                    <td key={pIdx} className="border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 p-2 text-center text-slate-400 dark:text-slate-500">
                                                        <div className="rotate-180 writing-vertical-rl font-bold tracking-widest h-20 mx-auto">
                                                            {p.label}
                                                        </div>
                                                    </td>
                                                );
                                            }
                                            
                                            // Mock Data Generation
                                            const hasClass = Math.random() > 0.2;
                                            const subjects = ['رياضيات', 'فيزياء', 'لغة عربية', 'لغة إنجليزية', 'حاسب آلي', 'كيمياء'];
                                            const teachers = ['أ. خالد', 'أ. فهد', 'أ. محمد', 'أ. عبدالله'];
                                            const colors = ['bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300', 
                                                            'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300',
                                                            'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300',
                                                            'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700 dark:bg-fuchsia-900/20 dark:border-fuchsia-800 dark:text-fuchsia-300'];
                                            
                                            const subj = subjects[Math.floor(Math.random() * subjects.length)];
                                            const color = colors[Math.floor(Math.random() * colors.length)];
                                            
                                            return (
                                                <td key={pIdx} className="border border-slate-200 dark:border-slate-800 p-2 relative group h-24">
                                                    {hasClass ? (
                                                        <div className={`h-full w-full rounded-lg border p-2 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md ${color}`}>
                                                            <div className="flex justify-between items-start">
                                                                <span className="font-bold text-sm">{subj}</span>
                                                                <MoreVertical className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            </div>
                                                            <div className="flex items-center text-xs mt-2 opacity-80">
                                                                <Users className="w-3 h-3 ml-1" /> {teachers[Math.floor(Math.random() * teachers.length)]}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="h-full w-full rounded-lg border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-slate-400 group-hover:text-fuchsia-500">
                                                            <Plus className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
