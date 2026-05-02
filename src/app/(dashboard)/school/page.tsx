"use client";

import React, { useState } from 'react';
import { GraduationCap, BookOpen, Library, Plus, Minus, Check, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

// Academic English + Chunky Arabic font pairing for Claymorphism
const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Readex+Pro:wght@400;500;600;700&family=EB+Garamond:wght@600;700;800&display=swap');`;

export default function SchoolDashboard() {
    const { success, info } = useToast();

    const router = useRouter();
    const [studentId, setStudentId] = useState('');
    const [details, setDetails] = useState([
        { id: 1, description: 'رسوم التسجيل للفصل الدراسي الأول', quantity: 1, unitPrice: 0 }
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
            const res = await fetch('/api/school', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: parseInt(studentId) || 1, // Fallback for testing
                    details
                })
            });

            const data = await res.json();
            if (res.ok) {
                setNotification({ type: 'success', message: 'تم إصدار مطالبة الرسوم بنجاح وهي قيد الاعتماد الزكوي!' });
                setDetails([{ id: Date.now(), description: '', quantity: 1, unitPrice: 0 }]);
                setStudentId('');
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
        <div className="min-h-screen bg-[#F5F3FF] p-6 lg:p-10" style={{ fontFamily: "'Readex Pro', sans-serif" }}>
            <style dangerouslySetInnerHTML={{ __html: fontImport }} />
            
            <div className="max-w-6xl mx-auto space-y-12">
                
                {/* Header (Claymorphism Style) */}
                <div className="flex flex-col md:flex-row items-center justify-between pb-6 pt-4">
                    <div className="flex items-center space-x-6 space-x-reverse">
                        <div className="p-5 bg-white rounded-3xl border-[3px] border-[#818CF8] shadow-[8px_8px_0px_#6366F1] hover:-translate-y-1 hover:shadow-[10px_10px_0px_#6366F1] transition-all duration-300">
                            <GraduationCap className="w-10 h-10 text-[#6366F1]" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-extrabold text-[#1E1B4B] tracking-tight" style={{ fontFamily: "'EB Garamond', serif" }}>
                                NAMA ACADEMY
                            </h1>
                            <p className="text-[#6366F1] mt-2 font-bold text-lg bg-[#E0E7FF] px-4 py-1 rounded-full inline-block">
                                نظام إدارة الرسوم المدرسية
                            </p>
                        </div>
                    </div>
                </div>

                {notification && (
                    <div className={`p-5 rounded-2xl border-[3px] shadow-[4px_4px_0px_rgba(0,0,0,0.1)] flex items-center space-x-4 space-x-reverse transition-all duration-300 ${
                        notification.type === 'success' 
                            ? 'bg-[#10B981]/10 border-[#10B981] text-[#065F46]' 
                            : 'bg-red-100 border-red-500 text-red-900'
                    }`}>
                        {notification.type === 'success' ? <CheckCircle2 className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
                        <span className="font-bold text-lg">{notification.message}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* Left/Main Column: Invoice Lines */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="bg-white rounded-[2rem] p-8 border-[4px] border-[#E0E7FF] shadow-[0_10px_30px_rgb(99,102,241,0.1)] hover:border-[#818CF8] transition-colors duration-300 relative overflow-hidden">
                            {/* Decorative element */}
                            <div className="absolute top-0 left-0 w-32 h-32 bg-[#6366F1]/5 rounded-br-full pointer-events-none"></div>

                            <h2 className="text-2xl font-bold text-[#1E1B4B] mb-8 flex items-center">
                                <BookOpen className="w-7 h-7 ml-3 text-[#6366F1]" /> تفاصيل الرسوم الدراسية
                            </h2>
                            
                            <div className="space-y-6">
                                {details.map((item, index) => (
                                    <div key={item.id} className="group flex flex-wrap md:flex-nowrap items-center gap-4 bg-[#F5F3FF] p-5 rounded-[1.5rem] border-[3px] border-transparent hover:border-[#818CF8] hover:shadow-[4px_4px_0px_#C7D2FE] transition-all duration-200">
                                        <div className="flex-1 min-w-[200px]">
                                            <input 
                                                type="text" 
                                                value={item.description}
                                                onChange={(e) => handleChange(item.id, 'description', e.target.value)}
                                                placeholder="بيان الرسوم (مثال: رسوم باص, زي مدرسي)" 
                                                className="w-full bg-white border-[3px] border-[#E0E7FF] focus:border-[#6366F1] focus:ring-0 rounded-2xl px-4 py-3 text-[#1E1B4B] font-bold transition-all outline-none"
                                                required
                                            />
                                        </div>
                                        <div className="w-24">
                                            <input 
                                                type="number" 
                                                value={item.quantity || ''}
                                                onChange={(e) => handleChange(item.id, 'quantity', e.target.value)}
                                                placeholder="الكمية"
                                                className="w-full bg-white border-[3px] border-[#E0E7FF] rounded-2xl focus:border-[#6366F1] focus:ring-0 px-3 py-3 text-center font-bold text-[#1E1B4B] outline-none transition-all"
                                                required min="1"
                                            />
                                        </div>
                                        <div className="w-32">
                                            <input 
                                                type="number" 
                                                value={item.unitPrice || ''}
                                                onChange={(e) => handleChange(item.id, 'unitPrice', e.target.value)}
                                                placeholder="السعر"
                                                className="w-full bg-white border-[3px] border-[#E0E7FF] rounded-2xl focus:border-[#6366F1] focus:ring-0 px-3 py-3 text-left font-bold text-[#1E1B4B] outline-none transition-all"
                                                required min="0" step="0.01"
                                            />
                                        </div>
                                        <div className="w-12 flex justify-center">
                                            <button type="button" onClick={() => handleRemoveLine(item.id)} className="p-3 bg-red-100 text-red-500 border-2 border-red-200 hover:bg-red-500 hover:text-white rounded-[1rem] shadow-[2px_2px_0px_#FCA5A5] hover:shadow-[0px_0px_0px_#FCA5A5] hover:translate-y-[2px] hover:translate-x-[-2px] transition-all cursor-pointer">
                                                <Minus className="w-5 h-5" strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button type="button" onClick={handleAddLine} className="mt-8 flex items-center px-6 py-4 bg-white text-[#6366F1] border-[3px] border-[#6366F1] rounded-2xl hover:bg-[#6366F1] hover:text-white shadow-[4px_4px_0px_#6366F1] hover:shadow-none hover:translate-y-[4px] hover:translate-x-[-4px] transition-all font-bold text-lg cursor-pointer">
                                <Plus className="w-6 h-6 ml-2" strokeWidth={3} /> إضافة رسوم أخرى
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Student Info & Summary */}
                    <div className="lg:col-span-4 space-y-8">
                        
                        {/* Student Box */}
                        <div className="bg-white rounded-[2rem] p-8 border-[4px] border-[#E0E7FF] shadow-[0_10px_30px_rgb(99,102,241,0.1)] relative">
                            <h2 className="text-xl font-bold text-[#1E1B4B] mb-6 flex items-center">
                                <Library className="w-6 h-6 ml-3 text-[#6366F1]" /> بيانات الطالب
                            </h2>
                            <div>
                                <label className="block text-sm font-bold text-[#6366F1] mb-2 ml-1">الرقم الأكاديمي / الهوية</label>
                                <input 
                                    type="number" 
                                    value={studentId}
                                    onChange={(e) => setStudentId(e.target.value)}
                                    placeholder="مثال: 4410293"
                                    className="w-full bg-[#F5F3FF] border-[3px] border-[#E0E7FF] rounded-2xl focus:border-[#6366F1] focus:bg-white focus:shadow-[0_0_0_4px_rgba(99,102,241,0.1)] px-5 py-4 text-[#1E1B4B] font-bold transition-all outline-none text-lg"
                                    required
                                />
                            </div>
                        </div>

                        {/* Summary & Checkout - Claymorphism style */}
                        <div className="bg-[#6366F1] rounded-[2.5rem] p-8 border-[4px] border-[#4F46E5] shadow-[inset_-4px_-4px_12px_rgba(0,0,0,0.2),inset_4px_4px_12px_rgba(255,255,255,0.2)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                            
                            <h2 className="text-2xl font-bold text-white mb-8 relative z-10">الملخص المالي</h2>
                            
                            <div className="space-y-5 mb-10 relative z-10 bg-white/10 p-6 rounded-[1.5rem] border border-white/20 backdrop-blur-sm">
                                <div className="flex justify-between items-center text-indigo-100 font-medium">
                                    <span>إجمالي البنود</span>
                                    <span className="font-bold">{details.length}</span>
                                </div>
                                <div className="flex justify-between items-center pt-5 border-t-2 border-white/20">
                                    <span className="text-white font-bold text-lg">المطلوب سداده</span>
                                    <span className="text-4xl font-black text-white" style={{ fontFamily: "'EB Garamond', serif" }}>
                                        {total.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <button   
                                type="submit" 
                                disabled={loading || total === 0}
                                className="w-full flex items-center justify-center py-5 px-6 bg-[#10B981] text-white rounded-2xl font-bold text-xl border-[3px] border-[#059669] shadow-[0_8px_0_#059669] hover:shadow-[0_2px_0_#059669] hover:translate-y-[6px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer relative z-10"
                            >
                                {loading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> 
                                        جاري المعالجة...
                                    </span>
                                ) : (
                                    <>
                                        <Check className="w-6 h-6 ml-3" strokeWidth={4} /> 
                                        اعتماد المطالبة
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
