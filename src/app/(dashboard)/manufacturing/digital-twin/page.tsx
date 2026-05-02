"use client";

import React, { useState, useEffect } from 'react';
import { Box, Network, Bot, Link, Cpu, Sparkles, AlertTriangle, PlayCircle, Settings2, ShieldCheck, Factory } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function DigitalTwinPage() {
    const { success, info } = useToast();

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [simulating, setSimulating] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const res = await fetch('/api/manufacturing/digital-twin');
        if (res.ok) setData(await res.json());
        setLoading(false);
    };

    const runSimulation = () => {
        setSimulating(true);
        setTimeout(() => setSimulating(false), 2000);
    };

    if (loading) return <div className="p-10 text-slate-400 animate-pulse">جاري بناء التوأم الرقمي...</div>;

    return (
        <div className="min-h-screen bg-slate-950 p-6 lg:p-10 font-sans text-slate-200">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl gap-4">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="p-4 bg-cyan-500/20 rounded-2xl relative overflow-hidden group">
                            <Network className="w-8 h-8 text-cyan-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
                                التوأمة الرقمية والأتمتة الفائقة
                            </h1>
                            <p className="text-slate-400 mt-1">Digital Twin, AI Agents, Blockchain Ledger, Zero-Touch Accounting</p>
                        </div>
                    </div>
                    <button onClick={runSimulation} disabled={simulating} className="flex items-center justify-center px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-cyan-600/20 disabled:opacity-50">
                        {simulating ? <><Sparkles className="w-5 h-5 ml-2 animate-spin" /> جاري المحاكاة...</> : <><PlayCircle className="w-5 h-5 ml-2" /> محاكاة "ماذا لو" (What-If)</>}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Digital Twin Map (2 columns) */}
                    <div className="lg:col-span-2 bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-900/0 to-slate-900/0"></div>
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center relative z-10">
                            <Box className="w-6 h-6 ml-2 text-cyan-400" /> المصنع الافتراضي (Live Factory Map)
                        </h2>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                            {data?.machines?.map((machine: any) => (
                                <div key={machine.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 shadow-inner relative group">
                                    <div className={`absolute top-3 left-3 w-2 h-2 rounded-full ${machine.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`}></div>
                                    <div className="flex items-center mb-4">
                                        <Factory className="w-8 h-8 text-slate-600 ml-3" />
                                        <div>
                                            <h3 className="font-bold text-slate-200">{machine.name}</h3>
                                            <p className="text-xs text-slate-500 font-mono">{machine.code}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 mt-4 text-xs font-mono">
                                        <div className="flex justify-between items-center bg-slate-900 px-3 py-2 rounded-lg">
                                            <span className="text-slate-400">الحرارة (IoT):</span>
                                            <span className={machine.telemetry?.[0]?.temperature > 80 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                                                {machine.telemetry?.[0]?.temperature || 'N/A'} °C
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center bg-slate-900 px-3 py-2 rounded-lg">
                                            <span className="text-slate-400">البصمة الكربونية:</span>
                                            <span className="text-cyan-400">{machine.carbonRate} kg/h</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-slate-900 px-3 py-2 rounded-lg">
                                            <span className="text-slate-400">التكلفة (ABC):</span>
                                            <span className="text-fuchsia-400">{machine.hourlyCost + machine.energyCost} SAR/h</span>
                                        </div>
                                    </div>
                                    
                                    {simulating && (
                                        <div className="absolute inset-0 bg-cyan-500/10 backdrop-blur-[1px] rounded-2xl flex items-center justify-center border border-cyan-500/30">
                                            <Sparkles className="w-6 h-6 text-cyan-400 animate-spin" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Agents & Blockchain Column */}
                    <div className="space-y-8">
                        
                        {/* Autonomous Agents */}
                        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center">
                                <Bot className="w-5 h-5 ml-2 text-fuchsia-400" /> وكلاء الذكاء الاصطناعي (AI Agents)
                            </h2>
                            <div className="space-y-3">
                                {data?.autonomousAgents?.map((agent: any) => (
                                    <div key={agent.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start">
                                        <div className="mt-1 ml-3">
                                            <Cpu className="w-5 h-5 text-fuchsia-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-300">{agent.action}</p>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full mt-2 inline-block ${agent.status === 'active' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                                {agent.status === 'active' ? 'قيد المعالجة (Autonomous)' : 'مكتمل (Zero-Touch)'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Blockchain Ledger */}
                        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center">
                                <Link className="w-5 h-5 ml-2 text-indigo-400" /> سجل البلوكشين (Immutable Ledger)
                            </h2>
                            <div className="space-y-3">
                                {data?.blockchain?.map((block: any, idx: number) => (
                                    <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-mono text-slate-500">Block #{block.block}</span>
                                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <p className="text-xs text-slate-300 mb-2">{block.action}</p>
                                        <div className="bg-slate-900 p-1.5 rounded text-[10px] font-mono text-indigo-400 text-center">
                                            {block.hash}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 text-center">
                                <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  className="text-xs text-slate-400 hover:text-white flex items-center justify-center w-full">
                                    <Settings2 className="w-3 h-3 ml-1" /> إعدادات العقود الذكية (Smart Contracts)
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
