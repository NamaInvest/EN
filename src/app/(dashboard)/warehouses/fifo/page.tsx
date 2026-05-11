'use client';
import { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle2, ArrowDownUp, RefreshCcw, Search, Filter } from 'lucide-react';

export default function FifoFefoPage() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => setMounted(true), []);

  const batches = [
    { id: 'B-2026-001', product: 'باراسيتامول 500mg', type: 'FEFO', stock: 1200, unit: 'علبة', expiry: '2026-08-15', received: '2024-01-10', status: 'critical', statusText: 'يقترب من الانتهاء' },
    { id: 'B-2026-002', product: 'أموكسيسيلين 250mg', type: 'FEFO', stock: 350, unit: 'علبة', expiry: '2026-11-20', received: '2024-03-05', status: 'warning', statusText: 'مراقبة' },
    { id: 'F-2025-099', product: 'مواد تغليف (كرتون)', type: 'FIFO', stock: 8500, unit: 'قطعة', expiry: 'N/A', received: '2023-11-20', status: 'aging', statusText: 'مخزون راكد' },
    { id: 'B-2027-041', product: 'فيتامين C فوار', type: 'FEFO', stock: 2100, unit: 'علبة', expiry: '2027-05-10', received: '2024-05-01', status: 'safe', statusText: 'سليم' },
    { id: 'F-2026-102', product: 'مكونات تصنيع أساسية', type: 'FIFO', stock: 420, unit: 'كجم', expiry: 'N/A', received: '2024-01-15', status: 'safe', statusText: 'دوران طبيعي' },
  ];

  if (!mounted) return null;

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <span className="p-2 bg-rose-100 text-rose-600 rounded-lg">
              <Clock className="w-6 h-6" />
            </span>
            إدارة FIFO / FEFO وتواريخ الصلاحية
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            محرك ذكي لتوزيع المخزون بناءً على الأقدمية (FIFO) أو الأقرب للانتهاء (FEFO) تلقائياً.
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" /> تصفية
          </button>
          <button className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700 transition-colors flex items-center gap-2">
            <RefreshCcw className="w-4 h-4" /> تطبيق قواعد الصرف الآلي
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-500">مخزون منتهي الصلاحية</h3>
            <span className="p-2 bg-red-50 text-red-600 rounded-lg"><AlertCircle className="w-5 h-5" /></span>
          </div>
          <div className="text-3xl font-black text-slate-800">0 <span className="text-sm text-slate-400 font-normal">صنف</span></div>
          <div className="mt-2 text-sm text-emerald-600 font-semibold">ممتاز، لا يوجد هدر.</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-500">يقترب من الانتهاء (أقل من 90 يوم)</h3>
            <span className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Clock className="w-5 h-5" /></span>
          </div>
          <div className="text-3xl font-black text-slate-800">12 <span className="text-sm text-slate-400 font-normal">تشغيلة</span></div>
          <div className="mt-2 text-sm text-orange-600 font-semibold cursor-pointer hover:underline">عرض الأصناف</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-500">مخزون راكد (لم يتحرك منذ 180 يوم)</h3>
            <span className="p-2 bg-slate-100 text-slate-600 rounded-lg"><ArrowDownUp className="w-5 h-5" /></span>
          </div>
          <div className="text-3xl font-black text-slate-800">45 <span className="text-sm text-slate-400 font-normal">صنف</span></div>
          <div className="mt-2 text-sm text-rose-600 font-semibold cursor-pointer hover:underline">تطبيق خصومات للتصريف</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-500">كفاءة الصرف الآلي (FEFO)</h3>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 className="w-5 h-5" /></span>
          </div>
          <div className="text-3xl font-black text-slate-800">98.5%</div>
          <div className="mt-2 text-sm text-emerald-600 font-semibold">+2.1% عن الشهر الماضي</div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-bold text-slate-800">مراقبة التشغيلات (Batches Tracker)</h2>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
            <input type="text" placeholder="رقم التشغيلة أو الصنف..." className="w-full pr-9 pl-4 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-rose-300" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-4 border-b border-slate-100">رقم التشغيلة (Batch ID)</th>
                <th className="px-6 py-4 border-b border-slate-100">الصنف</th>
                <th className="px-6 py-4 border-b border-slate-100">القاعدة</th>
                <th className="px-6 py-4 border-b border-slate-100">الكمية المتوفرة</th>
                <th className="px-6 py-4 border-b border-slate-100">تاريخ الاستلام</th>
                <th className="px-6 py-4 border-b border-slate-100">تاريخ الانتهاء</th>
                <th className="px-6 py-4 border-b border-slate-100">حالة التشغيلة</th>
                <th className="px-6 py-4 border-b border-slate-100">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.map((b, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-indigo-600">{b.id}</td>
                  <td className="px-6 py-4 font-semibold text-slate-800">{b.product}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded ${b.type === 'FEFO' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {b.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700">{b.stock.toLocaleString()} <span className="font-normal text-slate-400 text-xs">{b.unit}</span></td>
                  <td className="px-6 py-4 text-slate-500 text-xs font-mono">{b.received}</td>
                  <td className={`px-6 py-4 font-mono font-bold text-xs ${b.expiry !== 'N/A' && new Date(b.expiry) < new Date(Date.now() + 90*24*60*60*1000) ? 'text-red-600' : 'text-slate-500'}`}>
                    {b.expiry}
                  </td>
                  <td className="px-6 py-4">
                    {b.status === 'critical' && <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold"><AlertCircle className="w-3 h-3"/> {b.statusText}</span>}
                    {b.status === 'warning' && <span className="inline-flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs font-bold"><Clock className="w-3 h-3"/> {b.statusText}</span>}
                    {b.status === 'aging' && <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-1 rounded text-xs font-bold"><ArrowDownUp className="w-3 h-3"/> {b.statusText}</span>}
                    {b.status === 'safe' && <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-bold"><CheckCircle2 className="w-3 h-3"/> {b.statusText}</span>}
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs hover:underline">
                      تفاصيل الصرف
                    </button>
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
