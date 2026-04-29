'use client';
import { useState, useEffect } from 'react';

// Live Shift Monitor â€” ظ…ط´ط±ظپ ط§ظ„ظƒط§ط´ظٹط± ظٹط±ط§ظ‚ط¨ ط¬ظ…ظٹط¹ ط§ظ„ظƒط§ط´ظٹط±ط§طھ ظ„ط­ط¸ظٹط§ظ‹
const MOCK_CASHIERS = [
    { id: 1, name: 'ط£ط­ظ…ط¯ ط§ظ„ط¹ظ…ط±ظٹ', register: 'ظƒط§ط´ظٹط± 1', status: 'active', sales: 3420, invoices: 18, cash: 2100, card: 1320, openSince: '08:00', lastTx: '2 ط¯ظ‚ظٹظ‚ط©' },
    { id: 2, name: 'ط³ط§ط±ط© ط§ظ„ظ…ط·ظٹط±ظٹ', register: 'ظƒط§ط´ظٹط± 2', status: 'active', sales: 2180, invoices: 12, cash: 980, card: 1200, openSince: '08:15', lastTx: '5 ط¯ظ‚ط§ط¦ظ‚' },
    { id: 3, name: 'ط®ط§ظ„ط¯ ط§ظ„ط²ظ‡ط±ط§ظ†ظٹ', register: 'ظƒط§ط´ظٹط± 3', status: 'break', sales: 1750, invoices: 9, cash: 1750, card: 0, openSince: '08:00', lastTx: '18 ط¯ظ‚ظٹظ‚ط©' },
    { id: 4, name: 'ظ†ظˆط±ط© ط§ظ„ط´ظ…ط±ظٹ', register: 'ظƒط§ط´ظٹط± 4', status: 'idle', sales: 890, invoices: 5, cash: 400, card: 490, openSince: '09:00', lastTx: '32 ط¯ظ‚ظٹظ‚ط©' },
];

const STATUS_CFG: Record<string, { label: string; dot: string; card: string }> = {
    active: { label: 'ًںں¢ ظ†ط´ط·', dot: 'bg-emerald-500 animate-pulse', card: 'border-emerald-500/20 bg-emerald-500/5' },
    break: { label: 'ًںں، ط§ط³طھط±ط§ط­ط©', dot: 'bg-amber-500', card: 'border-amber-500/20 bg-amber-500/5' },
    idle: { label: 'âڑھ ط®ط§ظ…ظ„', dot: 'bg-gray-400', card: 'border-gray-700 bg-[var(--bg-card)]' },
    closed: { label: 'ًں”´ ظ…ط؛ظ„ظ‚', dot: 'bg-red-500', card: 'border-red-500/20 bg-red-500/5' },
};

