'use client';

import { useState, useEffect, useCallback } from 'react';

const ALL_MODULES = [
    { key: 'HR', label: '👥 الموارد البشرية' },
    { key: 'POS', label: '🛒 نقطة البيع' },
    { key: 'ZATCA', label: '🧾 ZATCA فاز 2' },
    { key: 'Purchases', label: '🛍️ المشتريات' },
    { key: 'Manufacturing', label: '🏭 التصنيع' },
    { key: 'Reports', label: '📊 التقارير المتقدمة' },
];

interface Tenant {
    subdomain: string;
    dbName: string;
    domainUrl: string;
    companyNameAr: string;
    companyNameEn: string;
    vatNumber: string;
    trialActive: boolean;
    daysRemaining: number;
    invoiceCount: number;
    maxInvoices: number;
    isExpired: boolean;
    hiddenModules: string[];
    status?: string;
}

export default function IcePage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [togglingModule, setTogglingModule] = useState('');
    const [actionLoading, setActionLoading] = useState('');

    const fetchTenants = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/ice/tenants');
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'فشل جلب البيانات');
            setTenants(data.tenants);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTenants(); }, [fetchTenants]);

    const toggleModule = async (subdomain: string, moduleName: string, enabled: boolean) => {
        setTogglingModule(`${subdomain}_${moduleName}`);
        try {
            const res = await fetch('/api/ice/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subdomain, moduleName, enabled }),
            });
            const data = await res.json();
            if (data.success) {
                setTenants(prev => prev.map(t =>
                    t.subdomain === subdomain ? { ...t, hiddenModules: data.hiddenModules } : t
                ));
                if (selectedTenant?.subdomain === subdomain) {
                    setSelectedTenant(prev => prev ? { ...prev, hiddenModules: data.hiddenModules } : null);
                }
            }
        } catch {}
        setTogglingModule('');
    };

    const handleTrialAction = async (subdomain: string, action: 'extend' | 'activate_paid') => {
        setActionLoading(`${subdomain}_${action}`);
        try {
            const res = await fetch('/api/ice/toggle', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subdomain, action }),
            });
            const data = await res.json();
            if (data.success) await fetchTenants();
        } catch {}
        setActionLoading('');
    };

    const activeCount = tenants.filter(t => !t.isExpired && t.trialActive).length;
    const expiredCount = tenants.filter(t => t.isExpired).length;
    const totalInvoices = tenants.reduce((sum, t) => sum + t.invoiceCount, 0);

    return (
        <div
            className="min-h-screen bg-[#0a0e1a] text-gray-100 font-mono"
            dir="rtl"
            style={{ fontFamily: "'Courier New', monospace" }}
        >
            {/* Top bar */}
            <div className="border-b border-[#00ff9430] bg-[#0d1117] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#00ff94] animate-pulse" />
                    <span className="text-[#00ff94] text-lg font-bold tracking-widest">ICE PANEL</span>
                    <span className="text-gray-500 text-xs">// NAMA INVEST MASTER CONTROL</span>
                </div>
                <div className="flex items-center gap-6 text-sm">
                    <span className="text-gray-400">مستأجرين: <span className="text-[#00ff94] font-bold">{tenants.length}</span></span>
                    <span className="text-gray-400">نشط: <span className="text-green-400 font-bold">{activeCount}</span></span>
                    <span className="text-gray-400">منتهي: <span className="text-red-400 font-bold">{expiredCount}</span></span>
                    <span className="text-gray-400">فواتير كلية: <span className="text-blue-400 font-bold">{totalInvoices}</span></span>
                    <button
                        onClick={fetchTenants}
                        className="px-3 py-1 border border-[#00ff9440] text-[#00ff94] text-xs rounded hover:bg-[#00ff9415] transition"
                    >
                        ↺ تحديث
                    </button>
                </div>
            </div>

            <div className="flex h-[calc(100vh-65px)]">
                {/* Tenants List */}
                <div className="w-96 border-l border-[#1a2535] overflow-y-auto bg-[#0d1117]">
                    {loading ? (
                        <div className="p-8 text-center text-[#00ff94] animate-pulse">
                            <div className="text-2xl mb-2">⟳</div>
                            <div className="text-sm">جاري جلب البيانات...</div>
                        </div>
                    ) : error ? (
                        <div className="p-6 text-red-400 text-sm border border-red-500/30 m-4 rounded">
                            ⚠️ {error}
                        </div>
                    ) : tenants.length === 0 ? (
                        <div className="p-8 text-center text-gray-600">لا يوجد مستأجرين بعد</div>
                    ) : (
                        tenants.map(tenant => (
                            <div
                                key={tenant.subdomain}
                                onClick={() => setSelectedTenant(tenant)}
                                className={`p-4 border-b border-[#1a2535] cursor-pointer hover:bg-[#111827] transition ${selectedTenant?.subdomain === tenant.subdomain ? 'bg-[#111827] border-r-2 border-r-[#00ff94]' : ''}`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[#00ff94] font-bold text-sm">{tenant.subdomain}</span>
                                    {tenant.status === 'INITIALIZING' ? (
                                        <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">جاري التهيئة</span>
                                    ) : tenant.isExpired ? (
                                        <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">منتهي</span>
                                    ) : (
                                        <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">نشط</span>
                                    )}
                                </div>
                                <div className="text-gray-400 text-xs truncate">{tenant.companyNameAr}</div>
                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                                    <span>⏳ {tenant.daysRemaining} يوم</span>
                                    <span>🧾 {tenant.invoiceCount}/{tenant.maxInvoices}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Detail Panel */}
                <div className="flex-1 overflow-y-auto p-6">
                    {!selectedTenant ? (
                        <div className="flex items-center justify-center h-full text-gray-700">
                            <div className="text-center">
                                <div className="text-6xl mb-4 opacity-20">❄️</div>
                                <div className="text-lg">اختر عميلاً من القائمة</div>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-3xl space-y-6">
                            {/* Header */}
                            <div className="bg-[#0d1117] border border-[#1a2535] rounded-xl p-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h1 className="text-2xl font-bold text-[#00ff94]">{selectedTenant.companyNameAr}</h1>
                                        <p className="text-gray-400 text-sm mt-1">{selectedTenant.companyNameEn}</p>
                                        <a
                                            href={`https://${selectedTenant.domainUrl}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-blue-400 text-xs hover:underline mt-1 inline-block"
                                        >
                                            🔗 {selectedTenant.domainUrl}
                                        </a>
                                    </div>
                                    <div className="text-left space-y-1">
                                        <div className="text-xs text-gray-500">VAT</div>
                                        <div className="text-sm font-mono text-gray-300">{selectedTenant.vatNumber}</div>
                                        <div className="text-xs text-gray-500 mt-2">DB</div>
                                        <div className="text-sm font-mono text-gray-300">{selectedTenant.dbName}</div>
                                    </div>
                                </div>

                                {/* Trial Stats */}
                                <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-[#1a2535]">
                                    <div className="text-center">
                                        <div className={`text-2xl font-bold ${selectedTenant.isExpired ? 'text-red-400' : 'text-green-400'}`}>
                                            {selectedTenant.daysRemaining}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">يوم متبقي</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-400">{selectedTenant.invoiceCount}</div>
                                        <div className="text-xs text-gray-500 mt-1">فاتورة صُدرت</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-purple-400">{selectedTenant.maxInvoices}</div>
                                        <div className="text-xs text-gray-500 mt-1">حد الفواتير</div>
                                    </div>
                                </div>

                                {/* Trial Actions */}
                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={() => handleTrialAction(selectedTenant.subdomain, 'extend')}
                                        disabled={!!actionLoading}
                                        className="flex-1 py-2 text-sm border border-green-500/40 text-green-400 rounded-lg hover:bg-green-500/10 transition disabled:opacity-50"
                                    >
                                        {actionLoading === `${selectedTenant.subdomain}_extend` ? '...' : '⏱️ مد فترة التجربة +30 يوم'}
                                    </button>
                                    <button
                                        onClick={() => handleTrialAction(selectedTenant.subdomain, 'activate_paid')}
                                        disabled={!!actionLoading}
                                        className="flex-1 py-2 text-sm border border-purple-500/40 text-purple-400 rounded-lg hover:bg-purple-500/10 transition disabled:opacity-50"
                                    >
                                        {actionLoading === `${selectedTenant.subdomain}_activate_paid` ? '...' : '💎 تحويل لاشتراك مدفوع'}
                                    </button>
                                </div>
                            </div>

                            {/* Module Toggle */}
                            <div className="bg-[#0d1117] border border-[#1a2535] rounded-xl p-6">
                                <h2 className="text-sm font-bold text-[#00ff94] mb-4 tracking-widest">⚡ تحكم في الوحدات</h2>
                                <div className="space-y-3">
                                    {ALL_MODULES.map(mod => {
                                        const isHidden = selectedTenant.hiddenModules.includes(mod.key);
                                        const isToggling = togglingModule === `${selectedTenant.subdomain}_${mod.key}`;
                                        return (
                                            <div key={mod.key} className="flex items-center justify-between p-3 border border-[#1a2535] rounded-lg hover:border-[#00ff9430] transition">
                                                <span className="text-sm text-gray-300">{mod.label}</span>
                                                <button
                                                    onClick={() => toggleModule(selectedTenant.subdomain, mod.key, isHidden)}
                                                    disabled={isToggling}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isHidden ? 'bg-gray-700' : 'bg-[#00ff94]/70'} disabled:opacity-50`}
                                                >
                                                    <span
                                                        className={`inline-block w-4 h-4 transform rounded-full bg-white shadow transition-transform ${isHidden ? 'translate-x-1' : 'translate-x-6'}`}
                                                    />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
