"use client";

import React, { useState, useEffect } from 'react';
import { Factory, Search, TrendingUp, AlertTriangle, PackageOpen, Boxes, Plus, Hammer, CheckCircle2, Cog, Flame } from 'lucide-react';

export default function MRPDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ activeOrders: 12, lowStock: 5, completionRate: 85, outputToday: 1450 });
    const [orders, setOrders] = useState([
        { id: 'WO-2026-001', product: 'أنابيب ضغط عالي', qty: 5000, status: 'In Progress', progress: 65, deadline: '2026-05-10', stage: 'التشكيل' },
        { id: 'WO-2026-002', product: 'صمامات أمان مقاس 2"', qty: 1200, status: 'Pending', progress: 0, deadline: '2026-05-15', stage: 'بانتظار المواد' },
        { id: 'WO-2026-003', product: 'هياكل معدنية', qty: 300, status: 'Completed', progress: 100, deadline: '2026-05-01', stage: 'الفحص النهائي' },
    ]);

    useEffect(() => {
        // Simulate API fetch
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'In Progress': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'Completed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'Pending': return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
            default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-6 lg:p-10 font-sans text-slate-200">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header Section */}
                <div className="flex items-center justify-between backdrop-blur-md bg-white/5 p-6 rounded-3xl border border-white/10 shadow-2xl">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="p-4 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg shadow-orange-500/20">
                            <Factory className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">إدارة التصنيع (MRP)</h1>
                            <p className="text-slate-400 mt-1">مراقبة أوامر التشغيل، استهلاك المواد، ومراحل الإنتاج</p>
                        </div>
                    </div>
                    <button className="flex items-center px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-orange-500/30">
                        <Plus className="w-5 h-5 ml-2" /> أمر تشغيل جديد
                    </button>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="backdrop-blur-md bg-white/5 p-6 rounded-3xl border border-white/10 flex items-center space-x-4 space-x-reverse transform hover:scale-105 transition-transform duration-300 cursor-pointer">
                        <div className="p-3 bg-orange-500/20 rounded-xl"><Hammer className="w-6 h-6 text-orange-400" /></div>
                        <div>
                            <p className="text-sm text-slate-400">أوامر تشغيل نشطة</p>
                            <h3 className="text-3xl font-bold text-white">{stats.activeOrders}</h3>
                        </div>
                    </div>
                    <div className="backdrop-blur-md bg-white/5 p-6 rounded-3xl border border-white/10 flex items-center space-x-4 space-x-reverse transform hover:scale-105 transition-transform duration-300 cursor-pointer">
                        <div className="p-3 bg-emerald-500/20 rounded-xl"><TrendingUp className="w-6 h-6 text-emerald-400" /></div>
                        <div>
                            <p className="text-sm text-slate-400">معدل الإنجاز</p>
                            <h3 className="text-3xl font-bold text-white">{stats.completionRate}%</h3>
                        </div>
                    </div>
                    <div className="backdrop-blur-md bg-white/5 p-6 rounded-3xl border border-white/10 flex items-center space-x-4 space-x-reverse transform hover:scale-105 transition-transform duration-300 cursor-pointer">
                        <div className="p-3 bg-blue-500/20 rounded-xl"><Boxes className="w-6 h-6 text-blue-400" /></div>
                        <div>
                            <p className="text-sm text-slate-400">مخرجات اليوم (وحدة)</p>
                            <h3 className="text-3xl font-bold text-white">{stats.outputToday.toLocaleString()}</h3>
                        </div>
                    </div>
                    <div className="backdrop-blur-md bg-white/5 p-6 rounded-3xl border border-white/10 flex items-center space-x-4 space-x-reverse transform hover:scale-105 transition-transform duration-300 cursor-pointer">
                        <div className="p-3 bg-red-500/20 rounded-xl"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
                        <div>
                            <p className="text-sm text-slate-400">نواقص المواد الخام</p>
                            <h3 className="text-3xl font-bold text-white">{stats.lowStock}</h3>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Work Orders Table */}
                    <div className="lg:col-span-2 backdrop-blur-xl bg-slate-900/40 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white flex items-center">
                                <Cog className="w-5 h-5 ml-2 text-orange-400 animate-spin-slow" /> أوامر التشغيل (Work Orders)
                            </h2>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                                <input type="text" placeholder="بحث برقم الأمر..." className="bg-slate-800/50 border border-slate-700 rounded-xl pl-4 pr-10 py-2 text-sm text-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all w-64" />
                            </div>
                        </div>
                        
                        {loading ? (
                            <div className="p-10 text-center text-slate-500 flex justify-center items-center"><Cog className="w-5 h-5 animate-spin ml-2" /> جاري تحميل البيانات...</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-right">
                                    <thead>
                                        <tr className="bg-slate-800/50 text-slate-400 text-sm">
                                            <th className="px-6 py-4 font-medium">رقم الأمر</th>
                                            <th className="px-6 py-4 font-medium">المنتج</th>
                                            <th className="px-6 py-4 font-medium">الكمية</th>
                                            <th className="px-6 py-4 font-medium">المرحلة الحالية</th>
                                            <th className="px-6 py-4 font-medium">نسبة الإنجاز</th>
                                            <th className="px-6 py-4 font-medium">الحالة</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {orders.map((order, i) => (
                                            <tr key={i} className="hover:bg-slate-800/30 transition-colors cursor-pointer">
                                                <td className="px-6 py-4 font-mono text-orange-300 font-bold">{order.id}</td>
                                                <td className="px-6 py-4 text-white font-medium">{order.product}</td>
                                                <td className="px-6 py-4 text-slate-300">{order.qty.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-slate-300">{order.stage}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center w-full">
                                                        <div className="w-full bg-slate-700 rounded-full h-2.5 mr-2">
                                                            <div className={`h-2.5 rounded-full ${order.progress === 100 ? 'bg-emerald-500' : 'bg-orange-500'}`} style={{ width: `${order.progress}%` }}></div>
                                                        </div>
                                                        <span className="text-xs text-slate-400 w-8">{order.progress}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                                                        {order.status === 'In Progress' ? 'قيد التنفيذ' : order.status === 'Completed' ? 'مكتمل' : 'معلق'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions & Machine Status */}
                    <div className="space-y-8">
                        {/* Machine Status */}
                        <div className="backdrop-blur-md bg-white/5 p-6 rounded-3xl border border-white/10 shadow-2xl">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                                <Flame className="w-5 h-5 ml-2 text-rose-400" /> حالة خطوط الإنتاج
                            </h2>
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 flex justify-between items-center">
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] ml-3"></div>
                                        <div>
                                            <h4 className="font-semibold text-white">خط التجميع A</h4>
                                            <p className="text-xs text-slate-400">يعمل بكفاءة 98%</p>
                                        </div>
                                    </div>
                                    <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-lg">Active</span>
                                </div>
                                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 flex justify-between items-center">
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] ml-3"></div>
                                        <div>
                                            <h4 className="font-semibold text-white">آلة التغليف الحراري</h4>
                                            <p className="text-xs text-slate-400">صيانة دورية مجدولة غداً</p>
                                        </div>
                                    </div>
                                    <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-1 rounded-lg">Warning</span>
                                </div>
                                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 flex justify-between items-center">
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] ml-3 animate-pulse"></div>
                                        <div>
                                            <h4 className="font-semibold text-white">فرن الصهر الأساسي</h4>
                                            <p className="text-xs text-rose-400">توقف مفاجئ - نقص بالمواد</p>
                                        </div>
                                    </div>
                                    <span className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded-lg">Stopped</span>
                                </div>
                            </div>
                        </div>

                        {/* Bill of Materials Shortcut */}
                        <div className="backdrop-blur-md bg-gradient-to-br from-indigo-900/50 to-purple-900/50 p-6 rounded-3xl border border-indigo-500/20 shadow-2xl relative overflow-hidden group cursor-pointer">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-500/40 transition-all"></div>
                            <PackageOpen className="w-8 h-8 text-indigo-400 mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">قوائم المواد (BOM)</h3>
                            <p className="text-sm text-indigo-200">إدارة قوائم المواد الخام والتكاليف التقديرية للمنتجات النهائية.</p>
                        </div>
                    </div>

                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                .animate-spin-slow {
                    animation: spin 4s linear infinite;
                }
            `}} />
        </div>
    );
}
