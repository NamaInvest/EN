'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { TrendingUp, Users, DollarSign, Target, Calendar, Filter, Download, ArrowUpRight, ArrowDownRight, Package, Search } from 'lucide-react';
import { useToast } from '@/components/Toast';

const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');`;

interface SaleTransaction {
  id: string;
  customerName: string;
  product: string;
  amount: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Refunded';
}

export default function SalesAnalyticsPage() {
  const { lang } = useTranslation();
  const { info } = useToast();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('month');

  const [transactions] = useState<SaleTransaction[]>([
    { id: 'INV-2026-001', customerName: 'شركة التقنية الحديثة', product: 'تراخيص برمجيات (Enterprise)', amount: 45000, date: '2026-05-10', status: 'Completed' },
    { id: 'INV-2026-002', customerName: 'مؤسسة الأفق المحدودة', product: 'استشارات تقنية (ساعة)', amount: 15000, date: '2026-05-09', status: 'Pending' },
    { id: 'INV-2026-003', customerName: 'أحمد محمود', product: 'تجديد اشتراك سحابي', amount: 3500, date: '2026-05-08', status: 'Completed' },
    { id: 'INV-2026-004', customerName: 'مجموعة المدار', product: 'تركيب سيرفرات', amount: 120000, date: '2026-05-07', status: 'Completed' },
    { id: 'INV-2026-005', customerName: 'شركة ريادة', product: 'دعم فني (عقد سنوي)', amount: 25000, date: '2026-05-05', status: 'Refunded' },
  ]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => 
      t.customerName.includes(searchQuery) || 
      t.product.includes(searchQuery) ||
      t.id.includes(searchQuery)
    );
  }, [transactions, searchQuery]);

  const handleExport = () => {
    info('جاري تصدير التقرير بصيغة Excel...');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed': return <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-200">مكتمل</span>;
      case 'Pending': return <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold border border-amber-200">معلق</span>;
      case 'Refunded': return <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-bold border border-red-200">مسترجع</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-6 lg:p-10 transition-colors duration-300" style={{ fontFamily: "'Fira Sans', sans-serif" }} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <style dangerouslySetInnerHTML={{ __html: fontImport }} />
      
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white dark:bg-[#0F172A] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 gap-4">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl relative overflow-hidden group">
              <TrendingUp className="w-8 h-8 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">تحليلات المبيعات (Sales Analytics)</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">مراقبة الأداء المالي، المبيعات الحديثة، وتقييم التحويل</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="today">اليوم</option>
              <option value="week">هذا الأسبوع</option>
              <option value="month">هذا الشهر</option>
              <option value="year">هذا العام</option>
            </select>
            <button onClick={handleExport} className="flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-bold shadow-sm shadow-indigo-500/20 cursor-pointer">
              <Download className="w-4 h-4 ml-2" /> تصدير التقرير
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border-r-4 border-r-indigo-500 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي الإيرادات</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">845,200 ﷼</h3>
              </div>
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm font-bold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-4 h-4 ml-1" /> <span>+12.5% عن الشهر الماضي</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border-r-4 border-r-emerald-500 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">معدل التحويل</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">24.8%</h3>
              </div>
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                <Target className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm font-bold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-4 h-4 ml-1" /> <span>+2.1% عن الشهر الماضي</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border-r-4 border-r-blue-500 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">العملاء الجدد</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">142</h3>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm font-bold text-red-500 cursor-pointer hover:text-red-600">
              <ArrowDownRight className="w-4 h-4 ml-1" /> <span>-4% عن الشهر الماضي</span>
            </div>
          </div>

          <div className="bg-linear-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl text-white shadow-md shadow-indigo-500/20">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-indigo-100 mb-1">متوسط قيمة الطلب (AOV)</p>
                <h3 className="text-3xl font-bold font-[Fira_Code]">4,250 ﷼</h3>
              </div>
              <div className="p-2 bg-white/20 rounded-lg text-white">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm font-bold text-indigo-100">
              <TrendingUp className="w-4 h-4 ml-1" /> <span>مؤشر إيجابي للنمو</span>
            </div>
          </div>
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Table */}
          <div className="lg:col-span-2 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                أحدث المبيعات (Recent Transactions)
              </h2>
              <div className="relative w-full sm:w-auto">
                <Search className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث بالفاتورة أو العميل..." 
                  className="pl-4 pr-10 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors w-full sm:w-64"
                />
              </div>
            </div>
            
            {loading ? (
              <div className="p-10 text-center text-slate-500 font-bold">جاري تحميل البيانات...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4 font-bold">رقم الفاتورة</th>
                      <th className="px-6 py-4 font-bold">العميل</th>
                      <th className="px-6 py-4 font-bold">المنتج / الخدمة</th>
                      <th className="px-6 py-4 font-bold">التاريخ</th>
                      <th className="px-6 py-4 font-bold">المبلغ</th>
                      <th className="px-6 py-4 font-bold">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-[Fira_Code]">
                    {filteredTransactions.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-10 text-slate-500 font-bold">لا توجد عمليات مطابقة</td></tr>
                    ) : filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400">{tx.id}</td>
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-200">{tx.customerName}</td>
                        <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">{tx.product}</td>
                        <td className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400">{tx.date}</td>
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100 text-base">{tx.amount.toLocaleString()} ﷼</td>
                        <td className="px-6 py-4">
                          {getStatusBadge(tx.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sidebar Area (Placeholder for Charts or Top Products) */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">أفضل المنتجات مبيعاً</h2>
              <div className="space-y-4">
                {[
                  { name: 'تراخيص برمجيات (Enterprise)', sales: 120, rev: 450000 },
                  { name: 'استشارات تقنية', sales: 85, rev: 150000 },
                  { name: 'تركيب سيرفرات', sales: 30, rev: 200000 },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-200">{item.name}</p>
                      <p className="text-xs font-bold text-slate-500 mt-1">{item.sales} عملية بيع</p>
                    </div>
                    <div className="text-left font-[Fira_Code] font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                      {item.rev.toLocaleString()} ﷼
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg hover:bg-indigo-100 transition-colors text-sm">
                عرض كل المنتجات
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
