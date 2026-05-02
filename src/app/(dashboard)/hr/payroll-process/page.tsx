"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Minus, Calculator, Save, UserCircle, Receipt, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function PayrollProcessPage() {
    const { success, info } = useToast();

    const [employees, setEmployees] = useState<any[]>([]);
    const [employeeId, setEmployeeId] = useState('');
    const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [details, setDetails] = useState([
        { id: 1, description: 'Basic Salary', amount: 0, type: 'addition' }
    ]);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [savedInvoiceId, setSavedInvoiceId] = useState<number | null>(null);

    // جلب بيانات الموظفين
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await fetch('/api/employees');
                if (res.ok) {
                    const data = await res.json();
                    setEmployees(data);
                }
            } catch (err) {
                console.error("Failed to fetch employees", err);
            }
        };
        fetchEmployees();
    }, []);

    // ... handleEmployeeChange
    const handleEmployeeChange = (empIdStr: string) => {
        setEmployeeId(empIdStr);
        setSavedInvoiceId(null);
    };

    // ... useEffect for fetchCalculations
    useEffect(() => {
        const fetchCalculations = async () => {
            if (!employeeId || !period) return;
            try {
                const res = await fetch('/api/payroll/calculate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ employeeId, period })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.additions.length === 0 && data.deductions.length === 0) {
                        setDetails([{ id: 1, description: 'الراتب الأساسي', amount: 0, type: 'addition' }]);
                    } else {
                        setDetails([...data.additions, ...data.deductions]);
                    }
                }
            } catch (err) {
                console.error("Failed to calculate payroll", err);
            }
        };
        fetchCalculations();
    }, [employeeId, period]);

    const handleAddLine = (type: 'addition' | 'deduction') => {
        setDetails([...details, { id: Date.now(), description: '', amount: 0, type }]);
    };

    const handleRemoveLine = (id: number) => {
        if (details.length > 1) {
            setDetails(details.filter(d => d.id !== id));
        }
    };

    const handleChange = (id: number, field: string, value: string | number) => {
        setDetails(details.map(d => d.id === id ? { ...d, [field]: value } : d));
    };

    const calculateTotals = () => {
        const totalAddition = details.filter(d => d.type === 'addition').reduce((sum, item) => sum + Number(item.amount || 0), 0);
        const totalDeduction = details.filter(d => d.type === 'deduction').reduce((sum, item) => sum + Number(item.amount || 0), 0);
        return { totalAddition, totalDeduction, net: totalAddition - totalDeduction };
    };

    const totals = calculateTotals();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setNotification(null);
        setSavedInvoiceId(null);

        if (!employeeId) {
            setNotification({ type: 'error', message: 'الرجاء اختيار الموظف أولاً' });
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/payroll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: parseInt(employeeId),
                    period,
                    details
                })
            });

            const data = await res.json();
            if (res.ok) {
                setNotification({ type: 'success', message: data.message || 'تم إصدار مسير الراتب بنجاح!' });
                setSavedInvoiceId(data.data.invoice.id);
                setDetails([{ id: Date.now(), description: 'الراتب الأساسي', amount: 0, type: 'addition' }]);
                setEmployeeId('');
            } else {
                setNotification({ type: 'error', message: data.error || 'حدث خطأ أثناء حفظ مسير الرواتب' });
            }
        } catch (error) {
            setNotification({ type: 'error', message: 'تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-6 lg:p-10 font-sans text-slate-200">
            <div className="max-w-5xl mx-auto space-y-8">
                
                {/* Header Section */}
                <div className="flex items-center justify-between backdrop-blur-md bg-white/5 p-6 rounded-2xl border border-white/10 shadow-2xl">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="p-3 bg-indigo-500/20 rounded-xl">
                            <Calculator className="w-8 h-8 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">إصدار مسيرات الرواتب</h1>
                            <p className="text-slate-400 mt-1">وحدة الموارد البشرية - مرتبط آلياً بنظام الامتثال الضريبي (ZATCA)</p>
                        </div>
                    </div>
                </div>

                {/* Notification Area */}
                {notification && (
                    <div className={`p-4 rounded-xl flex flex-col space-y-3 animate-in fade-in slide-in-from-top-4 ${notification.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                        <div className={`flex items-center space-x-3 space-x-reverse ${notification.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            <span className="font-medium">{notification.message}</span>
                        </div>
                        {savedInvoiceId && (
                            <div className="pt-2">
                                <button 
                                    onClick={() => window.open(`/hr/payslip/${savedInvoiceId}`, '_blank')}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-all shadow-lg"
                                >
                                    طباعة / عرض إشعار الراتب (PDF)
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Line Items */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="backdrop-blur-md bg-white/5 rounded-2xl border border-white/10 p-6 shadow-xl transition-all duration-300 hover:shadow-indigo-500/10">
                            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                                <Receipt className="w-5 h-5 ml-2 text-indigo-400" /> تفاصيل الاستحقاقات والخصومات
                            </h2>
                            
                            <div className="space-y-4">
                                {details.map((item, index) => (
                                    <div key={item.id} className="group flex items-center space-x-4 space-x-reverse bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 hover:border-indigo-500/30 transition-colors">
                                        <div className="flex-1">
                                            <input 
                                                type="text" 
                                                value={item.description}
                                                onChange={(e) => handleChange(item.id, 'description', e.target.value)}
                                                placeholder="وصف البند (مثال: راتب أساسي، غياب)" 
                                                className="w-full bg-transparent border-0 border-b border-transparent focus:border-indigo-500 focus:ring-0 px-2 py-1 text-slate-200 placeholder-slate-500 transition-colors"
                                                required
                                            />
                                        </div>
                                        <div className="w-32">
                                            <div className="relative">
                                                <input 
                                                    type="number" 
                                                    value={item.amount || ''}
                                                    onChange={(e) => handleChange(item.id, 'amount', e.target.value)}
                                                    placeholder="0.00" 
                                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 px-3 py-2 text-left font-mono text-indigo-300"
                                                    required
                                                />
                                                <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-bold">SAR</span>
                                            </div>
                                        </div>
                                        <div className="w-28 flex justify-center">
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${item.type === 'addition' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                {item.type === 'addition' ? 'استحقاق +' : 'خصم -'}
                                            </span>
                                        </div>
                                        <button type="button" onClick={() => handleRemoveLine(item.id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors opacity-50 group-hover:opacity-100">
                                            <Minus className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex space-x-4 space-x-reverse mt-6">
                                <button type="button" onClick={() => handleAddLine('addition')} className="flex items-center px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-all font-medium text-sm">
                                    <Plus className="w-4 h-4 ml-1" /> إضافة استحقاق
                                </button>
                                <button type="button" onClick={() => handleAddLine('deduction')} className="flex items-center px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all font-medium text-sm">
                                    <Plus className="w-4 h-4 ml-1" /> إضافة خصم
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Employee Info & Summary */}
                    <div className="space-y-6">
                        <div className="backdrop-blur-md bg-white/5 rounded-2xl border border-white/10 p-6 shadow-xl">
                            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                                <UserCircle className="w-5 h-5 ml-2 text-indigo-400" /> معلومات الموظف
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">الموظف</label>
                                    <select 
                                        value={employeeId}
                                        onChange={(e) => handleEmployeeChange(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 px-4 py-3 text-slate-200 transition-all appearance-none"
                                        required
                                    >
                                        <option value="" disabled>-- اختر الموظف --</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.name} {emp.position ? `(${emp.position})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">الفترة المالية</label>
                                    <input 
                                        type="month" 
                                        value={period}
                                        onChange={(e) => setPeriod(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 px-4 py-3 text-slate-200 transition-all"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="backdrop-blur-md bg-indigo-500/10 rounded-2xl border border-indigo-500/20 p-6 shadow-xl">
                            <h2 className="text-lg font-semibold text-white mb-4">ملخص الراتب</h2>
                            
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">إجمالي الاستحقاقات</span>
                                    <span className="font-mono text-emerald-400 font-medium">+{totals.totalAddition.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">إجمالي الخصومات</span>
                                    <span className="font-mono text-red-400 font-medium">-{totals.totalDeduction.toFixed(2)}</span>
                                </div>
                                <div className="pt-3 border-t border-indigo-500/20 flex justify-between items-center">
                                    <span className="text-slate-300 font-medium">صافي الراتب المستحق</span>
                                    <span className="text-2xl font-mono text-white font-bold">{totals.net.toFixed(2)} <span className="text-sm text-indigo-400">SAR</span></span>
                                </div>
                            </div>

                            <button   
                                type="submit" 
                                disabled={loading || totals.net === 0 || !employeeId}
                                className="w-full flex items-center justify-center py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                {loading ? (
                                    <span className="flex items-center"><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> جاري المعالجة...</span>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" /> 
                                        اعتماد وتصدير
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
