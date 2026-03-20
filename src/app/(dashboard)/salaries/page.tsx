'use client';
import { useState, useEffect } from 'react';
import { Calculator, FileText, CheckCircle2, UserCheck, AlertTriangle } from 'lucide-react';

interface Employee { id: number; name: string; salary: number; housingAllowance: number; transportAllowance: number }
interface Salary { id: number; month: number; year: number; basicSalary: number; additions: number; deductions: number; netSalary: number; notes: string; paidDate: string; employee: Employee }

export default function SalariesPage() {
    const [salaries, setSalaries] = useState<Salary[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Payroll Gen State
    const [genMonth, setGenMonth] = useState(new Date().getMonth() + 1);
    const [genYear, setGenYear] = useState(new Date().getFullYear());

    useEffect(() => { load(); loadEmployees(); }, []);
    
    async function load() { 
        setLoading(true); 
        try { 
            const r = await fetch('/api/salaries'); 
            if (r.ok) setSalaries(await r.json()); 
        } catch (e) { console.error(e); } 
        setLoading(false); 
    };
    
    async function loadEmployees() { 
        try { 
            const r = await fetch('/api/employees'); 
            if (r.ok) { const data = await r.json(); setEmployees(data); } 
        } catch (e) { console.error(e); } 
    };

    const handleGeneratePayroll = async () => {
        const confirmMsg = `تنبيه: سيتم إصدار مسير الرواتب لجميع موظفي الشركة النشطين (${employees.length} موظف) لشهر ${genMonth}/${genYear}. النظام سيحسب آلياً:
1. الراتب الأساسي + البدلات (سكن، مواصلات).
2. خصومات التغيب (بناءً على سجل الحضور).
3. خصومات التأمينات الاجتماعية (GOSI).
4. ترحيل إجمالي الرواتب آلياً لقيد محاسبي (Journal Entry).

هل أنت متأكد من اعتماد المسير؟`;

        if (!confirm(confirmMsg)) return;

        setIsGenerating(true);
        try {
            const token = localStorage.getItem('token') || '';
            const r = await fetch('/api/hr/payroll/generate', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
                body: JSON.stringify({ month: genMonth, year: genYear }) 
            });
            const data = await r.json();
            
            if (r.ok) { 
                alert(data.message);
                load(); 
            } else {
                alert(data.error || "خطأ في توليد مسير الرواتب");
            }
        } catch(e) {
             alert("حدث خطأ في النظام الداخلي.");
        }
        setIsGenerating(false);
    };

    const fmt = (n: number) => (n || 0).toLocaleString('en-SA', { minimumFractionDigits: 2 });
    
    const companyTotalNet = salaries.reduce((acc, curr) => acc + curr.netSalary, 0);

    return (
        <div className="p-6 max-w-7xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
                        <FileText className="w-8 h-8 text-indigo-600" /> مسير الرواتب الموحد (Payroll)
                    </h1>
                    <p className="text-slate-500 mt-2">إصدار دورة الرواتب الشهرية للشركة وحساب البدلات والخصومات والتأمينات آلياً.</p>
                </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 mb-8 shadow-sm flex items-center justify-between">
                <div>
                    <h3 className="text-indigo-900 font-bold text-lg flex items-center gap-2 mb-2">
                        <Calculator size={20} className="text-indigo-600"/> إصدار مسير رواتب جديد
                    </h3>
                    <p className="text-indigo-700/80 text-sm max-w-md">حدد الشهر والسنة لتشغيل محرك الرواتب الآلي. لن يسمح النظام بإصدار مسير لنفس الشهر مرتين.</p>
                </div>

                <div className="flex items-center gap-4 bg-white p-3 rounded-lg shadow-sm border border-indigo-50">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">الشهر</label>
                        <input type="number" min="1" max="12" className="w-20 p-2 border rounded text-center font-bold outline-none focus:border-indigo-500" value={genMonth} onChange={e => setGenMonth(parseInt(e.target.value))} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">السنة</label>
                        <input type="number" min="2020" max="2050" className="w-24 p-2 border rounded text-center font-bold outline-none focus:border-indigo-500" value={genYear} onChange={e => setGenYear(parseInt(e.target.value))} />
                    </div>
                    <button 
                        onClick={handleGeneratePayroll}
                        disabled={isGenerating || employees.length === 0}
                        className="bg-indigo-600 text-white px-6 py-4 rounded-md font-bold shadow-md hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2 mt-5"
                    >
                        {isGenerating ? 'جاري الحساب والترحيل...' : '⚙️ اعتماد وإصدار المسير'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <UserCheck size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500">إجمالي عدد الموظفين النشطين</p>
                        <p className="text-3xl font-extrabold text-slate-800">{employees.length} <span className="text-sm font-normal text-slate-400">موظف مسجل</span></p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
                    <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <CheckCircle2 size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500">إجمالي الرواتب المصروفة (Net)</p>
                        <p className="text-3xl font-extrabold text-indigo-600" dir="ltr">{fmt(companyTotalNet)} <span className="text-sm text-indigo-400">SAR</span></p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700">
                    سجل قسائم الرواتب المُصدرة (Payslips)
                </div>
                {loading ? (
                    <div className="p-12 text-center text-slate-400">جاري تحميل سجلات الرواتب...</div>
                ) : salaries.length === 0 ? (
                    <div className="p-16 text-center flex flex-col items-center justify-center text-slate-400">
                        <AlertTriangle size={48} className="mb-4 text-slate-300" />
                        <span className="font-bold text-lg text-slate-500">لا توجد مسيرات رواتب مُصدرة</span>
                        <p className="text-sm mt-2">استخدم أداة الإصدار بالأعلى لتوليد المسير لشهر محدد.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-right">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                            <tr>
                                <th className="px-6 py-4 font-bold">اسم الموظف</th>
                                <th className="px-6 py-4 font-bold text-center">عن شهر</th>
                                <th className="px-6 py-4 font-bold text-left">تاريخ الإصدار</th>
                                <th className="px-6 py-4 font-bold text-left">الأساسي (Base)</th>
                                <th className="px-6 py-4 font-bold text-left">البدلات (+ Allowances)</th>
                                <th className="px-6 py-4 font-bold text-left">استقطاعات غياب/تأمينات (-)</th>
                                <th className="px-6 py-4 font-bold text-left bg-emerald-50 text-emerald-900 border-r border-emerald-100">صافي التحويل (Net)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salaries.map(s => (
                                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                    <td className="px-6 py-4 font-bold text-slate-800 flex flex-col">
                                        <span>{s.employee?.name}</span>
                                        <span className="text-xs text-slate-400 font-normal truncate max-w-[200px]" title={s.notes}>{s.notes}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-indigo-600 bg-indigo-50/50">
                                        {String(s.month).padStart(2,'0')} / {s.year}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-left font-mono">
                                        {new Date(s.paidDate).toLocaleDateString('en-GB')}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 text-left font-mono" dir="ltr">{fmt(s.basicSalary)}</td>
                                    <td className="px-6 py-4 text-emerald-600 text-left font-bold font-mono" dir="ltr">+{fmt(s.additions)}</td>
                                    <td className="px-6 py-4 text-red-500 text-left font-bold font-mono" dir="ltr">-{fmt(s.deductions)}</td>
                                    <td className="px-6 py-4 text-left font-black text-emerald-700 bg-emerald-50/50 border-r border-emerald-100 text-lg" dir="ltr">
                                        {fmt(s.netSalary)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