export default function ShiftMonitorPage() {
    const [cashiers, setCashiers] = useState(MOCK_CASHIERS);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const iv = setInterval(() => {
            setTick(t => t + 1);
            setCashiers(prev => prev.map(c =>
                c.status === 'active' ? {
                    ...c,
                    sales: c.sales + Math.floor(Math.random() * 120),
                    invoices: c.invoices + (Math.random() > 0.7 ? 1 : 0),
                    lastTx: 'ط§ظ„ط¢ظ†',
                } : c
            ));
        }, 10000);
        return () => clearInterval(iv);
    }, []);

    const totalSales = cashiers.reduce((s, c) => s + c.sales, 0);
    const totalInvoices = cashiers.reduce((s, c) => s + c.invoices, 0);
    const activeCashiers = cashiers.filter(c => c.status === 'active').length;

    return (
        <div className="min-h-screen p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">ًں“؛ ظ…ط±ط§ظ‚ط¨ط© ط§ظ„ظ…ظ†ط§ظˆط¨ط© â€” ظ„ط­ط¸ظٹ</h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1">ظ„ظˆط­ط© ظ…ط´ط±ظپ ط§ظ„ظƒط§ط´ظٹط± â€” ط¬ظ…ظٹط¹ ط§ظ„ظƒط§ط´ظٹط±ط§طھ ظپظٹ ط§ظ„ظˆظ‚طھ ط§ظ„ظپط¹ظ„ظٹ</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    ظ…ط¨ط§ط´ط± â€” ظٹطھط¬ط¯ط¯ ظƒظ„ 10 ط«ظˆط§ظ†ظچ
                </div>
            </div>

            {/* Summary KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'ط¥ط¬ظ…ط§ظ„ظٹ ظ…ط¨ظٹط¹ط§طھ ط§ظ„ظٹظˆظ…', value: `${totalSales.toLocaleString()} ط±.ط³`, icon: 'ًں’°', color: 'emerald' },
                    { label: 'ط¹ط¯ط¯ ط§ظ„ظپظˆط§طھظٹط±', value: totalInvoices, icon: 'ًں§¾', color: 'blue' },
                    { label: 'ظƒط§ط´ظٹط±ط§طھ ظ†ط´ط·ط©', value: `${activeCashiers} / ${cashiers.length}`, icon: 'ًں‘¤', color: activeCashiers < 2 ? 'red' : 'emerald' },
                    { label: 'ظ…طھظˆط³ط· ط§ظ„ظپط§طھظˆط±ط©', value: `${totalInvoices > 0 ? Math.round(totalSales / totalInvoices).toLocaleString() : 0} ط±.ط³`, icon: 'ًں“ٹ', color: 'purple' },
                ].map(k => (
                    <div key={k.label} className={`rounded-2xl border p-4 ${
                        k.color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20' :
                        k.color === 'blue' ? 'bg-blue-500/10 border-blue-500/20' :
                        k.color === 'red' ? 'bg-red-500/10 border-red-500/20' :
                        'bg-purple-500/10 border-purple-500/20'}`}>
                        <div className="text-2xl mb-2">{k.icon}</div>
                        <div className="text-xl font-bold text-[var(--text)]">{k.value}</div>
                        <div className="text-xs text-[var(--text-muted)] mt-1">{k.label}</div>
                    </div>
                ))}
            </div>

            {/* Cashier cards grid */}
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                {cashiers.map(c => (
                    <div key={c.id} className={`rounded-2xl border p-5 ${STATUS_CFG[c.status]?.card}`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${STATUS_CFG[c.status]?.dot}`}></span>
                                <span className="text-xs text-[var(--text-muted)]">{STATUS_CFG[c.status]?.label}</span>
                            </div>
                            <span className="text-xs font-mono text-[var(--text-secondary)]">{c.register}</span>
                        </div>
                        <h3 className="font-semibold text-[var(--text)] mb-3">{c.name}</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-[var(--text-muted)]">ط§ظ„ظ…ط¨ظٹط¹ط§طھ</span>
                                <span className="text-emerald-400 font-bold">{c.sales.toLocaleString()} ط±.ط³</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--text-muted)]">ط§ظ„ظپظˆط§طھظٹط±</span>
                                <span className="text-[var(--text)]">{c.invoices}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--text-muted)]">ظ†ظ‚ط¯ / ط´ط¨ظƒط©</span>
                                <span className="text-[var(--text-secondary)] text-xs">{c.cash.toLocaleString()} / {c.card.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--text-muted)]">ط¢ط®ط± ظ…ط¹ط§ظ…ظ„ط©</span>
                                <span className={`text-xs ${c.lastTx === 'ط§ظ„ط¢ظ†' ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`}>{c.lastTx}</span>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-700/50 flex gap-2">
                            <button className="flex-1 text-xs py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">ًں’¬ طھظˆط§طµظ„</button>
                            {c.status === 'idle' && (
                                <button className="flex-1 text-xs py-1.5 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors">âڑ ï¸ڈ طھظ†ط¨ظٹظ‡</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Live transactions ticker */}
            <div className="card p-4">
                <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    <h3 className="text-sm font-semibold text-[var(--text-secondary)]">ط¢ط®ط± ط§ظ„ظ…ط¹ط§ظ…ظ„ط§طھ â€” ظ…ط¨ط§ط´ط±</h3>
                </div>
                <div className="space-y-2">
                    {[
                        { time: new Date().toTimeString().slice(0,5), cashier: 'ط£ط­ظ…ط¯ ط§ظ„ط¹ظ…ط±ظٹ', amount: 245, type: 'ط´ط¨ظƒط©' },
                        { time: '07:48', cashier: 'ط³ط§ط±ط© ط§ظ„ظ…ط·ظٹط±ظٹ', amount: 120, type: 'ظ†ظ‚ط¯' },
                        { time: '07:45', cashier: 'ط£ط­ظ…ط¯ ط§ظ„ط¹ظ…ط±ظٹ', amount: 890, type: 'ط´ط¨ظƒط©' },
                        { time: '07:41', cashier: 'ظ†ظˆط±ط© ط§ظ„ط´ظ…ط±ظٹ', amount: 65, type: 'ظ†ظ‚ط¯' },
                        { time: '07:38', cashier: 'ط³ط§ط±ط© ط§ظ„ظ…ط·ظٹط±ظٹ', amount: 310, type: 'ط´ط¨ظƒط©' },
                    ].map((tx, i) => (
                        <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-[var(--border-light)] last:border-0">
                            <span className="font-mono text-[var(--text-secondary)] text-xs">{tx.time}</span>
                            <span className="text-[var(--text-muted)]">{tx.cashier}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${tx.type === 'ط´ط¨ظƒط©' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{tx.type}</span>
                            <span className="text-[var(--text)] font-bold">{tx.amount.toLocaleString()} ط±.ط³</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

