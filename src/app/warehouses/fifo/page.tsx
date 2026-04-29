'use client';
import { useState } from 'react';

// FIFO/FEFO batch tracker â€” shows expiry-ordered stock for safe dispensing
const MOCK_BATCHES = [
    { id: 1, product: 'ط¨ط§ط±ط§ط³ظٹطھط§ظ…ظˆظ„ 500ظ…ط¬', lot: 'LOT-2023-12', qty: 240, expiry: '2026-05-15', location: 'A-R2-C3', status: 'critical', daysLeft: 16 },
    { id: 2, product: 'ط¨ط§ط±ط§ط³ظٹطھط§ظ…ظˆظ„ 500ظ…ط¬', lot: 'LOT-2024-03', qty: 500, expiry: '2026-09-30', location: 'A-R2-C4', status: 'ok', daysLeft: 154 },
    { id: 3, product: 'ط£ظ…ظˆظƒط³ظٹط³ظٹظ„ظٹظ† 250ظ…ط¬', lot: 'LOT-2024-01', qty: 180, expiry: '2026-06-10', location: 'B-R1-C2', status: 'warning', daysLeft: 42 },
    { id: 4, product: 'ط£ظ…ظˆظƒط³ظٹط³ظٹظ„ظٹظ† 250ظ…ط¬', lot: 'LOT-2024-06', qty: 420, expiry: '2026-12-01', location: 'B-R1-C3', status: 'ok', daysLeft: 216 },
    { id: 5, product: 'ظ…ظٹطھظپظˆط±ظ…ظٹظ† 500ظ…ط¬', lot: 'LOT-2023-10', qty: 60, expiry: '2026-04-30', location: 'C-R3-C1', status: 'expired', daysLeft: 1 },
    { id: 6, product: 'ظ…ظٹطھظپظˆط±ظ…ظٹظ† 500ظ…ط¬', lot: 'LOT-2024-04', qty: 380, expiry: '2026-10-15', location: 'C-R3-C2', status: 'ok', daysLeft: 169 },
    { id: 7, product: 'ط£ظˆظ…ظٹط¨ط±ط§ط²ظˆظ„ 20ظ…ط¬', lot: 'LOT-2024-02', qty: 150, expiry: '2026-07-20', location: 'A-R4-C1', status: 'warning', daysLeft: 82 },
    { id: 8, product: 'ظپظٹطھط§ظ…ظٹظ† ط³ظٹ 1000ظ…ط¬', lot: 'LOT-2024-05', qty: 800, expiry: '2027-02-28', location: 'D-R1-C5', status: 'ok', daysLeft: 305 },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; row: string }> = {
    expired: { label: 'ًں”´ ظ…ظ†طھظ‡ظٹ', color: 'text-red-400 bg-red-500/10 border-red-500/30', row: 'border-red-500/20 bg-red-500/5' },
    critical: { label: 'ًںں  ط­ط±ط¬ (<30)', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30', row: 'border-orange-500/20' },
    warning: { label: 'ًںں، ظ‚ط±ط¨ ط§ظ„ط§ظ†طھظ‡ط§ط،', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', row: 'border-amber-500/10' },
    ok: { label: 'ًںں¢ ط¬ظٹط¯', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', row: '' },
};

export default function FIFOPage() {
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    const filtered = MOCK_BATCHES
        .filter(b => filter === 'all' ? true : b.status === filter)
        .filter(b => search ? b.product.includes(search) || b.lot.includes(search) : true)
        .sort((a, b) => a.daysLeft - b.daysLeft); // FEFO: First Expiry First Out

    const counts = {
        expired: MOCK_BATCHES.filter(b=>b.status==='expired').length,
        critical: MOCK_BATCHES.filter(b=>b.status==='critical').length,
        warning: MOCK_BATCHES.filter(b=>b.status==='warning').length,
        ok: MOCK_BATCHES.filter(b=>b.status==='ok').length,
    };

    return (
        <div className="min-h-screen p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">ًں“¦ ط¥ط¯ط§ط±ط© FIFO / FEFO</h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1">طھطھط¨ط¹ ط§ظ„ط¯ظپط¹ط§طھ ظˆط§ظ„طµظ„ط§ط­ظٹط§طھ â€” ط§ظ„ط£ظˆظ„ ط§ظ†طھظ‡ط§ط،ظ‹ ظ‡ظˆ ط§ظ„ط£ظˆظ„ طµط±ظپط§ظ‹</p>
                </div>
                <div className="flex items-center gap-2 text-xs bg-blue-500/10 border border-blue-500/20 px-3 py-2 rounded-lg text-blue-400">
                    âڑ، ظ†ط¸ط§ظ… FEFO ظ…ظپط¹ظ‘ظ„
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'ظ…ظ†طھظ‡ظٹ ط§ظ„طµظ„ط§ط­ظٹط©', value: counts.expired, color: 'red', action: 'ظٹط¬ط¨ ط¥طھظ„ط§ظپظ‡ ظپظˆط±ط§ظ‹' },
                    { label: 'ط­ط±ط¬ (<30 ظٹظˆظ…)', value: counts.critical, color: 'orange', action: 'ط£ظˆظ„ظˆظٹط© ط§ظ„طµط±ظپ' },
                    { label: 'ظ‚ط±ط¨ ط§ظ„ط§ظ†طھظ‡ط§ط،', value: counts.warning, color: 'amber', action: 'ط±ط§ظ‚ط¨ ط¹ظ† ظƒط«ط¨' },
                    { label: 'ط¯ظپط¹ط§طھ ط³ظ„ظٹظ…ط©', value: counts.ok, color: 'emerald', action: 'ط¶ظ…ظ† ط§ظ„ظ…ط¹ظٹط§ط±' },
                ].map(k => (
                    <div key={k.label} className={`rounded-2xl border p-4 ${
                        k.color==='red'?'bg-red-500/10 border-red-500/20':
                        k.color==='orange'?'bg-orange-500/10 border-orange-500/20':
                        k.color==='amber'?'bg-amber-500/10 border-amber-500/20':
                        'bg-emerald-500/10 border-emerald-500/20'}`}>
                        <div className="text-2xl font-bold text-[var(--text)]">{k.value}</div>
                        <div className="text-xs font-medium mt-1">{k.label}</div>
                        <div className="text-xs text-[var(--text-secondary)] mt-0.5">{k.action}</div>
                    </div>
                ))}
            </div>

            {/* Search + filter */}
            <div className="flex flex-wrap gap-3 mb-5">
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ط§ط¨ط­ط« ط¨ط§ظ„ظ…ظ†طھط¬ ط£ظˆ ط§ظ„ظ€ LOT..."
                    className="input text-sm w-64 focus:outline-none focus:border-blue-500" />
                <div className="flex gap-2">
                    {[['all','ط§ظ„ظƒظ„'],['expired','ظ…ظ†طھظ‡ظٹ'],['critical','ط­ط±ط¬'],['warning','طھط­ط°ظٹط±'],['ok','ط³ظ„ظٹظ…']].map(([k,l]) => (
                        <button key={k} onClick={() => setFilter(k)}
                            className={`px-4 py-2 rounded-lg text-sm transition-all ${filter===k?'btn-primary':'btn btn-ghost'}`}>{l} {k!=='all'?`(${counts[k as keyof typeof counts]??''})`:''}</button>
                    ))}
                </div>
            </div>

            {/* Batches table */}
            <div className="card overflow-hidden">
                <div className="p-3 border-b border-[var(--border)] text-xs text-[var(--text-secondary)]">
                    ظ…ط±طھظ‘ط¨ ط¨ظ€ FEFO â€” ط§ظ„ط£ط³ط±ط¹ ط§ظ†طھظ‡ط§ط،ظ‹ ظپظٹ ط§ظ„ط£ط¹ظ„ظ‰
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-xs">
                            <th className="text-right p-3">ط§ظ„ظ…ظ†طھط¬</th>
                            <th className="text-right p-3">ط±ظ‚ظ… ط§ظ„ط¯ظپط¹ط©</th>
                            <th className="text-right p-3">ط§ظ„ظƒظ…ظٹط©</th>
                            <th className="text-right p-3">ط§ظ„ظ…ظˆظ‚ط¹</th>
                            <th className="text-right p-3">طھط§ط±ظٹط® ط§ظ„ط§ظ†طھظ‡ط§ط،</th>
                            <th className="text-right p-3">ط§ظ„ط£ظٹط§ظ… ط§ظ„ظ…طھط¨ظ‚ظٹط©</th>
                            <th className="text-right p-3">ط§ظ„ط­ط§ظ„ط©</th>
                            <th className="text-right p-3">ط¥ط¬ط±ط§ط،</th>
                        </tr></thead>
                        <tbody>
                            {filtered.map(b => (
                                <tr key={b.id} className={`border-b border-[var(--border-light)] hover:bg-[var(--bg-card-hover)] ${STATUS_CONFIG[b.status]?.row}`}>
                                    <td className="p-3 font-medium">{b.product}</td>
                                    <td className="p-3 font-mono text-xs text-[var(--text-muted)]">{b.lot}</td>
                                    <td className="p-3 text-[var(--text-secondary)]">{b.qty}</td>
                                    <td className="p-3 font-mono text-xs text-blue-400">{b.location}</td>
                                    <td className="p-3 text-[var(--text-secondary)]">{b.expiry}</td>
                                    <td className={`p-3 font-bold ${b.daysLeft<=0?'text-red-400':b.daysLeft<=30?'text-orange-400':b.daysLeft<=90?'text-amber-400':'text-emerald-400'}`}>
                                        {b.daysLeft <= 0 ? 'ظ…ظ†طھظ‡ظٹ!' : `${b.daysLeft} ظٹظˆظ…`}
                                    </td>
                                    <td className="p-3">
                                        <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_CONFIG[b.status]?.color}`}>{STATUS_CONFIG[b.status]?.label}</span>
                                    </td>
                                    <td className="p-3">
                                        {b.status === 'expired' && <button className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30">ًں—‘ï¸ڈ ط¥طھظ„ط§ظپ</button>}
                                        {b.status === 'critical' && <button className="text-xs px-2 py-1 bg-orange-500/20 text-orange-400 rounded hover:bg-orange-500/30">âڑ، ط£ظˆظ„ظˆظٹط©</button>}
                                        {b.status === 'ok' && <button className="text-xs px-2 py-1 bg-gray-800 text-[var(--text-muted)] rounded hover:bg-gray-700">ًں“‹ ط¹ط±ط¶</button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

