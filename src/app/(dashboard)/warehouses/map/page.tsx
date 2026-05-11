'use client';
import { useState, useEffect } from 'react';
import { Package, Thermometer, AlertTriangle, Layers, Map as MapIcon, Maximize2, Search, Zap, Activity } from 'lucide-react';

export default function WarehouseMapPage() {
  const [mounted, setMounted] = useState(false);
  const [activeZone, setActiveZone] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  const warehouseZones = [
    { id: 'receiving', name: 'منطقة الاستلام', type: 'inbound', capacity: 85, color: 'border-blue-500 bg-blue-50 text-blue-700', icon: <Package className="w-5 h-5" /> },
    { id: 'storage_a', name: 'مخزن رئيسي A', type: 'storage', capacity: 92, color: 'border-slate-500 bg-slate-50 text-slate-700', icon: <Layers className="w-5 h-5" /> },
    { id: 'storage_b', name: 'مخزن فرعي B', type: 'storage', capacity: 45, color: 'border-slate-500 bg-slate-50 text-slate-700', icon: <Layers className="w-5 h-5" /> },
    { id: 'cold_storage', name: 'مخزن مبرد (Cold)', type: 'special', capacity: 60, temp: '-18°C', color: 'border-cyan-500 bg-cyan-50 text-cyan-700', icon: <Thermometer className="w-5 h-5" /> },
    { id: 'picking', name: 'منطقة التجهيز (Picking)', type: 'operation', capacity: 78, color: 'border-amber-500 bg-amber-50 text-amber-700', icon: <Activity className="w-5 h-5" /> },
    { id: 'dispatch', name: 'منطقة التحميل', type: 'outbound', capacity: 30, color: 'border-emerald-500 bg-emerald-50 text-emerald-700', icon: <Zap className="w-5 h-5" /> },
  ];

  if (!mounted) return null;

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <span className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <MapIcon className="w-6 h-6" />
            </span>
            خريطة المستودع التفاعلية (WMS)
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            مراقبة حية للمساحات التخزينية، حركة البضائع، ومناطق التحضير والاستلام.
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            <input type="text" placeholder="البحث عن صنف أو رف..." className="w-full pr-9 pl-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors flex items-center gap-2">
            <Maximize2 className="w-4 h-4" /> ملء الشاشة
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Layout Map */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-500" />
            مخطط الطابق (Floor Plan)
          </h2>
          
          {/* Interactive Map Canvas Simulation */}
          <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 p-6 min-h-[500px] relative">
            <div className="grid grid-cols-4 grid-rows-3 gap-4 h-[450px]">
              {/* Receiving - Span 2 rows */}
              <div 
                className={`col-span-1 row-span-2 border-2 rounded-xl p-4 cursor-pointer transition-all ${activeZone === 'receiving' ? 'ring-4 ring-blue-200 shadow-md scale-[1.02]' : 'hover:shadow-md'} border-blue-400 bg-blue-50 flex flex-col justify-between`}
                onClick={() => setActiveZone('receiving')}
              >
                <div className="text-blue-800 font-bold">منطقة الاستلام</div>
                <div className="text-3xl font-black text-blue-300 opacity-50">IN</div>
              </div>

              {/* Main Storage */}
              <div 
                className={`col-span-2 row-span-1 border-2 rounded-xl p-4 cursor-pointer transition-all ${activeZone === 'storage_a' ? 'ring-4 ring-slate-200 shadow-md scale-[1.02]' : 'hover:shadow-md'} border-slate-300 bg-white flex flex-col justify-between`}
                onClick={() => setActiveZone('storage_a')}
              >
                <div className="text-slate-700 font-bold text-center">مخزن رئيسي A</div>
                <div className="flex justify-around mt-4">
                  {[1,2,3,4,5].map(i => <div key={i} className="w-8 h-12 bg-slate-100 border border-slate-300 rounded" />)}
                </div>
              </div>

              {/* Cold Storage */}
              <div 
                className={`col-span-1 row-span-1 border-2 rounded-xl p-4 cursor-pointer transition-all ${activeZone === 'cold_storage' ? 'ring-4 ring-cyan-200 shadow-md scale-[1.02]' : 'hover:shadow-md'} border-cyan-400 bg-cyan-50 flex flex-col justify-between`}
                onClick={() => setActiveZone('cold_storage')}
              >
                <div className="text-cyan-800 font-bold flex justify-between items-center">
                  مبرد <span>❄️</span>
                </div>
                <div className="text-2xl font-black text-cyan-600">-18°C</div>
              </div>

              {/* Sub Storage B */}
              <div 
                className={`col-span-1 row-span-1 border-2 rounded-xl p-4 cursor-pointer transition-all ${activeZone === 'storage_b' ? 'ring-4 ring-slate-200 shadow-md scale-[1.02]' : 'hover:shadow-md'} border-slate-300 bg-white flex flex-col justify-between`}
                onClick={() => setActiveZone('storage_b')}
              >
                <div className="text-slate-700 font-bold">مخزن فرعي B</div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-2"><div className="h-full bg-slate-400 w-[45%]" /></div>
              </div>

              {/* Picking Zone */}
              <div 
                className={`col-span-2 row-span-1 border-2 rounded-xl p-4 cursor-pointer transition-all ${activeZone === 'picking' ? 'ring-4 ring-amber-200 shadow-md scale-[1.02]' : 'hover:shadow-md'} border-amber-400 bg-amber-50 flex flex-col justify-between`}
                onClick={() => setActiveZone('picking')}
              >
                <div className="text-amber-800 font-bold">منطقة التجهيز (Picking)</div>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-1 bg-amber-200 text-amber-800 rounded text-xs">أوامر نشطة: 12</span>
                  <span className="px-2 py-1 bg-amber-200 text-amber-800 rounded text-xs">عمال: 4</span>
                </div>
              </div>

              {/* Dispatch - Span 3 cols */}
              <div 
                className={`col-span-4 row-span-1 border-2 rounded-xl p-4 cursor-pointer transition-all ${activeZone === 'dispatch' ? 'ring-4 ring-emerald-200 shadow-md scale-[1.02]' : 'hover:shadow-md'} border-emerald-400 bg-emerald-50 flex flex-col justify-between items-end`}
                onClick={() => setActiveZone('dispatch')}
              >
                <div className="text-emerald-800 font-bold text-left w-full">منطقة التحميل (Dispatch)</div>
                <div className="flex gap-6 mt-4 w-full">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex-1 h-8 bg-emerald-200 border border-emerald-400 rounded flex items-center justify-center text-emerald-800 font-bold text-xs">Gate {i}</div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Side: Zones Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 mb-6">تفاصيل المناطق</h2>
          
          <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {warehouseZones.map((zone) => {
              const isHigh = zone.capacity > 85;
              return (
                <div 
                  key={zone.id} 
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${activeZone === zone.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-indigo-200'} `}
                  onClick={() => setActiveZone(zone.id)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg border ${zone.color}`}>
                      {zone.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800">{zone.name}</h3>
                      {zone.temp && <span className="text-xs font-bold text-cyan-600 bg-cyan-100 px-2 py-0.5 rounded">{zone.temp}</span>}
                    </div>
                    <div className="text-right">
                      <span className={`text-lg font-black ${isHigh ? 'text-red-600' : 'text-slate-700'}`}>{zone.capacity}%</span>
                    </div>
                  </div>
                  
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${isHigh ? 'bg-red-500' : 'bg-indigo-500'}`} 
                      style={{ width: `${zone.capacity}%` }}
                    />
                  </div>
                  {isHigh && (
                    <div className="mt-2 text-xs text-red-600 flex items-center gap-1 font-semibold">
                      <AlertTriangle className="w-3 h-3" /> تنبيه: سعة تخزينية مرتفعة
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button className="w-full mt-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors">
            تصدير تقرير الإشغال
          </button>
        </div>

      </div>
    </div>
  );
}
