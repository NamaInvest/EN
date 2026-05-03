"use client";

import React from 'react';
import { LineChart, BarChart3, TrendingUp, AlertTriangle, ShieldCheck, Zap, ArrowRight, BrainCircuit, Activity, FileText } from 'lucide-react';

const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');`;

export default function AICFODashboard() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-6 lg:p-10 transition-colors duration-300" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
            <style dangerouslySetInnerHTML={{ __html: fontImport }} />
            
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
                            <BrainCircuit className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">المدير المالي الذكي (AI CFO)</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">توقعات التدفق النقدي، اكتشاف الحالات الشاذة، وتحليلات الربحية</p>
                        </div>
                    </div>
                    <div className="mt-4 md:mt-0 flex gap-3">
                        <button className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors font-medium shadow-sm">
                            <FileText className="w-4 h-4 ml-2" /> توليد تقرير تنفيذي
                        </button>
                        <button className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-colors font-medium shadow-md shadow-indigo-500/20">
                            <Zap className="w-4 h-4 ml-2" /> تشغيل التحليل العميق
                        </button>
                    </div>
                </div>

                {/* AI Executive Summary */}
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-8 rounded-2xl border border-indigo-900/50 shadow-xl relative overflow-hidden text-white">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-center">
                        <div className="lg:w-2/3">
                            <div className="flex items-center gap-2 mb-4">
                                <SparklesIcon className="w-5 h-5 text-indigo-400" />
                                <h2 className="text-xl font-bold text-indigo-200 tracking-wide uppercase">ملخص الذكاء الاصطناعي الأسبوعي</h2>
                            </div>
                            <p className="text-xl leading-relaxed text-slate-200 font-light">
                                "بناءً على المعاملات المالية للأسبوع الماضي، لاحظت تحسناً في التدفقات النقدية بنسبة <span className="text-emerald-400 font-bold">12%</span> بفضل سرعة تحصيل ذمم العملاء. ومع ذلك، هناك <span className="text-rose-400 font-bold">ارتفاع غير مبرر بقيمة 45,000 ﷼</span> في مصاريف التسويق مقارنة بالموازنة المعتمدة. أنصح بمراجعة فواتير الحملات الإعلانية."
                            </p>
                        </div>
                        <div className="lg:w-1/3 w-full bg-black/30 p-5 rounded-xl border border-white/10 backdrop-blur-sm">
                            <h3 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">نقاط العمل المقترحة</h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-2">
                                    <ArrowRight className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                    <span className="text-sm text-slate-200">تدقيق قيود مصروفات التسويق (قيد رقم 4021)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                    <span className="text-sm text-slate-200">استثمار الفائض النقدي المؤقت (1.2M ﷼) في وديعة قصيرة الأجل</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500 transition-colors">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">توقع التدفق النقدي (30 يوم)</p>
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">+2.4M ﷼</h3>
                            </div>
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-slate-500 flex items-center">
                            <ShieldCheck className="w-4 h-4 ml-1 text-emerald-500" /> 
                            درجة ثقة الذكاء الاصطناعي: <span className="font-bold text-emerald-500 mr-1">94%</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500 transition-colors border-t-4 border-t-rose-500">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">حالات شاذة (Anomalies)</p>
                                <h3 className="text-3xl font-bold text-rose-600 dark:text-rose-500 font-[Fira_Code]">3</h3>
                            </div>
                            <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg text-rose-600 dark:text-rose-400">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-rose-500 font-bold cursor-pointer hover:underline">
                            عرض القيود المشتبه بها
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500 transition-colors">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">الصحة المالية للعملاء (ECL)</p>
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">8.2/10</h3>
                            </div>
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                <Activity className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-slate-500">
                            تم تحديث مخاطر الائتمان (IFRS 9) اليوم
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Predictive Charts Mockup */}
                    <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                                <LineChart className="w-5 h-5 ml-2 text-indigo-500" /> تنبؤات السيولة (Cash runway)
                            </h2>
                            <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full border border-indigo-200 dark:border-indigo-800">
                                AI Model: v2.4
                            </span>
                        </div>
                        
                        <div className="h-64 flex items-end justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 relative">
                            {/* Target line */}
                            <div className="absolute w-full border-t border-dashed border-slate-300 dark:border-slate-600 bottom-32"></div>
                            
                            {/* Historical Data (Solid) */}
                            {['60%', '65%', '55%', '70%', '80%'].map((h, i) => (
                                <div key={i} className="w-full bg-slate-300 dark:bg-slate-700 rounded-t-md relative group transition-all hover:bg-slate-400 dark:hover:bg-slate-600" style={{ height: h }}></div>
                            ))}
                            
                            {/* AI Prediction (Gradient / Glowing) */}
                            {['75%', '85%', '90%', '82%', '95%'].map((h, i) => (
                                <div key={`p-${i}`} className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-md relative group opacity-80 hover:opacity-100 transition-all shadow-[0_0_15px_rgba(99,102,241,0.5)]" style={{ height: h }}>
                                    <div className="absolute -top-6 w-full text-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 font-[Fira_Code]">توقع</div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-4 text-xs font-[Fira_Code] text-slate-400">
                            <span>يناير (فعلي)</span>
                            <span className="text-indigo-500 font-bold">يونيو (متوقع)</span>
                        </div>
                    </div>

                    {/* Anomaly Detection List */}
                    <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                                <AlertTriangle className="w-5 h-5 ml-2 text-rose-500" /> رادار الرقابة الآلية (Audit Radar)
                            </h2>
                        </div>
                        <div className="p-0">
                            <div className="divide-y divide-slate-200 dark:divide-slate-800">
                                
                                <div className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                            <h3 className="font-bold text-slate-900 dark:text-slate-200 text-sm">تغيير في سعر المورد (حبر طابعات)</h3>
                                        </div>
                                        <span className="text-xs font-[Fira_Code] text-slate-500">منذ ساعتين</span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mr-4 mb-3">
                                        فاتورة المشتريات (PUR-992) تحتوي على سعر الوحدة بزيادة 35% عن المتوسط التاريخي لنفس المورد خلال 6 أشهر.
                                    </p>
                                    <div className="mr-4 flex gap-2">
                                        <button className="px-3 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 text-xs font-bold rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">مراجعة الفاتورة</button>
                                        <button className="px-3 py-1 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">تجاهل التنبيه</button>
                                    </div>
                                </div>

                                <div className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                            <h3 className="font-bold text-slate-900 dark:text-slate-200 text-sm">تأخير متوقع في التحصيل</h3>
                                        </div>
                                        <span className="text-xs font-[Fira_Code] text-slate-500">أمس</span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mr-4">
                                        يتوقع نموذج الائتمان تأخر "شركة الأفق" في سداد فاتورة بقيمة 120,000 ﷼ بناءً على نمط سدادهم في الربع الماضي (احتمالية التأخير: 78%).
                                    </p>
                                </div>

                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

// Inline Icon
function SparklesIcon(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
}
