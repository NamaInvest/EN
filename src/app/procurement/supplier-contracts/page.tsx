'use client';
import { useState, useEffect } from 'react';

export default function SupplierContractsPage() {
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [filter, setFilter] = useState('all');
    const [form, setForm] = useState({
        supplierId: '', supplierName: '', title: '', value: '',
        startDate: '', endDate: '', terms: '', status: 'active',
    });

    const fetchContracts = async () => {
        setLoading(true);
        try {
            const q = filter === 'expiring' ? '&expiringSoon=true' : filter !== 'all' ? `&status=${filter}` : '';
            const res = await fetch(`/api/procurement/supplier-contracts?${q}`);
            const data = await res.json();
            setContracts(data.contracts || []);
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchContracts(); }, [filter]);

    const save = async () => {
        await fetch('/api/procurement/supplier-contracts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...form, value: parseFloat(form.value) }),
        });
        setShowForm(false);
        fetchContracts();
    };

    const statusBadge = (status: string) => ({
        active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        expired: 'bg-red-500/20 text-red-400 border-red-500/30',
        terminated: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    }[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30');

    const statusLabel = (s: string) => ({ active: '✅ نشط', expired: '❌ منتهي', terminated: '🚫 مُلغى' }[s] || s);

    const daysLeft = (endDate: string) => {
        const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
        return diff;
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">📄 عقود الموردين</h1>
                    <p className="text-gray-400 text-sm mt-1">إدارة ومتابعة عقود الموردين وتنبيهات الانتهاء</p>
                </div>
                <button onClick={() => setShowForm(true)} className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-xl font-medium text-sm transition-colors flex items-center gap-2">
                    <span>+</span> عقد جديد
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-5 overflow-x-auto">
                {[
                    { key: 'all', label: 'الكل' },
                    { key: 'active', label: '✅ نشطة' },
                    { key: 'expiring', label: '⏳ تنتهي قريباً' },
                    { key: 'expired', label: '❌ منتهية' },
                ].map(f => (
                    <button key={f.key} onClick={() => setFilter(f.key)}
                        className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${filter === f.key ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Contracts Grid */}
            {loading ? (
                <div className="text-center py-20 text-gray-500">جارٍ التحميل...</div>
            ) : contracts.length === 0 ? (
                <div className="text-center py-20">
                    <div className="text-5xl mb-3">📄</div>
                    <p className="text-gray-400">لا توجد عقود</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {contracts.map((c: any) => {
                        const days = c.endDate ? daysLeft(c.endDate) : null;
                        return (
                            <div key={c.id} className="bg-gray-900 rounded-2xl border border-gray-800 p-5 hover:border-gray-700 transition-all">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="text-xs text-gray-500 font-mono">{c.contractNo}</p>
                                        <h3 className="font-semibold text-white">{c.title}</h3>
                                        <p className="text-sm text-gray-400">{c.supplierName || c.supplier?.name}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full border ${statusBadge(c.status)}`}>
                                        {statusLabel(c.status)}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="bg-gray-800 rounded-lg p-2.5">
                                        <p className="text-gray-500 text-xs">قيمة العقد</p>
                                        <p className="text-white font-bold">{(c.value || 0).toLocaleString()} ر.س</p>
                                    </div>
                                    <div className={`rounded-lg p-2.5 ${days !== null && days <= 30 ? 'bg-red-500/10 border border-red-500/20' : 'bg-gray-800'}`}>
                                        <p className="text-gray-500 text-xs">تنتهي في</p>
                                        <p className={`font-bold ${days !== null && days <= 30 ? 'text-red-400' : 'text-white'}`}>
                                            {days !== null ? (days <= 0 ? 'منتهي' : `${days} يوم`) : '—'}
                                        </p>
                                    </div>
                                </div>
                                {c.startDate && (
                                    <p className="text-xs text-gray-600 mt-3">
                                        {c.startDate?.split('T')[0]} ← {c.endDate?.split('T')[0]}
                                    </p>
                                )}
                                {c.terms && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{c.terms}</p>}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg p-6">
                        <h2 className="text-lg font-bold mb-5">📄 إضافة عقد جديد</h2>
                        <div className="space-y-3">
                            {[
                                { key: 'supplierName', label: 'اسم المورد', type: 'text' },
                                { key: 'title', label: 'عنوان العقد', type: 'text' },
                                { key: 'value', label: 'قيمة العقد (ر.س)', type: 'number' },
                                { key: 'startDate', label: 'تاريخ البداية', type: 'date' },
                                { key: 'endDate', label: 'تاريخ الانتهاء', type: 'date' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="text-sm text-gray-400 block mb-1">{f.label}</label>
                                    <input type={f.type} value={(form as any)[f.key]}
                                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
                                </div>
                            ))}
                            <div>
                                <label className="text-sm text-gray-400 block mb-1">الشروط والبنود</label>
                                <textarea value={form.terms} onChange={e => setForm(p => ({ ...p, terms: e.target.value }))}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 h-20 resize-none" />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button onClick={save} className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-xl text-sm font-medium transition-colors">حفظ العقد</button>
                            <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm transition-colors">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
