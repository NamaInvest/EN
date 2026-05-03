'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';
import { 
 CreditCard, ShoppingCart, TrendingUp, TrendingDown, 
 Package, AlertTriangle, Wallet, Users, RefreshCw, 
 Bot, Activity, BarChart3, Receipt, ChevronRight, Zap
} from 'lucide-react';

interface DashboardData {
 todaySales: number;
 todayPurchases: number;
 todayProfit: number;
 todayExpenses: number;
 totalProducts: number;
 lowStockCount: number;
 treasuryBalance: number;
 totalCustomers: number;
 salesChart: { date: string; total: number }[];
 topProducts: { name: string; quantity: number }[];
 recentInvoices: { invoiceNo: number; date: string; total: number; paymentType: string; customerName: string }[];
}

interface AiAlert {
 type: string;
 title: string;
 message: string;
}

export default function DashboardPage() {
 
 const [data, setData] = useState<DashboardData | null>(null);
 const { error: toastError, success: toastSuccess } = useToast();
 const [loading, setLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);
 
 // AI CFO State
 const [aiAlerts, setAiAlerts] = useState<AiAlert[] | null>(null);
 const [loadingAi, setLoadingAi] = useState(false);

 const { t, lang } = useTranslation();
 const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

 useEffect(() => {
 try {
 const u = JSON.parse(localStorage.getItem('user') || '{}');
 const ADMIN_ROLES = ['admin', 'owner', 'system_admin'];
 if (u.role && !ADMIN_ROLES.includes(u.role)) {
 window.location.href = u.defaultPage || '/pos';
 }
 } catch {}
 }, []);

 const fetchDashboard = useCallback(async (isRefresh = false) => {
 if (isRefresh) setRefreshing(true); else setLoading(true);
 try {
 const token = localStorage.getItem('token');
 const res = await fetch('/api/dashboard', {
 headers: { Authorization: `Bearer ${token}` },
 });
 if (res.ok) {
 setData(await res.json());
 }
 } catch (err: any) { toastError(err?.message || 'حدث خطأ'); } finally {
 setLoading(false);
 setRefreshing(false);
 }
 }, []);

 useEffect(() => {
 fetchDashboard();
 const interval = setInterval(() => fetchDashboard(true), 5 * 60 * 1000);
 return () => clearInterval(interval);
 }, [fetchDashboard]);

 const fetchAiCfo = async () => {
 if (!data || loadingAi) return;
 setLoadingAi(true);
 try {
 const token = localStorage.getItem('token');
 const res = await fetch('/api/ai-cfo', {
 method: 'POST',
 headers: { 
 'Authorization': `Bearer ${token}`,
 'Content-Type': 'application/json' 
 },
 body: JSON.stringify({ metrics: data })
 });
 if (res.ok) {
 const result = await res.json();
 if (result.alerts) setAiAlerts(result.alerts);
 }
 } catch (err: any) { toastError(err?.message || 'حدث خطأ'); } finally {
 setLoadingAi(false);
 }
 };

 const formatCurrency = (value: number) => {
 return new Intl.NumberFormat('en-US', {
 minimumFractionDigits: 2,
 maximumFractionDigits: 2,
 }).format(value) + ' ' + t('common.sar');
 };

 const paymentKey: Record<string, string> = {
 cash: 'payment.cash', card: 'payment.card', transfer: 'payment.transfer',
 credit: 'payment.credit', installment: 'payment.installment',
 };

 if (loading) {
 return (
 <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 font-sans flex items-center justify-center">
 <div className="flex flex-col items-center gap-4">
 <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
 <p className="text-slate-500 font-medium">جاري التحميل...</p>
 </div>
 </div>
 );
 }

 const d = data || {
 todaySales: 0, todayPurchases: 0, todayProfit: 0,
 todayExpenses: 0, totalProducts: 0, lowStockCount: 0,
 treasuryBalance: 0, totalCustomers: 0, salesChart: [], topProducts: [], recentInvoices: []
 };

 return (
 <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 font-sans text-slate-800">
 <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
 
 {/* Header - Clean & Minimal */}
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
 <div>
 <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
 لوحة القيادة
 </h1>
 <p className="text-slate-500 mt-1">نظرة عامة على الأداء المالي والتشغيلي للنظام</p>
 </div>
 <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
 <div className="text-sm text-slate-500 px-4 font-medium">
 {new Date().toLocaleDateString('en-GB')}
 </div>
 <button
 onClick={() => fetchDashboard(true)}
 disabled={refreshing}
 className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-semibold transition-all disabled:opacity-50"
 >
 <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
 {refreshing ? t('dashboard.refreshing') : t('dashboard.refresh')}
 </button>
 </div>
 </div>

 {/* KPI Cards Grid - Flat, White, Clean Borders */}
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
 {/* Sales */}
 <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
 <div className="flex justify-between items-start mb-4">
 <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
 <CreditCard className="w-5 h-5" />
 </div>
 <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">+12%</span>
 </div>
 <h3 className="text-slate-500 text-sm font-medium mb-1">{t('dashboard.today_sales')}</h3>
 <p className="text-2xl font-bold text-slate-900">{formatCurrency(d.todaySales)}</p>
 </div>

 {/* Purchases */}
 <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
 <div className="flex justify-between items-start mb-4">
 <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
 <ShoppingCart className="w-5 h-5" />
 </div>
 </div>
 <h3 className="text-slate-500 text-sm font-medium mb-1">{t('dashboard.today_purchases')}</h3>
 <p className="text-2xl font-bold text-slate-900">{formatCurrency(d.todayPurchases)}</p>
 </div>

 {/* Profit */}
 <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
 <div className="flex justify-between items-start mb-4">
 <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
 <TrendingUp className="w-5 h-5" />
 </div>
 </div>
 <h3 className="text-slate-500 text-sm font-medium mb-1">{t('dashboard.today_profit')}</h3>
 <p className="text-2xl font-bold text-slate-900">{formatCurrency(d.todayProfit)}</p>
 </div>

 {/* Expenses */}
 <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
 <div className="flex justify-between items-start mb-4">
 <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
 <TrendingDown className="w-5 h-5" />
 </div>
 </div>
 <h3 className="text-slate-500 text-sm font-medium mb-1">{t('dashboard.today_expenses')}</h3>
 <p className="text-2xl font-bold text-slate-900">{formatCurrency(d.todayExpenses)}</p>
 </div>
 
 {/* Treasury */}
 <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
 <div className="flex justify-between items-start mb-4">
 <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl">
 <Wallet className="w-5 h-5" />
 </div>
 </div>
 <h3 className="text-slate-500 text-sm font-medium mb-1">{t('dashboard.treasury_balance')}</h3>
 <p className="text-2xl font-bold text-slate-900">{formatCurrency(d.treasuryBalance)}</p>
 </div>

 {/* Customers */}
 <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
 <div className="flex justify-between items-start mb-4">
 <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
 <Users className="w-5 h-5" />
 </div>
 </div>
 <h3 className="text-slate-500 text-sm font-medium mb-1">{t('dashboard.total_customers')}</h3>
 <p className="text-2xl font-bold text-slate-900">{d.totalCustomers}</p>
 </div>

 {/* Products */}
 <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
 <div className="flex justify-between items-start mb-4">
 <div className="p-2.5 bg-fuchsia-50 text-fuchsia-600 rounded-xl">
 <Package className="w-5 h-5" />
 </div>
 </div>
 <h3 className="text-slate-500 text-sm font-medium mb-1">{t('dashboard.total_products')}</h3>
 <p className="text-2xl font-bold text-slate-900">{d.totalProducts}</p>
 </div>

 {/* Low Stock */}
 <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
 <div className="flex justify-between items-start mb-4">
 <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
 <AlertTriangle className="w-5 h-5" />
 </div>
 </div>
 <h3 className="text-slate-500 text-sm font-medium mb-1">{t('dashboard.low_stock')}</h3>
 <p className="text-2xl font-bold text-slate-900">{d.lowStockCount}</p>
 </div>
 </div>

 {/* Main Content Area */}
 <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
 
 {/* Left Column (Charts & AI) */}
 <div className="xl:col-span-2 space-y-8">
 {/* AI CFO Widget */}
 <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
 <div className="flex justify-between items-center mb-8">
 <div className="flex items-center gap-3">
 <div className="p-3 bg-blue-50 rounded-xl">
 <Bot className="w-6 h-6 text-blue-600" />
 </div>
 <div>
 <h2 className="text-xl font-bold text-slate-900">{t('sys.str_549')}</h2>
 <p className="text-sm text-slate-500">تحليل مالي مباشر بواسطة الذكاء الاصطناعي</p>
 </div>
 </div>
 <button 
 onClick={fetchAiCfo} 
 disabled={loadingAi || !data}
 className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-colors disabled:opacity-50"
 >
 <Zap className={`w-4 h-4 ${loadingAi ? 'animate-pulse text-yellow-300' : ''}`} />
 {loadingAi ? t('sys.str_551') : t('sys.str_552')}
 </button>
 </div>

 <div>
 {aiAlerts && aiAlerts.length > 0 ? (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {aiAlerts.map((alert, idx) => {
 const isDanger = alert.type === 'danger';
 const isWarning = alert.type === 'warning';
 const bgClass = isDanger ? 'bg-rose-50 border-rose-100 text-rose-800' : isWarning ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-emerald-50 border-emerald-100 text-emerald-800';
 const icon = isDanger ? <AlertTriangle className="w-5 h-5 text-rose-500" /> : isWarning ? <Zap className="w-5 h-5 text-amber-500" /> : <Activity className="w-5 h-5 text-emerald-500" />;
 
 return (
 <div key={idx} className={`p-5 rounded-2xl border ${bgClass}`}>
 <h4 className="font-bold flex items-center gap-2 mb-2">
 {icon} {alert.title}
 </h4>
 <p className="text-sm opacity-90 leading-relaxed">{alert.message}</p>
 </div>
 );
 })}
 </div>
 ) : !loadingAi ? (
 <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
 <Bot className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
 <p className="text-slate-500">{t('sys.str_550')}</p>
 </div>
 ) : null}
 </div>
 </div>

 {/* Sales Chart */}
 <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
 <div className="flex items-center gap-3 mb-8">
 <div className="p-3 bg-slate-50 rounded-xl">
 <BarChart3 className="w-6 h-6 text-slate-600" />
 </div>
 <h2 className="text-xl font-bold text-slate-900">{t('dashboard.sales_chart')}</h2>
 </div>
 
 <div className="h-[280px] flex items-end gap-3 md:gap-5 px-2">
 {(d.salesChart.length > 0 ? d.salesChart :
 Array.from({ length: 7 }, (_, i) => ({
 date: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString('en-GB'),
 total: 0
 }))
 ).map((item, i) => {
 const maxVal = Math.max(...d.salesChart.map(s => s.total), 1);
 const heightPercentage = d.salesChart.length > 0 ? (item.total / maxVal) * 100 : 5;
 
 return (
 <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
 <div className="text-[10px] md:text-xs font-mono text-slate-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-100 px-2 py-1 rounded-md">
 {item.total > 0 ? formatCurrency(item.total) : '0'}
 </div>
 <div className="w-full relative bg-slate-50 rounded-t-lg h-full flex items-end">
 <div 
 style={{ height: `${heightPercentage}%` }}
 className="w-full bg-blue-500 rounded-t-lg transition-all duration-1000 ease-out group-hover:bg-blue-600"
 >
 </div>
 </div>
 <div className="text-[10px] md:text-xs font-medium text-slate-500 truncate w-full text-center">
 {typeof item.date === 'string' ? item.date.split('/')[0] + '/' + item.date.split('/')[1] : ''}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </div>

 {/* Right Column (Top Products & Recent Invoices) */}
 <div className="space-y-8">
 {/* Top Products */}
 <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
 <div className="flex items-center justify-between mb-6">
 <div className="flex items-center gap-3">
 <div className="p-2.5 bg-fuchsia-50 rounded-xl">
 <TrendingUp className="w-5 h-5 text-fuchsia-600" />
 </div>
 <h2 className="text-lg font-bold text-slate-900">{t('dashboard.top_selling')}</h2>
 </div>
 </div>

 {d.topProducts.length === 0 ? (
 <div className="text-center py-10 text-slate-400 text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
 {t('dashboard.no_data')}
 </div>
 ) : (
 <div className="space-y-2">
 {d.topProducts.slice(0, 5).map((p, i) => (
 <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent">
 <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
 i === 0 ? 'bg-amber-100 text-amber-600' :
 i === 1 ? 'bg-slate-100 text-slate-600' :
 i === 2 ? 'bg-orange-100 text-orange-600' :
 'bg-slate-50 text-slate-400'
 }`}>
 {i + 1}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-bold text-slate-800 truncate">{p.name}</p>
 <p className="text-xs text-slate-500 font-medium mt-0.5">{p.quantity} {t('dashboard.sold')}</p>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Recent Invoices */}
 <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
 <div className="flex items-center justify-between mb-6">
 <div className="flex items-center gap-3">
 <div className="p-2.5 bg-emerald-50 rounded-xl">
 <Receipt className="w-5 h-5 text-emerald-600" />
 </div>
 <h2 className="text-lg font-bold text-slate-900">{t('dashboard.recent_invoices')}</h2>
 </div>
 </div>

 {d.recentInvoices.length === 0 ? (
 <div className="text-center py-10 text-slate-400 text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
 لا توجد فواتير حديثة
 </div>
 ) : (
 <div className="space-y-2">
 {d.recentInvoices.map((inv, i) => (
 <div key={i} className="group flex flex-col gap-2 p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent cursor-pointer">
 <div className="flex justify-between items-start">
 <div>
 <span className="text-xs font-mono text-slate-400 font-bold">#{inv.invoiceNo}</span>
 <p className="text-sm font-bold text-slate-800 mt-1 truncate max-w-[150px]">{inv.customerName}</p>
 </div>
 <span className="text-sm font-bold text-slate-900">
 {formatCurrency(inv.total)}
 </span>
 </div>
 <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
 <span className="text-[11px] font-medium text-slate-500">
 {new Date(inv.date).toLocaleDateString('en-GB')}
 </span>
 <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
 {t(paymentKey[inv.paymentType] || '') || inv.paymentType}
 </span>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
