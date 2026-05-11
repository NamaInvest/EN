'use client';
import { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle2, ArrowDownUp, RefreshCcw, Search, Filter, Plus, FileSpreadsheet, Edit, Trash2, X } from 'lucide-react';

export default function FifoFefoPage() {
  const [mounted, setMounted] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBatch, setNewBatch] = useState({ id: '', product: '', stock: 0, expiry: '' });
  
  useEffect(() => setMounted(true), []);

  const [batches, setBatches] = useState([
    { id: 'B-2026-001', product: 'باراسيتامول 500mg', type: 'FEFO', stock: 1200, unit: 'علبة', expiry: '2026-08-15', received: '2024-01-10', status: 'critical', statusText: 'يقترب من الانتهاء' },
    { id: 'B-2026-002', product: 'أموكسيسيلين 250mg', type: 'FEFO', stock: 350, unit: 'علبة', expiry: '2026-11-20', received: '2024-03-05', status: 'warning', statusText: 'مراقبة' },
    { id: 'F-2025-099', product: 'مواد تغليف (كرتون)', type: 'FIFO', stock: 8500, unit: 'قطعة', expiry: 'N/A', received: '2023-11-20', status: 'aging', statusText: 'مخزون راكد' },
    { id: 'B-2027-041', product: 'فيتامين C فوار', type: 'FEFO', stock: 2100, unit: 'علبة', expiry: '2027-05-10', received: '2024-05-01', status: 'safe', statusText: 'سليم' },
    { id: 'F-2026-102', product: 'مكونات تصنيع أساسية', type: 'FIFO', stock: 420, unit: 'كجم', expiry: 'N/A', received: '2024-01-15', status: 'safe', statusText: 'دوران طبيعي' },
  ]);

  const handleAddBatch = () => {
    if(!newBatch.id || !newBatch.product) return;
    setBatches([{ ...newBatch, type: 'FEFO', unit: 'قطعة', received: new Date().toISOString().split('T')[0], status: 'safe', statusText: 'تمت الإضافة حديثاً' }, ...batches]);
    setShowAddModal(false);
    setNewBatch({ id: '', product: '', stock: 0, expiry: '' });
  };

  const handleDelete = (id: string) => {
    setBatches(batches.filter(b => b.id !== id));
  };

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
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" /> تصدير Excel
          </button>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" /> تصفية متقدمة
          </button>
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> إضافة تشغيلة جديدة (Batch)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* KPI blocks... */}
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
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 gap-4">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            جدول التشغيلات المتوفرة (Batches)
          </h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
             <button className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm">
                <RefreshCcw className="w-3.5 h-3.5" /> صرف آلي للإدارة
             </button>
             <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
                <input type="text" placeholder="بحث برقم التشغيلة..." className="w-full pr-9 pl-4 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-rose-300 shadow-sm" />
             </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-4 border-b border-slate-100">رقم التشغيلة</th>
                <th className="px-6 py-4 border-b border-slate-100">الصنف</th>
                <th className="px-6 py-4 border-b border-slate-100">القاعدة</th>
                <th className="px-6 py-4 border-b border-slate-100">الكمية المتوفرة</th>
                <th className="px-6 py-4 border-b border-slate-100">تاريخ الانتهاء</th>
                <th className="px-6 py-4 border-b border-slate-100">حالة التشغيلة</th>
                <th className="px-6 py-4 border-b border-slate-100 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-400">لا توجد تشغيلات حالياً</td></tr>
              ) : batches.map((b, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-indigo-600">{b.id}</td>
                  <td className="px-6 py-4 font-semibold text-slate-800">{b.product}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded ${b.type === 'FEFO' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {b.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700">
                    {Number(b.stock).toLocaleString()} <span className="font-normal text-slate-400 text-xs">{b.unit}</span>
                  </td>
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
                    <div className="flex items-center justify-center gap-2">
                       <button className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="تعديل">
                         <Edit className="w-4 h-4" />
                       </button>
                       <button onClick={() => handleDelete(b.id)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="حذف">
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <h3 className="font-bold text-slate-800 text-lg">إضافة تشغيلة جديدة (New Batch)</h3>
               <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                 <X className="w-5 h-5" />
               </button>
            </div>
            <div className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">رقم التشغيلة (Batch ID)</label>
                  <input type="text" value={newBatch.id} onChange={e => setNewBatch({...newBatch, id: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="مثال: B-2026-099" />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">اسم الصنف</label>
                  <input type="text" value={newBatch.product} onChange={e => setNewBatch({...newBatch, product: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="اختر الصنف..." />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">الكمية</label>
                    <input type="number" value={newBatch.stock} onChange={e => setNewBatch({...newBatch, stock: parseInt(e.target.value) || 0})} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">تاريخ الانتهاء</label>
                    <input type="date" value={newBatch.expiry} onChange={e => setNewBatch({...newBatch, expiry: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                 </div>
               </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
               <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition-colors">إلغاء</button>
               <button onClick={handleAddBatch} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm">حفظ التشغيلة</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
