'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Wallet, Banknote, ShieldAlert } from 'lucide-react';

export default function PettyCashFundsPage() {
    const [funds, setFunds] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        id: '', fundName: '', custodianId: '', maxLimit: '', currentBalance: '', status: 'ACTIVE'
    });

    useEffect(() => {
        fetchData();
        fetchEmployees();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/fng/petty-cash-funds', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFunds(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/employees', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEmployees(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const token = localStorage.getItem('token');
        const isUpdate = !!formData.id;

        try {
            const res = await fetch('/api/fng/petty-cash-funds', {
                method: isUpdate ? 'PUT' : 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setShowModal(false);
                fetchData();
            } else {
                alert('فشل في حفظ العهدة');
            }
        } catch (error) {
            alert('حدث خطأ بالاتصال');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذه العهدة نهائياً؟')) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/fng/petty-cash-funds?id=${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) fetchData();
        } catch (error) {
            alert('خطأ في الاتصال');
        }
    };

    return (
        <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Wallet size={28} color="var(--primary)" />
                        صناديق العهد النثرية (Petty Cash)
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
                        إدارة النقدية المصغرة، تعيين أمناء الصناديق، ومراقبة الالتزامات وحدود الصرف.
                    </p>
                </div>
                <button 
                    className="btn btn-primary"
                    onClick={() => {
                        setFormData({ id: '', fundName: '', custodianId: employees[0]?.id || '', maxLimit: '', currentBalance: '', status: 'ACTIVE' });
                        setShowModal(true);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
                >
                    <Plus size={20} />
                    إنشاء صندوق عهدة
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                        <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', borderRadius: '12px' }}><Wallet size={24} /></div>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-muted)' }}>إجمالي الصناديق</span>
                    </div>
                    <span style={{ fontSize: '28px', fontWeight: '900' }}>{funds.length}</span>
                </div>
                
                <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                        <div style={{ padding: '10px', background: 'rgba(34, 197, 94, 0.1)', color: '#22C55E', borderRadius: '12px' }}><Banknote size={24} /></div>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-muted)' }}>السيولة المتاحة (SAR)</span>
                    </div>
                    <span style={{ fontSize: '28px', fontWeight: '900', color: 'var(--success)' }}>
                        {funds.reduce((acc, f) => acc + (f.currentBalance || 0), 0).toLocaleString()}
                    </span>
                </div>

                <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                        <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderRadius: '12px' }}><ShieldAlert size={24} /></div>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-muted)' }}>إجمالي الحدود القصوى</span>
                    </div>
                    <span style={{ fontSize: '28px', fontWeight: '900', color: 'var(--danger)' }}>
                        {funds.reduce((acc, f) => acc + (f.maxLimit || 0), 0).toLocaleString()}
                    </span>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>جاري التحميل...</div>
                ) : funds.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>لا توجد عهد نثرية مسجلة. انقر على "إنشاء صندوق عهدة" للبدء.</div>
                ) : (
                    <table className="table" style={{ width: '100%' }}>
                        <thead style={{ background: 'var(--bg-card-hover)', borderBottom: '2px solid var(--border)' }}>
                            <tr>
                                <th>اسم العهدة / الصندوق</th>
                                <th>أمين الصندوق (الموظف)</th>
                                <th>الحد الأقصى للمبلغ</th>
                                <th>الرصيد الحالي</th>
                                <th>تاريخ الإنشاء</th>
                                <th>الحالة</th>
                                <th>إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {funds.map(fund => (
                                <tr key={fund.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                    <td style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{fund.fundName}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-card-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                                                👤
                                            </div>
                                            {fund.custodian?.name || 'غير محدد'}
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 'bold', color: 'var(--danger)' }}>{fund.maxLimit?.toLocaleString()} SAR</td>
                                    <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>{fund.currentBalance?.toLocaleString()} SAR</td>
                                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{new Date(fund.createdAt).toLocaleDateString('ar-SA')}</td>
                                    <td>
                                        <span style={{ 
                                            padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
                                            background: fund.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: fund.status === 'ACTIVE' ? '#16a34a' : '#ef4444'
                                        }}>
                                            {fund.status === 'ACTIVE' ? '🟢 نشط' : '🔴 مجمد'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button 
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => { 
                                                    setFormData({
                                                        ...fund, 
                                                        custodianId: fund.custodianId || (employees[0]?.id || '')
                                                    }); 
                                                    setShowModal(true); 
                                                }}
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button 
                                                className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}
                                                onClick={() => handleDelete(fund.id)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px', animation: 'slideUp 0.3s ease' }}>
                        <div className="modal-header">
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                {formData.id ? 'تعديل بيانات العهدة' : 'إنشاء صندوق عهدة جديد'}
                            </h2>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSave}>
                                <div className="grid-2">
                                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="input-label">اسم العهدة / الصندوق *</label>
                                        <input 
                                            className="input" required placeholder="مثال: عهدة المشتريات النثرية لفرع الرياض"
                                            value={formData.fundName} onChange={e => setFormData({...formData, fundName: e.target.value})}
                                        />
                                    </div>
                                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="input-label">أمين الصندوق (الموظف المسئول) *</label>
                                        <select 
                                            className="input" required
                                            value={formData.custodianId} onChange={e => setFormData({...formData, custodianId: e.target.value})}
                                        >
                                            <option value="">-- اختر الموظف --</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                                            ))}
                                            {employees.length === 0 && <option value="" disabled>لا يوجد موظفين مسجلين بالسجل</option>}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">الحد الأقصى للعهدة (SAR) *</label>
                                        <input 
                                            className="input" type="number" step="0.01" required dir="ltr"
                                            value={formData.maxLimit} onChange={e => setFormData({...formData, maxLimit: e.target.value})}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">الرصيد الافتتاحي / الحالي (SAR)</label>
                                        <input 
                                            className="input" type="number" step="0.01" dir="ltr"
                                            value={formData.currentBalance} onChange={e => setFormData({...formData, currentBalance: e.target.value})}
                                        />
                                    </div>
                                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="input-label">حالة الصندوق</label>
                                        <select className="input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                            <option value="ACTIVE">🟢 نشط (يسمح بالصرف والاستعاضة)</option>
                                            <option value="FROZEN">🔴 مجمد (موقوف مؤقتاً)</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                                    <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        {saving ? '⏳ جاري الحفظ...' : '💾 حفظ واعتماد العهدة'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
