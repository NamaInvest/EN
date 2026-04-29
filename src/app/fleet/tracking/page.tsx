'use client';
import { useState, useEffect } from 'react';

const MOCK_VEHICLES = [
    { id: 1, plate: 'أ ب ج 1234', driver: 'محمد العمري', status: 'moving', speed: 78, lat: 24.7136, lng: 46.6753, fuel: 65, lastUpdate: '2 دقيقة' },
    { id: 2, plate: 'د ه و 5678', driver: 'علي القحطاني', status: 'stopped', speed: 0, lat: 24.6877, lng: 46.7219, fuel: 42, lastUpdate: '5 دقائق' },
    { id: 3, plate: 'ز ح ط 9012', driver: 'سعد الزهراني', status: 'idle', speed: 0, lat: 24.7411, lng: 46.6310, fuel: 88, lastUpdate: '1 دقيقة' },
    { id: 4, plate: 'ي ك ل 3456', driver: 'فهد المطيري', status: 'moving', speed: 95, lat: 24.7250, lng: 46.6890, fuel: 30, lastUpdate: 'الآن' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
    moving: { label: '🚗 يتحرك', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-500' },
    stopped: { label: '🔴 متوقف', color: 'bg-red-500/20 text-red-400 border-red-500/30', dot: 'bg-red-500' },
    idle: { label: '🟡 خامل', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', dot: 'bg-amber-500' },
};

export default function FleetTrackingPage() {
    const [vehicles, setVehicles] = useState(MOCK_VEHICLES);
    const [selected, setSelected] = useState<number | null>(1);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const interval = setInterval(() => {
            setVehicles(prev => prev.map(v => ({
                ...v,
                speed: v.status === 'moving' ? Math.floor(60 + Math.random() * 40) : 0,
                lat: v.lat + (Math.random() - 0.5) * 0.001,
                lng: v.lng + (Math.random() - 0.5) * 0.001,
                lastUpdate: 'الآن',
            })));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const filtered = filter === 'all' ? vehicles : vehicles.filter(v => v.status === filter);
    const selectedVehicle = vehicles.find(v => v.id === selected);

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">🗺️ تتبع الأسطول (GPS)</h1>
                    <p className="text-gray-400 text-sm mt-1">مراقبة لحظية لمركبات الأسطول</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    مباشر
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'يتحرك', count: vehicles.filter(v=>v.status==='moving').length, color: 'emerald' },
                    { label: 'خامل', count: vehicles.filter(v=>v.status==='idle').length, color: 'amber' },
                    { label: 'متوقف', count: vehicles.filter(v=>v.status==='stopped').length, color: 'red' },
                ].map(s => (
                    <div key={s.label} className={`rounded-xl border p-3 text-center ${s.color==='emerald'?'bg-emerald-500/10 border-emerald-500/20':s.color==='amber'?'bg-amber-500/10 border-amber-500/20':'bg-red-500/10 border-red-500/20'}`}>
                        <div className="text-2xl font-bold text-white">{s.count}</div>
                        <div className="text-xs text-gray-400">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
                {/* Vehicle list */}
                <div className="space-y-3">
                    <div className="flex gap-2 mb-2">
                        {['all','moving','stopped'].map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${filter===f?'bg-blue-500 text-white':'bg-gray-900 text-gray-400 border border-gray-800'}`}>
                                {f==='all'?'الكل':f==='moving'?'يتحرك':'متوقف'}
                            </button>
                        ))}
                    </div>
                    {filtered.map(v => (
                        <button key={v.id} onClick={() => setSelected(v.id)}
                            className={`w-full text-right p-4 rounded-xl border transition-all ${selected===v.id?'border-blue-500 bg-blue-500/5':'border-gray-800 bg-gray-900 hover:border-gray-700'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[v.status].dot} ${v.status==='moving'?'animate-pulse':''}`}></span>
                                    <span className="font-mono text-sm text-white">{v.plate}</span>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_CONFIG[v.status].color}`}>{STATUS_CONFIG[v.status].label}</span>
                            </div>
                            <p className="text-sm text-gray-400">{v.driver}</p>
                            <div className="flex gap-3 mt-2 text-xs text-gray-500">
                                <span>⚡ {v.speed} كم/س</span>
                                <span>⛽ {v.fuel}%</span>
                                <span>🕐 {v.lastUpdate}</span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Map placeholder + vehicle details */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Map placeholder */}
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden" style={{ height: 280 }}>
                        <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                            <div className="absolute inset-0 opacity-10"
                                style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                            </div>
                            {vehicles.map(v => (
                                <div key={v.id}
                                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all ${selected===v.id?'scale-150 z-10':''}`}
                                    style={{ left: `${30 + (v.lng - 46.63) * 3000}%`, top: `${50 - (v.lat - 24.71) * 5000}%` }}
                                    onClick={() => setSelected(v.id)}>
                                    <div className={`w-4 h-4 rounded-full border-2 border-white ${STATUS_CONFIG[v.status].dot} ${v.status==='moving'?'animate-pulse':''}`}
                                        title={v.plate}></div>
                                </div>
                            ))}
                            <div className="absolute bottom-3 right-3 text-xs text-gray-600 bg-gray-900/80 px-2 py-1 rounded">
                                🗺️ خريطة تقريبية — اربط Google Maps API للخريطة الحقيقية
                            </div>
                        </div>
                    </div>

                    {/* Selected vehicle details */}
                    {selectedVehicle && (
                        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                            <h3 className="font-semibold mb-4">📋 تفاصيل المركبة — {selectedVehicle.plate}</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {[
                                    { label: 'السائق', value: selectedVehicle.driver, icon: '👤' },
                                    { label: 'الحالة', value: STATUS_CONFIG[selectedVehicle.status].label, icon: '📍' },
                                    { label: 'السرعة', value: `${selectedVehicle.speed} كم/س`, icon: '⚡' },
                                    { label: 'الوقود', value: `${selectedVehicle.fuel}%`, icon: '⛽' },
                                    { label: 'الإحداثيات', value: `${selectedVehicle.lat.toFixed(4)}, ${selectedVehicle.lng.toFixed(4)}`, icon: '🌐' },
                                    { label: 'آخر تحديث', value: selectedVehicle.lastUpdate, icon: '🕐' },
                                ].map(d => (
                                    <div key={d.label} className="bg-gray-800 rounded-xl p-3">
                                        <div className="text-lg mb-1">{d.icon}</div>
                                        <div className="text-sm font-medium text-white">{d.value}</div>
                                        <div className="text-xs text-gray-400">{d.label}</div>
                                    </div>
                                ))}
                            </div>
                            {selectedVehicle.fuel < 35 && (
                                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-400">
                                    ⛽ تنبيه: مستوى الوقود منخفض — يُنصح بالتزود قريباً
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
