'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Factory, Search, TrendingUp, AlertTriangle, PackageOpen, Boxes, Plus, Hammer, CheckCircle2, Cog, Flame, Play, CheckCircle, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');`;

interface WorkOrder {
  id: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  startDate: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Delayed';
  progress: number;
}

export default function MRPDashboard() {
  const { lang } = useTranslation();
  const { success, error } = useToast();
  
  // States
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form States
  const [newOrderNumber, setNewOrderNumber] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newQuantity, setNewQuantity] = useState('');

  const [orders, setOrders] = useState<WorkOrder[]>([
    { id: '1', orderNumber: 'WO-2026-001', productName: 'لوحات إلكترونية A1', quantity: 500, startDate: '2026-05-10', status: 'In Progress', progress: 65 },
    { id: '2', orderNumber: 'WO-2026-002', productName: 'مستشعرات حرارة', quantity: 2000, startDate: '2026-05-11', status: 'Pending', progress: 0 },
    { id: '3', orderNumber: 'WO-2026-003', productName: 'وحدات تحكم مركزية', quantity: 150, startDate: '2026-05-08', status: 'Completed', progress: 100 },
    { id: '4', orderNumber: 'WO-2026-004', productName: 'كابلات طاقة نحاسية', quantity: 10000, startDate: '2026-05-01', status: 'Delayed', progress: 40 },
  ]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Filter Logic
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
        order.productName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'All' || order.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [orders, searchQuery, filterStatus]);

  // Handlers
  const handleAddOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderNumber || !newProductName || !newQuantity) {
      error('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }

    const newOrder: WorkOrder = {
      id: Date.now().toString(),
      orderNumber: newOrderNumber,
      productName: newProductName,
      quantity: parseInt(newQuantity, 10),
      startDate: new Date().toISOString().split('T')[0],
      status: 'Pending',
      progress: 0
    };

    setOrders([newOrder, ...orders]);
    success('تم إضافة أمر التشغيل بنجاح');
    setIsModalOpen(false);
    setNewOrderNumber('');
    setNewProductName('');
    setNewQuantity('');
  };

  const updateOrderStatus = (id: string, newStatus: WorkOrder['status']) => {
    setOrders(prev => prev.map(order => {
      if (order.id === id) {
        return { 
          ...order, 
          status: newStatus, 
          progress: newStatus === 'Completed' ? 100 : newStatus === 'In Progress' ? 10 : order.progress 
        };
      }
      return order;
    }));
    success(`تم تحديث حالة الأمر إلى ${newStatus}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'In Progress': return <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold border border-blue-200">قيد التشغيل</span>;
      case 'Completed': return <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-200">مكتمل</span>;
      case 'Delayed': return <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-bold border border-red-200">متأخر</span>;
      case 'Pending': return <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 rounded-full text-xs font-bold border border-slate-200">قيد الانتظار</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-6 lg:p-10 transition-colors duration-300" style={{ fontFamily: "'Fira Sans', sans-serif" }} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <style dangerouslySetInnerHTML={{ __html: fontImport }} />
      <style dangerouslySetInnerHTML={{__html: `
        .animate-spin-slow { animation: spin 4s linear infinite; }
      `}} />
      
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white dark:bg-[#0F172A] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 gap-4">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl relative overflow-hidden group">
              <Cog className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin-slow group-hover:text-blue-500 transition-colors" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">تخطيط موارد التصنيع (MRP)</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">مراقبة أوامر التشغيل، خطوط الإنتاج، وجدولة الموارد</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setIsModalOpen(true)} className="flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-bold shadow-sm shadow-blue-500/20 cursor-pointer">
              <Plus className="w-5 h-5 ml-2" /> إضافة أمر تشغيل
            </button>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border-r-4 border-r-blue-500 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">أوامر قيد التشغيل</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">
                  {orders.filter(o => o.status === 'In Progress').length}
                </h3>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <Factory className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm font-bold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4 ml-1" /> <span>معدل الإنتاج مستقر</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border-r-4 border-r-emerald-500 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">الإنتاج المكتمل</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">
                  {orders.filter(o => o.status === 'Completed').length}
                </h3>
              </div>
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                <PackageOpen className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
            </div>
            <div className="mt-1 text-xs font-bold text-slate-500">85% من المستهدف الأسبوعي</div>
          </div>

          <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border-r-4 border-r-red-500 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">اختناقات الإنتاج</p>
                <h3 className="text-3xl font-bold text-red-600 dark:text-red-500 font-[Fira_Code]">
                  {orders.filter(o => o.status === 'Delayed').length}
                </h3>
              </div>
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm font-bold text-red-500 cursor-pointer hover:text-red-600">
              <span>تتطلب تدخل سريع</span>
            </div>
          </div>

          <div className="bg-linear-to-br from-indigo-600 to-blue-700 p-6 rounded-2xl text-white shadow-md shadow-blue-500/20">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-blue-100 mb-1">كفاءة المعدات (OEE)</p>
                <h3 className="text-3xl font-bold font-[Fira_Code]">92%</h3>
              </div>
              <div className="p-2 bg-white/20 rounded-lg text-white">
                <Flame className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm font-bold text-blue-100">
              <span>معدل ممتاز للأداء الجودة</span>
            </div>
          </div>
        </div>

        {/* Work Orders List */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
              <Boxes className="w-5 h-5 ml-2 text-blue-600" />
              جدول أوامر التشغيل (Routing)
            </h2>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="All">جميع الحالات</option>
                <option value="Pending">قيد الانتظار</option>
                <option value="In Progress">قيد التشغيل</option>
                <option value="Completed">مكتمل</option>
                <option value="Delayed">متأخر</option>
              </select>
              <div className="relative flex-1 sm:flex-none">
                <Search className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث برقم الأمر أو المنتج..." 
                  className="pl-4 pr-10 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors w-full sm:w-64"
                />
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="p-10 text-center text-slate-500 font-bold">جاري تحميل البيانات...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-bold">رقم الأمر</th>
                    <th className="px-6 py-4 font-bold">المنتج / الصنف</th>
                    <th className="px-6 py-4 font-bold">الكمية</th>
                    <th className="px-6 py-4 font-bold">تاريخ البدء</th>
                    <th className="px-6 py-4 font-bold">نسبة الإنجاز</th>
                    <th className="px-6 py-4 font-bold">الحالة</th>
                    <th className="px-6 py-4 font-bold text-center">إجراءات سريعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-[Fira_Code]">
                  {filteredOrders.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-slate-500 font-bold">لا توجد أوامر تشغيل مطابقة</td></tr>
                  ) : filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">{order.orderNumber}</td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-200">{order.productName}</td>
                      <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">{order.quantity.toLocaleString()}</td>
                      <td className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400">{order.startDate}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${order.progress === 100 ? 'bg-emerald-500' : order.progress === 0 ? 'bg-slate-400' : 'bg-blue-500'}`} 
                              style={{ width: `${order.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-slate-500">{order.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2 opacity-100 sm:opacity-50 group-hover:opacity-100 transition-opacity">
                          {order.status === 'Pending' && (
                            <button onClick={() => updateOrderStatus(order.id, 'In Progress')} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors font-bold text-xs flex items-center" title="بدء الإنتاج">
                              <Play className="w-4 h-4 ml-1" /> بدء
                            </button>
                          )}
                          {order.status === 'In Progress' && (
                            <button onClick={() => updateOrderStatus(order.id, 'Completed')} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors font-bold text-xs flex items-center" title="إنهاء الأمر">
                              <CheckCircle className="w-4 h-4 ml-1" /> إكمال
                            </button>
                          )}
                          <button className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors font-bold text-xs">
                            التفاصيل
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Add Work Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                <Hammer className="w-6 h-6 ml-2 text-blue-600" />
                إنشاء أمر تشغيل جديد
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddOrder} className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">رقم الأمر (Auto-generated)</label>
                  <input 
                    type="text" 
                    required
                    value={newOrderNumber}
                    onChange={(e) => setNewOrderNumber(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-bold font-mono"
                    placeholder="WO-2026-..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">المنتج / الصنف النهائي</label>
                  <input 
                    type="text" 
                    required
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-bold"
                    placeholder="اسم المنتج المراد تصنيعه..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الكمية المطلوبة</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-bold font-mono"
                    placeholder="1000"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30">
                  <CheckCircle2 className="w-5 h-5" /> إرسال للإنتاج
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
