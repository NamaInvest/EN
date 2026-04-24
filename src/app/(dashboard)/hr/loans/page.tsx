'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

interface Employee { id: number; name: string; }
interface Loan { id: number; employeeId: number; amount: number; monthlyDeduction: number; remainingAmount: number; reason: string; status: string; startDate: string; employee: Employee; }

export default function LoansPage() {
    const { t } = useTranslation();
    const { error: toastError, success: toastSuccess } = useToast();
    const [loans, setLoans] = useState<Loan[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ employeeId: '', amount: '', monthlyDeduction: '', reason: '', startDate: new Date().toISOString().split('T')[0] });

    useEffect(() => { load(); loadEmployees(); }, []);
    
    async function load() { 
        setLoading(true); 
        try { 
            const r = await fetch('/api/hr/loans'); 
            if (r.ok) setLoans(await r.json()); 
        } catch (e: any) { toastError(e?.message || 'حدث خطأ'); } 
        setLoading(false); 
    };
    
    async function loadEmployees() { 
        try { 
            const r = await fetch('/api/employees'); 
            if (r.ok) setEmployees(await r.json()); 
        } catch (e: any) { toastError(e?.message || 'حدث خطأ'); } 
    };

    const handleSave = async () => {
        try {
            const res = await fetch('/api/hr/loans', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) { alert(t('hr.str_2181')); setShowModal(false); load(); }
            else { const d = await res.json(); alert(d.error || t('hr.str_2182')); }
        } catch (err: any) { toastError(err?.message || 'حدث خطأ'); }
    };

    return (
        <div className="page-content animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">{t('hr.str_2169')}</h1>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>{t('hr.str_2170')}</button>
            </div>
            
            <div className="card-glass border shadow-sm overflow-hidden" style={{ padding: '0' }}>
                <table className="w-full text-right">
                    <thead style={{ background: 'var(--bg-card-hover)' }} className="border-b border-white/10">
                        <tr>
                            <th className="p-4">{t('sys.str_379')}</th>
                            <th className="p-4">{t('hr.str_2171')}</th>
                            <th className="p-4">{t('hr.str_2172')}</th>
                            <th className="p-4">{t('hr.str_2173')}</th>
                            <th className="p-4">{t('hr.str_2174')}</th>
                            <th className="p-4">{t('hr.str_2175')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={6} className="text-center p-8">{t('sys.str_168')}</td></tr> : 
                        loans.map(loan => (
                            <tr key={loan.id} className="border-b">
                                <td className="p-4 font-bold">{loan.employee?.name}</td>
                                <td className="p-4 font-mono text-indigo-600 font-bold">{loan.amount} SAR</td>
                                <td className="p-4 font-mono text-slate-600">{loan.monthlyDeduction} SAR/mo</td>
                                <td className="p-4 font-mono text-red-500 font-bold">{loan.remainingAmount} SAR</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-xs rounded-full ${loan.status === 'active' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                        {loan.status === 'active' ? t('hr.str_2183') : t('hr.str_2184')}
                                    </span>
                                </td>
                                <td className="p-4 text-slate-500 text-sm">{new Date(loan.startDate).toLocaleDateString('en-GB')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal p-6 w-96 max-w-full">
                        <h2 className="text-xl font-bold mb-4">{t('hr.str_2176')}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">{t('sys.str_379')}</label>
                                <select className="input w-full" value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})}>
                                    <option value="">{t('hr.str_2138')}</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">{t('hr.str_2177')}</label>
                                <input type="number" className="input w-full" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} dir="ltr"/>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">{t('hr.str_2178')}</label>
                                <input type="number" className="input w-full" value={form.monthlyDeduction} onChange={e => setForm({...form, monthlyDeduction: e.target.value})} dir="ltr"/>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">{t('hr.str_2179')}</label>
                                <input type="text" className="input w-full" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('fin.str_206')}</button>
                                <button className="btn btn-primary" onClick={handleSave}>{t('hr.str_2180')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
