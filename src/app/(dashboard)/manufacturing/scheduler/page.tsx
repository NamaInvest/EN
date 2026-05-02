'use client';
import React, { useState, useEffect } from 'react';
import { CalendarClock, Server, Activity, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function SchedulerPage() {
    const { lang } = useTranslation();
    const { success, info, error } = useToast();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

    const [schedule, setSchedule] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        try {
            const res = await fetch('/api/manufacturing/scheduler');
            if (res.ok) setSchedule(await res.json());
        } catch (error) {
            console.error('Error fetching schedule', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 p-6 lg:p-10 font-sans text-slate-200">
            <div className="max-w-7xl mx-auto space-y-8">
                
                <div className="flex items-center justify-between bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="p-4 bg-fuchsia-500/20 rounded-2xl">
                            <CalendarClock className="w-8 h-8 text-fuchsia-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">الجدولة المرئية (Gantt Scheduler)</h1>
                            <p className="text-slate-400 mt-1">تخطيط طاقة مراكز العمل (Finite Capacity Planning)</p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-slate-500">جاري تحميل مخطط السعة الإنتاجية...</div>
                ) : (
                    <div className="space-y-6">
                        {schedule.map((center: any) => (
                            <div key={center.workCenterId} className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Server className="w-5 h-5 text-indigo-400" /> {center.workCenterName}
                                    </h2>
                                    <span className="text-sm bg-slate-800 px-3 py-1 rounded-full text-slate-400">السعة: {center.capacity}</span>
                                </div>

                                {center.tasks.length === 0 ? (
                                    <div className="flex items-center justify-center p-8 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                                        <p className="text-slate-500 flex items-center gap-2"><Activity className="w-4 h-4"/> لا توجد أوامر قيد التنفيذ على هذا المركز</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto pb-4">
                                        <div className="flex space-x-4 space-x-reverse min-w-max">
                                            {center.tasks.map((task: any, index: number) => {
                                                const isDraft = task.status === 'draft';
                                                return (
                                                    <div key={task.id} className={`w-64 p-4 rounded-2xl border ${isDraft ? 'bg-slate-800 border-slate-700' : 'bg-indigo-900/40 border-indigo-500/30'} flex-shrink-0`}>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="text-xs font-bold px-2 py-1 rounded bg-black/30 text-slate-300">#{index + 1}</span>
                                                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${isDraft ? 'bg-slate-700 text-slate-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
                                                                {task.status}
                                                            </span>
                                                        </div>
                                                        <h3 className="font-bold text-white truncate mb-1">{task.orderNumber}</h3>
                                                        <p className="text-sm text-slate-400 mb-3 truncate">{task.operationName}</p>
                                                        
                                                        <div className="flex items-center justify-between text-xs font-mono text-slate-500 bg-black/20 p-2 rounded-lg">
                                                            <span>المدة:</span>
                                                            <span className="text-indigo-400">{task.durationMinutes} دقيقة</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
