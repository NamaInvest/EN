'use client';
import { useState, useEffect } from 'react';

const ZONES = [
    { id: 'A', name: 'Zone A — جاف', color: '#3b82f6', rows: 4, cols: 6 },
    { id: 'B', name: 'Zone B — مبرّد', color: '#06b6d4', rows: 3, cols: 5 },
    { id: 'C', name: 'Zone C — ثقيل', color: '#8b5cf6', rows: 3, cols: 4 },
    { id: 'D', name: 'Zone D — وافد جديد', color: '#f59e0b', rows: 2, cols: 6 },
];

type BinStatus = 'empty' | 'low' | 'normal' | 'full' | 'blocked';

const BIN_COLORS: Record<BinStatus, string> = {
    empty: '#1f2937',
    low: '#ef4444',
    normal: '#22c55e',
    full: '#3b82f6',
    blocked: '#6b7280',
};

const randomStatus = (): BinStatus => {
    const r = Math.random();
    if (r < 0.2) return 'empty';
    if (r < 0.35) return 'low';
    if (r < 0.75) return 'normal';
    if (r < 0.9) return 'full';
    return 'blocked';
};

export default function WMSMapPage() {
    const [selectedZone, setSelectedZone] = useState('A');
    const [selectedBin, setSelectedBin] = useState<string | null>(null);
    const [bins, setBins] = useState<Record<string, BinStatus>>({});
    const [filter, setFilter] = useState<BinStatus | 'all'>('all');

    useEffect(() => {
        // Generate demo bin statuses
        const generated: Record<string, BinStatus> = {};
        ZONES.forEach(z => {
            for (let r = 1; r <= z.rows; r++) {
                for (let c = 1; c <= z.cols; c++) {
                    generated[`${z.id}-R${r}-C${c}`] = randomStatus();
                }
            }
        });
        setBins(generated);
    }, []);

    const zone = ZONES.find(z => z.id === selectedZone)!;

    const stats = Object.values(bins).reduce((acc, s) => {
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const totalBins = Object.keys(bins).length;

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">🏭 خريطة المستودع (WMS)</h1>
                    <p className="text-gray-400 text-sm mt-1">عرض تفاعلي لجميع مناطق وأرفف المستودع</p>
                </div>
                <div className="text-sm text-gray-400 bg-gray-900 px-4 py-2 rounded-xl border border-gray-800">
                    إجمالي الخلايا: <span className="text-white font-bold">{totalBins}</span>
                </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {([['empty','فارغة','🔲'],['low','منخفض','🔴'],['normal','عادي','🟢'],['full','ممتلئة','🔵'],['blocked','محجوب','⬛']] as [BinStatus,string,string][]).map(([s,label,icon]) => (
                    <button key={s} onClick={() => setFilter(filter === s ? 'all' : s)}
                        className={`p-3 rounded-xl border transition-all text-center ${filter === s ? 'border-white' : 'border-gray-800'} bg-gray-900 hover:border-gray-600`}>
                        <div className="text-xl">{icon}</div>
                        <div className="text-xl font-bold text-white">{stats[s] || 0}</div>
                        <div className="text-xs text-gray-400">{label}</div>
                    </button>
                ))}
            </div>

            <div className="grid lg:grid-cols-4 gap-4 mb-6">
                {/* Zone tabs */}
                <div className="lg:col-span-1 space-y-2">
                    <p className="text-xs text-gray-500 mb-3 font-semibold uppercase tracking-wider">المناطق</p>
                    {ZONES.map(z => {
                        const zBins = Object.entries(bins).filter(([k]) => k.startsWith(z.id + '-'));
                        const lowCount = zBins.filter(([,v]) => v === 'low').length;
                        return (
                            <button key={z.id} onClick={() => setSelectedZone(z.id)}
                                className={`w-full text-right p-3 rounded-xl border transition-all ${selectedZone === z.id ? 'border-blue-500 bg-blue-500/10' : 'border-gray-800 bg-gray-900 hover:border-gray-700'}`}>
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-sm">{z.name}</span>
                                    {lowCount > 0 && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">{lowCount} منخفض</span>}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">{z.rows} صفوف × {z.cols} أعمدة</div>
                            </button>
                        );
                    })}
                </div>

                {/* Grid map */}
                <div className="lg:col-span-3 bg-gray-900 rounded-2xl border border-gray-800 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">{zone.name}</h3>
                        <div className="flex gap-3 text-xs text-gray-500">
                            {(['empty','low','normal','full','blocked'] as BinStatus[]).map(s => (
                                <span key={s} className="flex items-center gap-1">
                                    <span className="inline-block w-3 h-3 rounded-sm" style={{ background: BIN_COLORS[s] }}></span>
                                    {s === 'empty' ? 'فارغ' : s === 'low' ? 'منخفض' : s === 'normal' ? 'عادي' : s === 'full' ? 'ممتلئ' : 'محجوب'}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Row/Col grid */}
                    <div className="overflow-auto">
                        <div className="inline-block">
                            {/* Column headers */}
                            <div className="flex gap-1.5 mb-1.5 mr-8">
                                {Array.from({ length: zone.cols }, (_, c) => (
                                    <div key={c} className="w-10 text-center text-xs text-gray-600">C{c + 1}</div>
                                ))}
                            </div>
                            {Array.from({ length: zone.rows }, (_, r) => (
                                <div key={r} className="flex gap-1.5 mb-1.5 items-center">
                                    <div className="w-7 text-xs text-gray-600 text-right">R{r + 1}</div>
                                    {Array.from({ length: zone.cols }, (_, c) => {
                                        const key = `${zone.id}-R${r + 1}-C${c + 1}`;
                                        const status = bins[key] || 'empty';
                                        const isFiltered = filter !== 'all' && status !== filter;
                                        const isSelected = selectedBin === key;
                                        return (
                                            <button key={c} onClick={() => setSelectedBin(isSelected ? null : key)}
                                                className={`w-10 h-10 rounded-md border transition-all text-xs font-mono ${isSelected ? 'ring-2 ring-white scale-110' : ''} ${isFiltered ? 'opacity-10' : 'hover:scale-105'}`}
                                                style={{ background: BIN_COLORS[status], borderColor: isSelected ? '#fff' : `${BIN_COLORS[status]}66` }}
                                                title={key}>
                                                {isSelected ? '✓' : ''}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Selected bin info */}
                    {selectedBin && (
                        <div className="mt-4 p-3 bg-gray-800 rounded-xl border border-gray-700 text-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-gray-400">الخلية:</span> <span className="font-mono text-white font-bold">{selectedBin}</span>
                                    <span className="ml-3 text-gray-400">الحالة:</span>
                                    <span className="ml-1 font-medium" style={{ color: BIN_COLORS[bins[selectedBin]] }}>
                                        {bins[selectedBin] === 'empty' ? 'فارغة' : bins[selectedBin] === 'low' ? 'مخزون منخفض' : bins[selectedBin] === 'normal' ? 'طبيعي' : bins[selectedBin] === 'full' ? 'ممتلئة' : 'محجوبة'}
                                    </span>
                                </div>
                                <button onClick={() => setSelectedBin(null)} className="text-gray-500 hover:text-white text-xs">✕ إغلاق</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
