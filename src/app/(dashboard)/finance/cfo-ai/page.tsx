"use client";

import React, { useState, useEffect } from 'react';
import { LineChart, DollarSign, BrainCircuit, TrendingUp, AlertOctagon, TrendingDown, RefreshCcw, ShieldAlert, Target } from 'lucide-react';

export default function CFOAIPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const res = await fetch('/api/finance/cfo');
        if (res.ok) setData(await res.json());
        setLoading(false);
    };

    if (loading) return <div className="p-10 text-slate-400 animate-pulse flex items-center"><BrainCircuit className="w-6 h-6 mr-2 animate-spin" /> جاري تحليل البيانات المالية...</div>;

    return (
        <div className="min-h-screen bg-slate-950 p-6 lg:p-10 font-sans text-slate-200">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl gap-4">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="p-4 bg-amber-500/20 rounded-2xl relative overflow-hidden group">
                            <BrainCircuit className="w-8 h-8 text-amber-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
                                المدير المالي الذكي (CFO AI)
                            </h1>
                            <p className="text-slate-400 mt-1">التدفق النقدي التنبؤي، تحسين الربحية، وإدارة المخاطر (Financial Engineering)</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Predictive Cash Flow */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-3xl rounded-full pointer-events-none"></div>
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center relative z-10">
                                <LineChart className="w-6 h-6 ml-2 text-amber-400" /> التدفق النقدي التنبؤي (Predictive Cash Flow)
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 mb-6">
                                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-inner">
                                    <p className="text-sm text-slate-400 mb-1">الرصيد المتاح حالياً</p>
                                    <h3 className="text-3xl font-mono font-bold text-white">{data?.predictiveCashFlow?.currentBalance.toLocaleString()} <span className="text-sm text-slate-500">SAR</span></h3>
                                </div>
                                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-inner relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                                    <p className="text-sm text-slate-400 mb-1 flex items-center">التنبؤ للشهر القادم <SparklesIcon /></p>
                                    <h3 className="text-3xl font-mono font-bold text-emerald-400">{data?.predictiveCashFlow?.nextMonthForecast.toLocaleString()} <span className="text-sm text-slate-500">SAR</span></h3>
                                </div>
                            </div>

                            {data?.predictiveCashFlow?.alerts.map((alert: any) => (
                                <div key={alert.id} className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start text-rose-400 relative z-10">
                                    <AlertOctagon className="w-6 h-6 ml-3 shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-sm">تنبيه ذكاء اصطناعي (AI Alert)</h4>
                                        <p className="text-xs mt-1 text-rose-300">{alert.message}</p>
                                    </div>
                                    <div className="mr-auto font-mono font-bold bg-rose-500/20 px-3 py-1 rounded-lg">
                                        {alert.amount.toLocaleString()} SAR
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Profit Optimization */}
                        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl relative z-10">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                                <Target className="w-6 h-6 ml-2 text-indigo-400" /> تحسين الربحية الآلي (Dynamic Pricing)
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-right">
                                    <thead>
                                        <tr className="text-slate-400 text-sm border-b border-slate-800">
                                            <th className="pb-3 font-medium">المنتج</th>
                                            <th className="pb-3 font-medium">السعر الحالي</th>
                                            <th className="pb-3 font-medium text-indigo-400">السعر المقترح (AI)</th>
                                            <th className="pb-3 font-medium">السبب المالي</th>
                                            <th className="pb-3 font-medium">إجراء</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {data?.pricingRecommendations?.map((rec: any) => (
                                            <tr key={rec.id} className="hover:bg-slate-800/30">
                                                <td className="py-4 text-white font-medium text-sm">{rec.product}</td>
                                                <td className="py-4 text-slate-300 font-mono text-sm">{rec.currentPrice} SAR</td>
                                                <td className="py-4 font-mono font-bold text-sm">
                                                    <span className={rec.recommendedPrice > rec.currentPrice ? 'text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded' : 'text-rose-400 bg-rose-500/10 px-2 py-1 rounded'}>
                                                        {rec.recommendedPrice} SAR
                                                    </span>
                                                </td>
                                                <td className="py-4 text-slate-400 text-xs w-1/3 leading-relaxed">{rec.reason}</td>
                                                <td className="py-4">
                                                    <button className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center shadow-lg shadow-indigo-500/20">
                                                        <RefreshCcw className="w-3 h-3 ml-1" /> تطبيق 
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Financial Risk Management */}
                    <div className="space-y-8">
                        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl relative h-full">
                            <h2 className="text-lg font-bold text-white mb-6 flex items-center">
                                <ShieldAlert className="w-5 h-5 ml-2 text-rose-400" /> إدارة المخاطر (Risk Management)
                            </h2>
                            <div className="space-y-4">
                                {data?.riskManagement?.map((risk: any, idx: number) => (
                                    <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative overflow-hidden group">
                                        <div className={`absolute top-0 right-0 w-1 h-full ${risk.riskLevel === 'High' ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-slate-200 text-sm">{risk.entity}</h3>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${risk.riskLevel === 'High' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                {risk.riskLevel} RISK
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 leading-relaxed">{risk.reason}</p>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-8 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                                <h4 className="text-xs font-bold text-indigo-400 mb-2 flex items-center"><TrendingUp className="w-3 h-3 ml-1" /> توصية جدار الحماية المالي</h4>
                                <p className="text-xs text-slate-400">النظام يقترح تجميد البيع الآجل للعميل الذهبي حتى سداد 50% من المستحقات لتجنب أزمة سيولة (Liquidity Crunch).</p>
                                <button className="mt-3 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors">
                                    تفعيل التجميد الآلي
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

function SparklesIcon() {
    return (
        <svg className="w-4 h-4 mr-1 text-amber-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
    )
}
