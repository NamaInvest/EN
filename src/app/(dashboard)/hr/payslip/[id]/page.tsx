"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Printer, Download, ArrowRight, Building, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function PayslipViewer() {
 const { lang } = useTranslation();
 const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

 const params = useParams();
 const router = useRouter();
 const id = params?.id as string;

 const [invoice, setInvoice] = useState<any>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 if (!id) return;
 const fetchInvoice = async () => {
 try {
 // We'll create this API shortly: GET /api/payroll/[id]
 const res = await fetch(`/api/payroll/${id}`);
 if (res.ok) {
 setInvoice(await res.json());
 }
 } catch (err) {
 console.error(err);
 } finally {
 setLoading(false);
 }
 };
 fetchInvoice();
 }, [id]);

 if (loading) return <div className="min-h-screen flex items-center justify-center text-white">جاري تحميل إشعار الراتب...</div>;
 if (!invoice) return <div className="min-h-screen flex items-center justify-center text-white">لم يتم العثور على المسير</div>;

 const employee = invoice.employee;
 const additions = invoice.details.filter((d: any) => d.type === 'addition');
 const deductions = invoice.details.filter((d: any) => d.type === 'deduction');

 const totalAddition = additions.reduce((acc: number, curr: any) => acc + curr.amount, 0);
 const totalDeduction = deductions.reduce((acc: number, curr: any) => acc + curr.amount, 0);

 return (
 <div className="min-h-screen bg-slate-900 p-6 lg:p-10 font-sans text-slate-200">
 
 {/* Control Bar (Hidden on Print) */}
 <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
 <button onClick={() => router.back()} className="flex items-center text-slate-400 hover:text-white transition-colors">
 <ArrowRight className="w-5 h-5 ml-2" /> عودة
 </button>
 <div className="flex space-x-4 space-x-reverse">
 <button onClick={() => window.print()} className="flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/30">
 <Printer className="w-5 h-5 ml-2" /> طباعة / حفظ PDF
 </button>
 </div>
 </div>

 {/* A4 Printable Area */}
 <div className="max-w-4xl mx-auto bg-white text-slate-900 rounded-lg shadow-2xl print:shadow-none print:w-full print:max-w-full print:m-0 overflow-hidden">
 
 {/* Header */}
 <div className="bg-slate-50 p-8 border-b border-slate-200 flex justify-between items-start">
 <div>
 <div className="flex items-center text-indigo-700 mb-2">
 <Building className="w-8 h-8 ml-3" />
 <h1 className="text-3xl font-black tracking-tight">شركة نما انفست</h1>
 </div>
 <p className="text-slate-500 text-sm font-medium">الرقم الضريبي: 314122115700003</p>
 <p className="text-slate-500 text-sm mt-1">المملكة العربية السعودية، الرياض</p>
 </div>
 <div className="text-left">
 <h2 className="text-4xl font-black text-slate-200 uppercase tracking-widest mb-2">Payslip</h2>
 <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold">
 <CheckCircle2 className="w-4 h-4 ml-1.5" /> معتمد
 </div>
 <p className="text-slate-500 mt-4 font-mono">#{invoice.invoiceNo}</p>
 </div>
 </div>

 <div className="p-8">
 
 {/* Employee Info */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
 <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
 <p className="text-xs text-slate-400 font-bold uppercase mb-1">اسم الموظف</p>
 <p className="font-bold text-slate-800">{employee.name}</p>
 </div>
 <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
 <p className="text-xs text-slate-400 font-bold uppercase mb-1">رقم الموظف</p>
 <p className="font-bold text-slate-800 font-mono">{employee.id.toString().padStart(4, '0')}</p>
 </div>
 <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
 <p className="text-xs text-slate-400 font-bold uppercase mb-1">الفترة المالية</p>
 <p className="font-bold text-slate-800 font-mono">{invoice.period}</p>
 </div>
 <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
 <p className="text-xs text-slate-400 font-bold uppercase mb-1">تاريخ الإصدار</p>
 <p className="font-bold text-slate-800 font-mono">{new Date(invoice.createdAt).toLocaleDateString('en-GB')}</p>
 </div>
 </div>

 {/* Salary Details Table */}
 <div className="mb-10 rounded-2xl border border-slate-200 overflow-hidden">
 <table className="w-full text-right">
 <thead>
 <tr className="bg-slate-800 text-white">
 <th className="py-4 px-6 font-semibold w-1/2">البيان (Description)</th>
 <th className="py-4 px-6 font-semibold text-center border-r border-slate-700">الاستحقاقات (Earnings)</th>
 <th className="py-4 px-6 font-semibold text-center border-r border-slate-700">الخصومات (Deductions)</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200">
 {/* Interleave Additions and Deductions for a clean look */}
 {Array.from({ length: Math.max(additions.length, deductions.length) }).map((_, i) => (
 <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
 <td className="py-3 px-6 text-slate-700 font-medium border-l border-slate-200">
 {additions[i]?.description || deductions[i]?.description || ''}
 </td>
 <td className="py-3 px-6 text-center font-mono font-bold text-slate-800">
 {additions[i] ? additions[i].amount.toLocaleString('en-US', {minimumFractionDigits: 2}) : ''}
 </td>
 <td className="py-3 px-6 text-center font-mono font-bold text-rose-600 border-r border-slate-200">
 {deductions[i] ? deductions[i].amount.toLocaleString('en-US', {minimumFractionDigits: 2}) : ''}
 </td>
 </tr>
 ))}
 {/* Totals Row */}
 <tr className="bg-slate-100 font-black border-t-2 border-slate-300">
 <td className="py-4 px-6 text-slate-800 text-left border-l border-slate-200">الإجمالي (Total)</td>
 <td className="py-4 px-6 text-center text-slate-800 font-mono border-r border-slate-300">{totalAddition.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
 <td className="py-4 px-6 text-center text-rose-600 font-mono border-r border-slate-300">{totalDeduction.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
 </tr>
 </tbody>
 </table>
 </div>

 {/* Net Salary Summary */}
 <div className="flex justify-end mb-16">
 <div className="w-full md:w-1/2 bg-slate-800 text-white p-6 rounded-2xl shadow-xl flex justify-between items-center transform hover:scale-105 transition-transform duration-300">
 <div>
 <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">الصافي المستحق للموظف</p>
 <p className="text-slate-300 text-xs">Net Pay (SAR)</p>
 </div>
 <h2 className="text-4xl font-black font-mono tracking-tight text-emerald-400">
 {invoice.total.toLocaleString('en-US', {minimumFractionDigits: 2})} <span className="text-lg text-slate-400">SAR</span>
 </h2>
 </div>
 </div>

 {/* Footer / Disclaimer */}
 <div className="pt-8 border-t border-slate-200 text-center text-slate-400 text-xs font-medium">
 <p>هذا الإشعار تم إصداره آلياً من نظام إدارة الموارد البشرية لشركة نما انفست ولا يحتاج إلى توقيع.</p>
 <p className="mt-1 font-mono">This is a system generated payslip and does not require a signature.</p>
 </div>

 </div>
 </div>

 <style dangerouslySetInnerHTML={{__html: `
 @media print {
 @page { size: A4; margin: 10mm; }
 body { background: white !important; }
 .print\\:hidden { display: none !important; }
 .print\\:shadow-none { box-shadow: none !important; }
 .print\\:w-full { width: 100% !important; }
 .print\\:m-0 { margin: 0 !important; }
 }
 `}} />
 </div>
 );
}
