"use client";

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingDown, TrendingUp, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function VarianceReportsPage() {
    const [variances, setVariances] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchVariances();
    }, []);

    const fetchVariances = async () => {
        try {
            const res = await fetch('/api/manufacturing/variance');
            if (res.ok) setVariances(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const totalDebit = variances.reduce((sum, v) => sum + v.debit, 0);
    const totalCredit = variances.reduce((sum, v) => sum + v.credit, 0);
    const netVariance = totalDebit - totalCredit;

    const getVarianceBadge = (debit: number, credit: number) => {
        if (debit > credit) {
            // Unfavorable (Cost is higher than standard)
            return <span className="bg-red-500/10 text-red-500 px-2 py-1 rounded text-xs font-bold flex items-center w-fit"><TrendingUp className="w-3 h-3 ml-1"/> غير مفضل (Unfavorable)</span>;
        } else if (credit > debit) {
            // Favorable
            return <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-xs font-bold flex items-center w-fit"><TrendingDown className="w-3 h-3 ml-1"/> مفضل (Favorable)</span>;
        }
        return <span className="bg-slate-500/10 text-slate-400 px-2 py-1 rounded text-xs font-bold flex items-center w-fit">متعادل (Neutral)</span>;
    };

    const getTypeLabel = (type: string) => {
        switch(type) {
            case 'PURCHASE_PRICE': return 'انحراف السعر (مواد)';
            case 'MATERIAL_USAGE': return 'انحراف الاستخدام (مواد)';
            case 'LABOR_RATE': return 'انحراف معدل الأجور';
            case 'OVERHEAD_VOLUME': return 'انحراف حجم التكاليف الصناعية';
            case 'PRODUCTION_YIELD': return 'انحراف المخرجات (الهالك)';
            default: return type;
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 p-6 lg:p-10 font-sans text-slate-200">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex items-center justify-between bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="p-4 bg-indigo-500/20 rounded-2xl">
                            <BarChart3 className="w-8 h-8 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">تقارير الانحرافات (Variance Reports)</h1>
                            <p className="text-slate-400 mt-1">مقارنة التكاليف المعيارية بالتكاليف الفعلية لتحديد مواطن الهدر</p>
                        </div>
                    </div>
                    <button className="flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-600/20">
                        <FileSpreadsheet className="w-5 h-5 ml-2" /> تصدير التقرير (Excel)
                    </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm font-medium mb-1">إجمالي انحرافات مدينة (غير مفضلة)</p>
                            <h3 className="text-2xl font-bold text-red-400">{totalDebit.toFixed(2)} SAR</h3>
                        </div>
                        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-red-400" />
                        </div>
                    </div>
                    
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm font-medium mb-1">إجمالي انحرافات دائنة (مفضلة)</p>
                            <h3 className="text-2xl font-bold text-emerald-400">{totalCredit.toFixed(2)} SAR</h3>
                        </div>
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
                            <TrendingDown className="w-6 h-6 text-emerald-400" />
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm font-medium mb-1">صافي الانحراف المالي</p>
                            <h3 className={`text-2xl font-bold ${netVariance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {Math.abs(netVariance).toFixed(2)} SAR
                            </h3>
                            <p className={`text-xs mt-1 ${netVariance > 0 ? 'text-red-400/80' : 'text-emerald-400/80'}`}>
                                {netVariance > 0 ? '(أعلى من المعياري)' : '(وفر مالي)'}
                            </p>
                        </div>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${netVariance > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                            {netVariance > 0 ? <AlertCircle className="w-6 h-6 text-red-400" /> : <AlertCircle className="w-6 h-6 text-emerald-400" />}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white flex items-center">
                            سجل الانحرافات التفصيلي
                        </h2>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="bg-slate-950/50 text-slate-400 text-sm">
                                    <th className="px-6 py-4 font-medium">التاريخ</th>
                                    <th className="px-6 py-4 font-medium">المنتج / المادة</th>
                                    <th className="px-6 py-4 font-medium">رقم الأمر المرتبط</th>
                                    <th className="px-6 py-4 font-medium">نوع الانحراف</th>
                                    <th className="px-6 py-4 font-medium">قيمة الانحراف</th>
                                    <th className="px-6 py-4 font-medium">الحالة والتأثير</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {loading && variances.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-10 text-slate-500">جاري التحميل...</td></tr>
                                ) : variances.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-10 text-slate-500">لا توجد انحرافات مالية مسجلة</td></tr>
                                ) : (
                                    variances.map((v) => (
                                        <tr key={v.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 text-slate-300 font-mono text-sm">{new Date(v.postedAt).toLocaleString('ar-SA')}</td>
                                            <td className="px-6 py-4 text-white font-medium">{v.product?.name || `Product #${v.productId}`}</td>
                                            <td className="px-6 py-4 font-mono text-blue-400 font-bold">{v.mo?.orderNumber || '-'}</td>
                                            <td className="px-6 py-4 text-slate-300">{getTypeLabel(v.type)}</td>
                                            <td className="px-6 py-4 font-mono font-bold text-slate-200">{v.amount.toFixed(2)}</td>
                                            <td className="px-6 py-4">
                                                {getVarianceBadge(v.debit, v.credit)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
