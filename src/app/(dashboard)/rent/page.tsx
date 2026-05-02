"use client";

import React, { useState } from 'react';
import { Home, Building2, Receipt, Plus, Minus, Save, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

// Using Google Fonts for elegant typography
const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Cinzel:wght@600&display=swap');`;

export default function RentDashboard() {
    const { lang } = useTranslation();
    const { success, info, error } = useToast();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

    const router = useRouter();
    const [customerId, setCustomerId] = useState('');
    const [details, setDetails] = useState([
        { id: 1, description: 'إيجار شقة رقم 102 - عقد سنوي', quantity: 1, unitPrice: 0 }
    ]);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleAddLine = () => {
        setDetails([...details, { id: Date.now(), description: '', quantity: 1, unitPrice: 0 }]);
    };

    const handleRemoveLine = (id: number) => {
        if (details.length > 1) {
            setDetails(details.filter(d => d.id !== id));
        }
    };

    const handleChange = (id: number, field: string, value: string | number) => {
        setDetails(details.map(d => d.id === id ? { ...d, [field]: value } : d));
    };

    const calculateTotal = () => {
        return details.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0);
    };

    const total = calculateTotal();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setNotification(null);

        try {
            const res = await fetch('/api/rent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: parseInt(customerId) || 1, // Fallback for testing
                    details
                })
            });

            const data = await res.json();
            if (res.ok) {
                setNotification({ type: 'success', message: 'تم إصدار مطالبة الإيجار بنجاح وتم تسجيلها للزكاة والدخل!' });
                setDetails([{ id: Date.now(), description: '', quantity: 1, unitPrice: 0 }]);
                setCustomerId('');
            } else {
                setNotification({ type: 'error', message: data.error || 'حدث خطأ أثناء حفظ الفاتورة' });
            }
        } catch (error) {
            setNotification({ type: 'error', message: 'تعذر الاتصال بالخادم' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F0FDFA] p-6 lg:p-12" style={{ fontFamily: "'Cairo', sans-serif" }}>
            <style dangerouslySetInnerHTML={{ __html: fontImport }} />
            
            <div className="max-w-6xl mx-auto space-y-10">
                {/* Header (Minimalism & Swiss Style) */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b-2 border-[#14B8A6]/20 pb-6">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="p-4 bg-white rounded-2xl shadow-[0_8px_30px_rgb(20,184,166,0.12)]">
                            <Building2 className="w-8 h-8 text-[#0F766E]" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-[#134E4A] tracking-tight" style={{ fontFamily: "'Cinzel', serif" }}>
                                NAMA RENTALS
                            </h1>
                            <p className="text-[#0F766E] mt-1 font-semibold text-lg">نظام إدارة الأملاك والعقارات</p>
                        </div>
                    </div>
                </div>

                {notification && (
                    <div className={`p-4 rounded-xl flex items-center space-x-3 space-x-reverse transition-all duration-300 ${
                        notification.type === 'success' 
                            ? 'bg-teal-50 border border-teal-200 text-teal-800' 
                            : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                        {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="font-bold">{notification.message}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left/Main Column: Invoice Lines */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(20,184,166,0.08)] border border-[#14B8A6]/10">
                            <h2 className="text-2xl font-bold text-[#134E4A] mb-8 flex items-center">
                                <Receipt className="w-6 h-6 ml-3 text-[#0F766E]" /> تفاصيل الإيجار والخدمات
                            </h2>
                            
                            <div className="space-y-4">
                                {details.map((item, index) => (
                                    <div key={item.id} className="group flex flex-wrap md:flex-nowrap items-center gap-4 bg-slate-50 hover:bg-teal-50/50 p-4 rounded-2xl border border-slate-100 hover:border-teal-200 transition-colors duration-200">
                                        <div className="flex-1 min-w-[200px]">
                                            <input 
                                                type="text" 
                                                value={item.description}
                                                onChange={(e) => handleChange(item.id, 'description', e.target.value)}
                                                placeholder="وصف الوحدة أو الخدمة" 
                                                className="w-full bg-transparent border-0 border-b-2 border-slate-200 focus:border-[#0F766E] focus:ring-0 px-2 py-2 text-[#134E4A] font-semibold transition-colors outline-none"
                                                required
                                            />
                                        </div>
                                        <div className="w-24">
                                            <label className="text-xs text-slate-500 font-bold block mb-1">الكمية/المدة</label>
                                            <input 
                                                type="number" 
                                                value={item.quantity || ''}
                                                onChange={(e) => handleChange(item.id, 'quantity', e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-xl focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] px-3 py-2 text-center font-bold text-[#134E4A] outline-none"
                                                required min="1"
                                            />
                                        </div>
                                        <div className="w-32">
                                            <label className="text-xs text-slate-500 font-bold block mb-1">سعر الوحدة (SAR)</label>
                                            <input 
                                                type="number" 
                                                value={item.unitPrice || ''}
                                                onChange={(e) => handleChange(item.id, 'unitPrice', e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-xl focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] px-3 py-2 text-left font-bold text-[#134E4A] outline-none"
                                                required min="0" step="0.01"
                                            />
                                        </div>
                                        <div className="w-12 flex justify-center pt-5">
                                            <button type="button" onClick={() => handleRemoveLine(item.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer">
                                                <Minus className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button type="button" onClick={handleAddLine} className="mt-6 flex items-center px-5 py-3 bg-teal-50 text-[#0F766E] border border-teal-200 rounded-xl hover:bg-teal-100 transition-colors font-bold text-sm cursor-pointer">
                                <Plus className="w-5 h-5 ml-2" /> إضافة وحدة / خدمة
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Customer Info & Summary */}
                    <div className="lg:col-span-4 space-y-6">
                        
                        {/* Customer Box */}
                        <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(20,184,166,0.08)] border border-[#14B8A6]/10">
                            <h2 className="text-xl font-bold text-[#134E4A] mb-6 flex items-center">
                                <User className="w-5 h-5 ml-3 text-[#0F766E]" /> بيانات المستأجر
                            </h2>
                            <div>
                                <label className="block text-sm font-bold text-[#0F766E] mb-2">رقم المستأجر / الهوية</label>
                                <input 
                                    type="number" 
                                    value={customerId}
                                    onChange={(e) => setCustomerId(e.target.value)}
                                    placeholder="أدخل رقم حساب المستأجر"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0F766E] focus:bg-white focus:ring-2 focus:ring-[#0F766E]/20 px-4 py-3 text-[#134E4A] font-bold transition-all outline-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* Summary & Checkout */}
                        <div className="bg-[#134E4A] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                            {/* Decorative background shape */}
                            <div className="absolute -top-16 -right-16 w-32 h-32 bg-[#14B8A6] rounded-full opacity-20 blur-2xl"></div>
                            
                            <h2 className="text-xl font-bold text-white mb-6 relative z-10">إجمالي المطالبة</h2>
                            
                            <div className="space-y-4 mb-8 relative z-10">
                                <div className="flex justify-between items-center pb-4 border-b border-white/10">
                                    <span className="text-teal-100">المبلغ الإجمالي</span>
                                    <span className="text-3xl font-bold text-white tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>
                                        {total.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-teal-200/60">العملة</span>
                                    <span className="font-bold text-teal-100">ريال سعودي (SAR)</span>
                                </div>
                            </div>

                            <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  
                                type="submit" 
                                disabled={loading || total === 0}
                                className="w-full flex items-center justify-center py-4 px-6 bg-[#0369A1] hover:bg-[#0284C7] text-white rounded-xl font-bold text-lg transition-all shadow-[0_4px_14px_0_rgba(3,105,161,0.39)] hover:shadow-[0_6px_20px_rgba(3,105,161,0.23)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer relative z-10"
                            >
                                {loading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> 
                                        جاري الاعتماد...
                                    </span>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5 ml-2" /> 
                                        حفظ الفاتورة
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
