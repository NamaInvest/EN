'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { BrainCircuit, TrendingUp, AlertTriangle, Lightbulb, PackageOpen, DollarSign, Activity } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function AICFOPage() {
    
    const { t, lang } = useTranslation();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const isRTL = lang === 'ar';

    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<any>(null);
    const [error, setError] = useState('');
    const [raw, setRaw] = useState<any>(null);

    const generateReport = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/ai-cfo/report');
            const data = await res.json();
            if (data.success) {
                setReport(data.report);
                setRaw(data.raw);
            } else {
                setError(data.error || t('sys.str_4133'));
            }
        } catch (err) {
            setError(t('sys.str_4134'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-transparent min-h-screen">
            <div className="p-6 max-w-7xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
                
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 flex items-center gap-3">
                            <BrainCircuit size={32} className="text-blue-400" />
                            {t('sys.str_4119')}</h1>
                        <p className="text-gray-400 mt-2">{t('sys.str_4120')}</p>
                    </div>
                    
                    <button 
                        onClick={generateReport}
                        disabled={loading}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3 rounded-lg shadow-lg font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                        {loading ? t('sys.str_4135') : t('sys.str_4136')}
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg mb-6 flex items-center gap-3">
                        <AlertTriangle /> {error}
                    </div>
                )}

                {!report && !loading && !error && (
                    <div className="text-center py-24 bg-surface rounded-2xl border border-divider">
                        <BrainCircuit size={64} className="mx-auto text-gray-500 mb-4 opacity-50" />
                        <h3 className="text-xl text-gray-300 font-semibold mb-2">{t('sys.str_4121')}</h3>
                        <p className="text-gray-500">{t('sys.str_4122')}</p>
                    </div>
                )}

                {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="h-32 bg-surface rounded-2xl border border-divider"></div>
                        ))}
                        <div className="h-64 bg-surface rounded-2xl border border-divider col-span-full"></div>
                    </div>
                )}

                {report && !loading && (
                    <div className="space-y-6">
                        
                        {/* Executive Kpis */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            <div className="bg-gradient-to-br from-surface to-[#111] p-6 rounded-2xl border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.05)]">
                                <div className="flex items-center gap-3 mb-2 text-green-400">
                                    <Activity size={24} />
                                    <h3 className="font-bold">{t('sys.str_4123')}</h3>
                                </div>
                                <div className="text-4xl font-bold mt-4">{report.kpi?.healthScore || 0}%</div>
                            </div>
                            
                            <div className="bg-gradient-to-br from-surface to-[#111] p-6 rounded-2xl border border-blue-500/20">
                                <div className="flex items-center gap-3 mb-2 text-blue-400">
                                    <TrendingUp size={24} />
                                    <h3 className="font-bold">{t('sys.str_4124')}</h3>
                                </div>
                                <div className="text-3xl font-bold mt-5 text-white">{report.kpi?.profitability || t('sys.str_4137')}</div>
                            </div>

                            <div className="bg-gradient-to-br from-surface to-[#111] p-6 rounded-2xl border border-purple-500/20">
                                <div className="flex items-center gap-3 mb-2 text-purple-400">
                                    <DollarSign size={24} />
                                    <h3 className="font-bold">{t('sys.str_4125')}</h3>
                                </div>
                                <div className="text-3xl font-bold mt-5 text-white">{(raw?.revenue || 0).toLocaleString()} {t('sys.str_68')}</div>
                            </div>

                        </div>

                        {/* Executive Summary */}
                        <div className="bg-surface p-6 rounded-2xl border border-divider">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <BrainCircuit className="text-indigo-400" /> {t('sys.str_4126')}</h2>
                            <p className="text-gray-300 leading-relaxed text-lg">
                                {report.executiveSummary}
                            </p>
                        </div>

                        {/* Fast Movers & Dead Stock */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            
                            {/* Fast Movers */}
                            <div className="bg-surface p-6 rounded-2xl border border-green-500/20">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-400">
                                    <TrendingUp /> {t('sys.str_4127')}</h2>
                                <div className="space-y-4">
                                    {report.fastMovers?.map((item: any, i: number) => (
                                        <div key={i} className="bg-black/30 p-4 rounded-xl border border-white/5">
                                            <div className="font-bold text-white mb-1">{item.name}</div>
                                            <div className="text-sm text-green-300">{item.insight}</div>
                                        </div>
                                    ))}
                                    {(!report.fastMovers || report.fastMovers.length === 0) && <p className="text-gray-500">{t('sys.str_4128')}</p>}
                                </div>
                            </div>

                            {/* Dead Stock */}
                            <div className="bg-surface p-6 rounded-2xl border border-red-500/20">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-400">
                                    <PackageOpen /> {t('sys.str_4129')}</h2>
                                <div className="space-y-4">
                                    {report.deadStock?.map((item: any, i: number) => (
                                        <div key={i} className="bg-black/30 p-4 rounded-xl border border-red-500/10">
                                            <div className="flex justify-between mb-1">
                                                <span className="font-bold text-white">{item.name}</span>
                                                <span className="text-red-400 font-bold bg-red-400/10 px-2 rounded">{t('sys.str_4130')}{item.capital?.toLocaleString()} {t('sys.str_68')}</span>
                                            </div>
                                            <div className="text-sm text-gray-400">{item.action}</div>
                                        </div>
                                    ))}
                                    {(!report.deadStock || report.deadStock.length === 0) && <p className="text-gray-500">{t('sys.str_4131')}</p>}
                                </div>
                            </div>
                        </div>

                        {/* AI Strategies */}
                        <div className="bg-gradient-to-br from-indigo-900/30 to-surface p-6 rounded-2xl border border-indigo-500/20">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-400">
                                <Lightbulb /> {t('sys.str_4132')}</h2>
                            <ul className="space-y-3">
                                {report.strategicAdvice?.map((advice: string, i: number) => (
                                    <li key={i} className="flex gap-3 text-gray-200 bg-black/20 p-4 rounded-lg">
                                        <div className="text-indigo-400 mt-1">●</div>
                                        <div className="leading-relaxed">{advice}</div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
