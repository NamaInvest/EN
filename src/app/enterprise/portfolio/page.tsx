'use client';
import { useState } from 'react';

const MOCK_PROJECTS = [
    { id: 1, name: 'مشروع توسعة المستودع الرئيسي', status: 'active', progress: 68, budget: 450000, spent: 312000, due: '2026-07-15', pm: 'خالد العتيبي', priority: 'high' },
    { id: 2, name: 'تطوير نظام المبيعات الميدانية', status: 'active', progress: 35, budget: 180000, spent: 62000, due: '2026-09-30', pm: 'سارة المالكي', priority: 'medium' },
    { id: 3, name: 'إنشاء فرع الرياض الجديد', status: 'planning', progress: 10, budget: 850000, spent: 45000, due: '2026-12-01', pm: 'محمد الغامدي', priority: 'high' },
    { id: 4, name: 'ترقية نظام ERP', status: 'active', progress: 90, budget: 95000, spent: 88000, due: '2026-05-15', pm: 'نورة الزيد', priority: 'critical' },
    { id: 5, name: 'برنامج تدريب الكوادر 2026', status: 'completed', progress: 100, budget: 75000, spent: 71000, due: '2026-03-31', pm: 'فيصل القحطاني', priority: 'low' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    active: { label: '🟢 نشط', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    planning: { label: '🔵 تخطيط', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    completed: { label: '✅ مكتمل', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
    on_hold: { label: '⏸️ موقوف', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
};

const PRIORITY_COLOR: Record<string, string> = {
    critical: 'text-red-400',
    high: 'text-orange-400',
    medium: 'text-blue-400',
    low: 'text-gray-400',
};

export default function PortfolioPage() {
    const [filter, setFilter] = useState('all');
    const [view, setView] = useState<'grid' | 'list'>('grid');

    const filtered = filter === 'all' ? MOCK_PROJECTS : MOCK_PROJECTS.filter(p => p.status === filter);

    const totals = {
        budget: MOCK_PROJECTS.reduce((s, p) => s + p.budget, 0),
        spent: MOCK_PROJECTS.reduce((s, p) => s + p.spent, 0),
        active: MOCK_PROJECTS.filter(p => p.status === 'active').length,
        overBudget: MOCK_PROJECTS.filter(p => p.spent > p.budget * 0.9).length,
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">📁 محفظة المشاريع (Portfolio)</h1>
                    <p className="text-gray-400 text-sm mt-1">إدارة ومتابعة جميع مشاريع المنشأة</p>
                </div>
                <button className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-xl font-medium text-sm">+ مشروع جديد</button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'إجمالي الميزانية', value: `${totals.budget.toLocaleString()} ر.س`, icon: '💰', color: 'blue' },
                    { label: 'المُنفَق حتى الآن', value: `${totals.spent.toLocaleString()} ر.س`, icon: '📊', color: 'purple' },
                    { label: 'مشاريع نشطة', value: totals.active, icon: '🚀', color: 'emerald' },
                    { label: 'قرب تجاوز الميزانية', value: totals.overBudget, icon: '⚠️', color: totals.overBudget > 0 ? 'red' : 'emerald' },
                ].map(k => (
                    <div key={k.label} className={`rounded-2xl border p-4 ${
                        k.color==='blue'?'bg-blue-500/10 border-blue-500/20':
                        k.color==='purple'?'bg-purple-500/10 border-purple-500/20':
                        k.color==='emerald'?'bg-emerald-500/10 border-emerald-500/20':
                        'bg-red-500/10 border-red-500/20'}`}>
                        <div className="text-2xl mb-2">{k.icon}</div>
                        <div className="text-xl font-bold text-white">{k.value}</div>
                        <div className="text-xs text-gray-400 mt-1">{k.label}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex gap-2">
                    {[['all','الكل'],['active','نشط'],['planning','تخطيط'],['completed','مكتمل']].map(([k,l]) => (
                        <button key={k} onClick={() => setFilter(k)}
                            className={`px-4 py-2 rounded-lg text-sm transition-all ${filter===k?'bg-blue-500 text-white':'bg-gray-900 text-gray-400 border border-gray-800'}`}>{l}</button>
                    ))}
                </div>
                <div className="flex gap-2">
                    {(['grid','list'] as const).map(v => (
                        <button key={v} onClick={() => setView(v)}
                            className={`px-3 py-2 rounded-lg text-sm ${view===v?'bg-gray-700':'bg-gray-900 border border-gray-800'}`}>
                            {v==='grid'?'▦':'≡'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Projects */}
            <div className={view==='grid' ? 'grid md:grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-3'}>
                {filtered.map(p => {
                    const budgetPct = (p.spent / p.budget) * 100;
                    const daysLeft = Math.ceil((new Date(p.due).getTime() - Date.now()) / 86400000);
                    return (
                        <div key={p.id} className="bg-gray-900 rounded-2xl border border-gray-800 p-5 hover:border-gray-700 transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs font-bold ${PRIORITY_COLOR[p.priority]}`}>●</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_CONFIG[p.status]?.color}`}>{STATUS_CONFIG[p.status]?.label}</span>
                                    </div>
                                    <h3 className="font-semibold text-white text-sm leading-snug">{p.name}</h3>
                                    <p className="text-xs text-gray-500 mt-1">مدير: {p.pm}</p>
                                </div>
                            </div>

                            {/* Progress */}
                            <div className="mb-3">
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>التقدم</span>
                                    <span className="text-white font-bold">{p.progress}%</span>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full">
                                    <div className={`h-full rounded-full ${p.progress===100?'bg-emerald-500':p.progress>60?'bg-blue-500':'bg-amber-500'}`}
                                        style={{ width: `${p.progress}%` }} />
                                </div>
                            </div>

                            {/* Budget */}
                            <div className="mb-3">
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>الميزانية</span>
                                    <span className={`font-bold ${budgetPct > 90 ? 'text-red-400' : 'text-gray-300'}`}>{budgetPct.toFixed(0)}%</span>
                                </div>
                                <div className="h-1.5 bg-gray-800 rounded-full">
                                    <div className={`h-full rounded-full ${budgetPct>90?'bg-red-500':budgetPct>70?'bg-amber-500':'bg-blue-500'}`}
                                        style={{ width: `${Math.min(budgetPct, 100)}%` }} />
                                </div>
                                <div className="flex justify-between text-xs mt-1">
                                    <span className="text-gray-500">{p.spent.toLocaleString()} منفق</span>
                                    <span className="text-gray-500">{p.budget.toLocaleString()} إجمالي</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>📅 {p.due}</span>
                                <span className={daysLeft < 30 ? 'text-red-400' : 'text-gray-500'}>
                                    {daysLeft > 0 ? `${daysLeft} يوم متبقي` : 'منتهي المدة'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
