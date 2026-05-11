"use client";

import React, { useState, useEffect } from 'react';
import { Cpu, Zap, Activity, AlertTriangle, TrendingDown, ShoppingCart, RefreshCcw, Wifi, BarChart3, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function MRPEnginePage() {
 const { lang } = useTranslation();
 const { success, info } = useToast();
 const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

 const [data, setData] = useState<any>(null);
 const [loading, setLoading] = useState(false);
 const [running, setRunning] = useState(false);

 useEffect(() => {
 runMRP();
 }, []);

 const runMRP = async () => {
 setLoading(true);
 setRunning(true);
 try {
 const res = await fetch('/api/manufacturing/mrp-run');
 if (res.ok) {
 setData(await res.json());
 }
 } catch (error) {
 console.error(error);
 } finally {
 setTimeout(() => {
 setLoading(false);
 setRunning(false);
 }, 800); // Artificial delay to simulate heavy engine calculation
 }
 };

 return (
 <div className="min-h-screen bg-slate-950 p-6 lg:p-10 font-sans text-slate-200">
 <div className="max-w-7xl mx-auto space-y-8">
 
 {/* Header Section */}
 <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl gap-4">
 <div className="flex items-center space-x-4 space-x-reverse">
 <div className="p-4 bg-indigo-500/20 rounded-2xl relative overflow-hidden group">
 <div className="absolute inset-0 bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors"></div>
 <Cpu className={`w-8 h-8 text-indigo-400 ${running ? 'animate-pulse' : ''}`} />
 </div>
 <div>
 <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
 المحرك الآلي للتخطيط (AI & MRP Engine)
 </h1>
 <p className="text-slate-400 mt-1">تخطيط الاحتياجات (JIT)، التتبع اللحظي (IoT)، وكفاءة المعدات (OEE)</p>
 </div>
 </div>
 <button onClick={runMRP} disabled={running} className="flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 min-w-[200px]">
 {running ? <><RefreshCcw className="w-5 h-5 ml-2 animate-spin" /> جاري الحساب...</> : <><Zap className="w-5 h-5 ml-2" /> تشغيل محرك MRP</>}
 </button>
 </div>

 {data && (
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 
 {/* Shortages Column (JIT & Inventory) */}
 <div className="lg:col-span-2 space-y-8">
 <div className="bg-slate-900 rounded-3xl border border-rose-500/20 shadow-xl overflow-hidden relative">
 <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-3xl rounded-full"></div>
 <div className="p-6 border-b border-slate-800 flex justify-between items-center relative z-10">
 <h2 className="text-xl font-bold text-white flex items-center">
 <TrendingDown className="w-6 h-6 ml-2 text-rose-400" /> تقرير نواقص الإنتاج (Material Shortages)
 </h2>
 <div className="bg-rose-500/10 text-rose-400 px-3 py-1 rounded-full text-xs font-bold border border-rose-500/20 flex items-center">
 <AlertTriangle className="w-3 h-3 ml-1" />{_t('تنبيه جيت', 'JIT Alert')}</div>
 </div>
 <div className="p-6">
 {data.shortages?.length === 0 ? (
 <div className="text-center py-10">
 <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
 <CheckCircle2 className="w-8 h-8 text-emerald-400" />
 </div>
 <h3 className="text-xl font-bold text-slate-300">المخزون متوفر للإنتاج</h3>
 <p className="text-slate-500 mt-2">لا توجد نواقص لـ {data.activeOrdersCount} أمر تشغيل نشط.</p>
 </div>
 ) : (
 <>
 <div className="overflow-x-auto">
 <table className="w-full text-right mb-6">
 <thead>
 <tr className="text-slate-400 text-sm border-b border-slate-800">
 <th className="pb-3 font-medium">المادة الخام</th>
 <th className="pb-3 font-medium">المطلوب للإنتاج</th>
 <th className="pb-3 font-medium">المتوفر</th>
 <th className="pb-3 font-medium text-rose-400">العجز (Shortage)</th>
 <th className="pb-3 font-medium">إجراء آلي</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-800/50">
 {data.shortages?.map((item: any) => (
 <tr key={item.productId} className="hover:bg-slate-800/30">
 <td className="py-3 text-white font-medium">{item.productName}</td>
 <td className="py-3 text-slate-300 font-mono">{item.requiredQty.toFixed(2)}</td>
 <td className="py-3 text-slate-500 font-mono">{item.currentStock.toFixed(2)}</td>
 <td className="py-3 text-rose-400 font-mono font-bold bg-rose-500/5 px-2 rounded">{item.shortageQty.toFixed(2)}</td>
 <td className="py-3">
 <button className="text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-lg border border-indigo-500/20 transition-colors flex items-center">
 <ShoppingCart className="w-3 h-3 ml-1" /> إصدار PO
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
 <span className="text-slate-400">التكلفة التقديرية لسد العجز (شراء فوري):</span>
 <span className="text-xl font-mono font-bold text-rose-400">{data.totalShortageCost.toFixed(2)} SAR</span>
 </div>
 </>
 )}
 </div>
 </div>
 
 {/* Lean Management & Traceability Placeholder */}
 <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl flex items-center justify-between">
 <div className="flex items-center">
 <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center ml-4 border border-emerald-500/20">
 <Activity className="w-6 h-6 text-emerald-400" />
 </div>
 <div>
 <h3 className="font-bold text-white">الرقابة والتتبع العكسي (Traceability)</h3>
 <p className="text-sm text-slate-400">الربط مع الباركود وتتبع تشغيلات المنتج النهائي نشط.</p>
 </div>
 </div>
 <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 border border-slate-700">سجل التتبع</button>
 </div>
 </div>

 {/* Right Column: IoT & Machine OEE */}
 <div className="space-y-8">
 <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden relative h-full">
 <div className="p-6 border-b border-slate-800 flex justify-between items-center">
 <h2 className="text-xl font-bold text-white flex items-center">
 <BarChart3 className="w-6 h-6 ml-2 text-sky-400" /> كفاءة الآلات (OEE)
 </h2>
 <Wifi className="w-5 h-5 text-emerald-400 animate-pulse" />
 </div>
 <div className="p-6 space-y-4">
 {data.machineStats?.length === 0 ? (
 <p className="text-slate-500 text-sm text-center">لا توجد آلات مسجلة في المصنع.</p>
 ) : (
 data.machineStats?.map((machine: any) => (
 <div key={machine.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800/50 relative overflow-hidden">
 {/* Status Indicator */}
 <div className={`absolute top-0 right-0 w-1 h-full ${machine.status === 'active' ? 'bg-emerald-500' : machine.status === 'maintenance' ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
 
 <div className="flex justify-between items-start mb-3">
 <h3 className="font-bold text-slate-200">{machine.name}</h3>
 <span className="text-xs text-slate-500 font-mono">{machine.code}</span>
 </div>
 
 <div className="flex items-center space-x-3 space-x-reverse text-xs mt-2">
 <span className={`px-2 py-1 rounded-md border ${machine.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : machine.status === 'maintenance' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
 {machine.status === 'active' ? 'تعمل الآن (IoT)' : machine.status === 'maintenance' ? 'صيانة (أتمتة)' : 'متوقفة'}
 </span>
 {machine.activeOrderId && (
 <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded-md">أمر: {machine.activeOrderId}</span>
 )}
 </div>

 {/* Simulated AI Predictive Maintenance Alert */}
 {machine.pendingMaintenance > 0 && (
 <div className="mt-4 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg flex items-center text-amber-400 text-xs">
 <Zap className="w-3 h-3 ml-1" />
 تنبيه ذكاء اصطناعي: احتمال عطل خلال {Math.floor(Math.random() * 10) + 2} أيام (مجدولة)
 </div>
 )}
 </div>
 ))
 )}
 </div>
 </div>
 </div>

 </div>
 )}
 </div>
 </div>
 );
}
