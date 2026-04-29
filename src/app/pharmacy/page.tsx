'use client';

import { useState, useEffect, useCallback } from 'react';

interface PharmacyStats {
    drugsTotal: number;
    lowStockCount: number;
    expiringSoonCount: number;
    patientsTotal: number;
    prescriptionsToday: number;
    claimsOutstanding: number;
    claimsPending: number;
    revenueToday: number;
}

export default function PharmacyDashboard() {
    const [stats, setStats] = useState<PharmacyStats | null>(null);
    const [drugs, setDrugs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQ, setSearchQ] = useState('');
    const [activeTab, setActiveTab] = useState<'dashboard' | 'drugs' | 'prescriptions' | 'patients' | 'insurance'>('dashboard');

    const fetchDrugs = useCallback(async (q = '') => {
        const res = await fetch(`/api/pharmacy/drugs?q=${q}&lowStock=false`);
        const data = await res.json();
        setDrugs(data.drugs || []);
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            const [drugsRes, lowStockRes, expiringRes, insRes] = await Promise.all([
                fetch('/api/pharmacy/drugs'),
                fetch('/api/pharmacy/drugs?lowStock=true'),
                fetch('/api/pharmacy/drugs?expiringSoon=true'),
                fetch('/api/pharmacy/insurance'),
            ]);
            const drugsData = await drugsRes.json();
            const lowData = await lowStockRes.json();
            const expData = await expiringRes.json();
            const insData = await insRes.json();

            setStats({
                drugsTotal: drugsData.total || 0,
                lowStockCount: lowData.total || 0,
                expiringSoonCount: expData.total || 0,
                patientsTotal: 0,
                prescriptionsToday: 0,
                claimsOutstanding: insData.summary?.outstanding || 0,
                claimsPending: insData.summary?.pending || 0,
                revenueToday: 0,
            });
            setDrugs(drugsData.drugs || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    const drugClassBadge = (cls: string) => {
        const map: Record<string, string> = {
            OTC: 'bg-green-500/20 text-green-400 border border-green-500/30',
            Rx: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
            CONTROLLED: 'bg-red-500/20 text-red-400 border border-red-500/30',
        };
        return map[cls] || 'bg-gray-500/20 text-gray-400';
    };

    const drugClassLabel = (cls: string) => ({
        OTC: 'بدون وصفة', Rx: 'بوصفة', CONTROLLED: 'مخدر متحكم',
    }[cls] || cls);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-950">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">جارٍ تحميل وحدة الصيدلية...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white" dir="rtl">
            {/* Header */}
            <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-2xl">💊</div>
                        <div>
                            <h1 className="text-xl font-bold text-white">وحدة الصيدلية</h1>
                            <p className="text-xs text-gray-400">متوافق مع SFDA · Wasfaty · CCHI</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs border border-emerald-500/20">✅ SFDA متوافق</span>
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs border border-blue-500/20">🏥 Wasfaty مفعّل</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mt-4 overflow-x-auto">
                    {[
                        { key: 'dashboard', label: 'لوحة التحكم', icon: '📊' },
                        { key: 'drugs', label: 'الأدوية', icon: '💊' },
                        { key: 'prescriptions', label: 'الوصفات', icon: '📋' },
                        { key: 'patients', label: 'المرضى', icon: '👤' },
                        { key: 'insurance', label: 'التأمين', icon: '🏥' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                                activeTab === tab.key
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                            }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-6">
                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && stats && (
                    <div className="space-y-6">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <KpiCard icon="💊" label="إجمالي الأدوية" value={stats.drugsTotal} color="emerald" />
                            <KpiCard icon="⚠️" label="مخزون منخفض" value={stats.lowStockCount} color="amber" alert />
                            <KpiCard icon="📅" label="تنتهي خلال 30 يوم" value={stats.expiringSoonCount} color="orange" alert />
                            <KpiCard icon="🏥" label="مطالبات معلقة" value={stats.claimsPending} color="blue" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Alerts panel */}
                            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                    <span>🚨</span> تنبيهات الامتثال
                                </h3>
                                <div className="space-y-3">
                                    {stats.lowStockCount > 0 && (
                                        <AlertRow icon="🔴" text={`${stats.lowStockCount} دواء وصل لحد إعادة الطلب`} severity="high" />
                                    )}
                                    {stats.expiringSoonCount > 0 && (
                                        <AlertRow icon="🟡" text={`${stats.expiringSoonCount} دواء ينتهي خلال 30 يوم`} severity="medium" />
                                    )}
                                    {stats.claimsPending > 0 && (
                                        <AlertRow icon="⏳" text={`${stats.claimsPending} مطالبة تأمين قيد المراجعة`} severity="low" />
                                    )}
                                    {stats.claimsOutstanding > 0 && (
                                        <AlertRow icon="💰" text={`${stats.claimsOutstanding.toFixed(2)} ر.س مستحقة من شركات التأمين`} severity="medium" />
                                    )}
                                    {stats.lowStockCount === 0 && stats.expiringSoonCount === 0 && (
                                        <div className="text-center py-4 text-emerald-400 text-sm">✅ لا توجد تنبيهات — كل شيء تحت السيطرة</div>
                                    )}
                                </div>
                            </div>

                            {/* Quick actions */}
                            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                    <span>⚡</span> إجراءات سريعة
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { icon: '📷', label: 'مسح وصفة Wasfaty', tab: 'prescriptions' },
                                        { icon: '💊', label: 'إضافة دواء جديد', tab: 'drugs' },
                                        { icon: '👤', label: 'بحث عن مريض', tab: 'patients' },
                                        { icon: '📊', label: 'تقرير المطالبات', tab: 'insurance' },
                                    ].map((action) => (
                                        <button
                                            key={action.label}
                                            onClick={() => setActiveTab(action.tab as any)}
                                            className="flex flex-col items-center gap-2 p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition-all group"
                                        >
                                            <span className="text-2xl group-hover:scale-110 transition-transform">{action.icon}</span>
                                            <span className="text-xs text-gray-300 text-center">{action.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Drugs Tab */}
                {activeTab === 'drugs' && (
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                placeholder="بحث بالاسم التجاري | المادة الفعالة | رقم SFDA | الباركود..."
                                value={searchQ}
                                onChange={e => { setSearchQ(e.target.value); fetchDrugs(e.target.value); }}
                                className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
                            />
                            <button className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-sm font-medium transition-colors">
                                + دواء جديد
                            </button>
                        </div>

                        <div className="grid gap-3">
                            {drugs.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <div className="text-4xl mb-3">💊</div>
                                    <p>لا توجد أدوية مسجلة بعد</p>
                                </div>
                            ) : drugs.map((drug: any) => (
                                <div key={drug.id} className="bg-gray-900 rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-all">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-white">{drug.product?.name}</h3>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${drugClassBadge(drug.drugClass)}`}>
                                                    {drugClassLabel(drug.drugClass)}
                                                </span>
                                                {drug.isControlled && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">⚠️ متحكم</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-400">{drug.genericName} {drug.genericNameEn && `— ${drug.genericNameEn}`}</p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                <span>SFDA: {drug.sfdaNumber}</span>
                                                {drug.manufacturer && <span>{drug.manufacturer}</span>}
                                                <span className={`${drug.storageTemp !== 'room' ? 'text-blue-400' : ''}`}>
                                                    {drug.storageTemp === 'refrigerated' ? '❄️ تبريد' : drug.storageTemp === 'frozen' ? '🧊 تجميد' : '🌡️ حرارة غرفة'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-left text-sm space-y-1">
                                            <div className={`font-bold ${(drug.product?.currentStock <= drug.product?.minQuantity) ? 'text-red-400' : 'text-emerald-400'}`}>
                                                {drug.product?.currentStock ?? 0} وحدة
                                            </div>
                                            <div className="text-gray-400">{drug.product?.sellPrice?.toFixed(2)} ر.س</div>
                                            {drug.mohMaxPrice > 0 && <div className="text-xs text-gray-600">سقف MOH: {drug.mohMaxPrice} ر.س</div>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Prescriptions Tab */}
                {activeTab === 'prescriptions' && (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">📋</div>
                        <h3 className="text-xl font-semibold text-white mb-2">إدارة الوصفات الطبية</h3>
                        <p className="text-gray-400 mb-6">تسجيل وصرف الوصفات — Wasfaty + ورقية + OTC</p>
                        <div className="flex gap-3 justify-center">
                            <button className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
                                <span>📷</span> مسح QR Wasfaty
                            </button>
                            <button className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
                                <span>📝</span> وصفة ورقية
                            </button>
                        </div>
                    </div>
                )}

                {/* Patients Tab */}
                {activeTab === 'patients' && (
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                placeholder="بحث برقم الهوية الوطنية | الاسم | الجوال..."
                                className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
                            />
                            <button className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-sm font-medium transition-colors">
                                + مريض جديد
                            </button>
                        </div>
                        <div className="text-center py-12 text-gray-500">
                            <div className="text-4xl mb-3">👤</div>
                            <p>ابحث عن مريض بالأعلى</p>
                        </div>
                    </div>
                )}

                {/* Insurance Tab */}
                {activeTab === 'insurance' && (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">🏥</div>
                        <h3 className="text-xl font-semibold text-white mb-2">مطالبات التأمين الصحي</h3>
                        <p className="text-gray-400">CCHI / NPHIES — تقديم ومتابعة المطالبات</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Sub-components
function KpiCard({ icon, label, value, color, alert }: any) {
    const colors: Record<string, string> = {
        emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20',
        amber: 'from-amber-500/10 to-amber-500/5 border-amber-500/20',
        orange: 'from-orange-500/10 to-orange-500/5 border-orange-500/20',
        blue: 'from-blue-500/10 to-blue-500/5 border-blue-500/20',
    };
    const textColors: Record<string, string> = {
        emerald: 'text-emerald-400', amber: 'text-amber-400', orange: 'text-orange-400', blue: 'text-blue-400',
    };
    return (
        <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5`}>
            <div className="text-2xl mb-2">{icon}</div>
            <div className={`text-3xl font-bold ${textColors[color]} ${alert && value > 0 ? 'animate-pulse' : ''}`}>{value}</div>
            <div className="text-sm text-gray-400 mt-1">{label}</div>
        </div>
    );
}

function AlertRow({ icon, text, severity }: any) {
    const bg: Record<string, string> = {
        high: 'bg-red-500/10 border-red-500/20',
        medium: 'bg-amber-500/10 border-amber-500/20',
        low: 'bg-blue-500/10 border-blue-500/20',
    };
    return (
        <div className={`flex items-center gap-3 p-3 rounded-lg border ${bg[severity]}`}>
            <span className="text-lg">{icon}</span>
            <span className="text-sm text-gray-300">{text}</span>
        </div>
    );
}
