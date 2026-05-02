'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { AlertTriangle, CheckCircle, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

export default function BudgetVarianceReportPage() {
    const { t } = useTranslation();
    const [budgets, setBudgets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/budgeting/variance', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setBudgets(await res.json());
        } catch (e) { console.error(e); }
        setLoading(false);
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">تقرير انحراف الموازنة (Budget Variance Report)</h1>
            </div>

            <div className="page-content animate-fade-in">
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>جاري التحميل...</div>
                ) : budgets.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '40px' }}>لا توجد موازنات معتمدة حالياً.</div>
                ) : budgets.map(budget => (
                    <div key={budget.budgetId} className="card" style={{ marginBottom: '30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '15px' }}>
                            <h2 style={{ fontSize: '20px', margin: 0 }}><BarChart2 size={24} style={{ display:'inline', marginRight:'10px', color: '#6366f1' }}/> {budget.name}</h2>
                            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>الإجمالي المعتمد: {budget.totalAllocated.toLocaleString()} ر.س</div>
                        </div>

                        {/* Chart */}
                        <div style={{ height: '300px', width: '100%', marginBottom: '30px' }}>
                            <ResponsiveContainer>
                                <BarChart data={budget.variances} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="accountName" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend iconType="circle" />
                                    <Bar dataKey="allocated" name="المعتمد (Allocated)" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="spent" name="المنصرف (Spent)" fill="#f87171" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="encumbered" name="المحجوز (Encumbered)" fill="#fcd34d" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Table */}
                        <div style={{ overflowX: 'auto' }}>
                            <table className="table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>الحساب</th>
                                        <th>مركز التكلفة</th>
                                        <th>المبلغ المعتمد</th>
                                        <th>المنصرف الفعلي</th>
                                        <th>المحجوز (Encumbered)</th>
                                        <th>المتبقي (Variance)</th>
                                        <th>الحالة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {budget.variances.map((v: any, idx: number) => (
                                        <tr key={idx} style={{ backgroundColor: v.status === 'UNFAVORABLE' ? '#fee2e2' : 'transparent' }}>
                                            <td><strong>{v.accountName}</strong></td>
                                            <td>{v.costCenterName}</td>
                                            <td>{v.allocated.toLocaleString()}</td>
                                            <td>{v.spent.toLocaleString()}</td>
                                            <td>{v.encumbered.toLocaleString()}</td>
                                            <td style={{ fontWeight: 'bold', color: v.variance >= 0 ? '#10b981' : '#ef4444' }}>
                                                {v.variance.toLocaleString()}
                                            </td>
                                            <td>
                                                {v.status === 'FAVORABLE' ? (
                                                    <span style={{ color: '#10b981', fontWeight: 'bold' }}><CheckCircle size={14} style={{display:'inline'}}/> إيجابي</span>
                                                ) : (
                                                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}><AlertTriangle size={14} style={{display:'inline'}}/> تجاوز الموازنة!</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
