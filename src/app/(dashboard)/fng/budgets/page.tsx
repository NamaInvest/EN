'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, PieChart, Calendar, CheckCircle } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

export default function FinancialBudgetsPage() {
    const { t } = useTranslation();
    const { error: toastError, success: toastSuccess } = useToast();
    const [budgets, setBudgets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        id: '', name: '', fiscalYear: new Date().getFullYear(),
        startDate: '', endDate: '', totalAmount: '', status: 'ACTIVE'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/fng/budgets', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBudgets(data);
            }
        } catch (error: any) { toastError(error?.message || 'حدث خطأ'); } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const token = localStorage.getItem('token');
        const isUpdate = !!formData.id;

        try {
            const res = await fetch('/api/fng/budgets', {
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
                alert(t('sys.str_2084'));
            }
        } catch (error) {
            alert(t('sys.str_2085'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t('sys.str_2086'))) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/fng/budgets?id=${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) fetchData();
        } catch (error) {
            alert(t('sys.str_446'));
        }
    };

    return (
        <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <PieChart size={28} color="var(--primary)" />
                        {t('sys.str_2067')}</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
                        {t('sys.str_2068')}</p>
                </div>
                <button 
                    className="btn btn-primary"
                    onClick={() => {
                        setFormData({ id: '', name: '', fiscalYear: new Date().getFullYear(), startDate: '', endDate: '', totalAmount: '', status: 'ACTIVE' });
                        setShowModal(true);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
                >
                    <Plus size={20} />
                    {t('sys.str_2069')}</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                        <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', borderRadius: '12px' }}><PieChart size={24} /></div>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-muted)' }}>{t('sys.str_2070')}</span>
                    </div>
                    <span style={{ fontSize: '28px', fontWeight: '900' }}>{budgets.length}</span>
                </div>
                
                <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                        <div style={{ padding: '10px', background: 'rgba(34, 197, 94, 0.1)', color: '#22C55E', borderRadius: '12px' }}><CheckCircle size={24} /></div>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-muted)' }}>{t('sys.str_2071')}</span>
                    </div>
                    <span style={{ fontSize: '28px', fontWeight: '900' }}>{budgets.filter(b => b.status === 'ACTIVE').length}</span>
                </div>

                <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                        <div style={{ padding: '10px', background: 'rgba(234, 179, 8, 0.1)', color: '#EAB308', borderRadius: '12px' }}><Calendar size={24} /></div>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-muted)' }}>{t('sys.str_2072')}</span>
                    </div>
                    <span style={{ fontSize: '28px', fontWeight: '900' }}>
                        {budgets.reduce((acc, b) => acc + (b.totalAmount || 0), 0).toLocaleString()}
                    </span>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{t('sys.str_168')}</div>
                ) : budgets.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{t('sys.str_2073')}</div>
                ) : (
                    <table className="table" style={{ width: '100%' }}>
                        <thead style={{ background: 'var(--bg-card-hover)', borderBottom: '2px solid var(--border)' }}>
                            <tr>
                                <th>{t('sys.str_2074')}</th>
                                <th>{t('sys.str_2075')}</th>
                                <th>{t('sys.str_1860')}</th>
                                <th>{t('sys.str_432')}</th>
                                <th>{t('sys.str_2076')}</th>
                                <th>{t('fin.str_227')}</th>
                                <th>{t('sys.str_435')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {budgets.map(budget => (
                                <tr key={budget.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                    <td style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{budget.name}</td>
                                    <td>{budget.fiscalYear}</td>
                                    <td>{new Date(budget.startDate).toLocaleDateString('en-GB')}</td>
                                    <td>{new Date(budget.endDate).toLocaleDateString('en-GB')}</td>
                                    <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{budget.totalAmount.toLocaleString()}</td>
                                    <td>
                                        <span style={{ 
                                            padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
                                            background: budget.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                                            color: budget.status === 'ACTIVE' ? '#16a34a' : 'var(--text-muted)'
                                        }}>
                                            {budget.status === 'ACTIVE' ? t('sys.str_2087') : t('sys.str_2088')}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button 
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => { 
                                                    setFormData({
                                                        ...budget, 
                                                        startDate: budget.startDate?.split('T')[0] || '', 
                                                        endDate: budget.endDate?.split('T')[0] || ''
                                                    }); 
                                                    setShowModal(true); 
                                                }}
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button 
                                                className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}
                                                onClick={() => handleDelete(budget.id)}
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
                                {formData.id ? t('sys.str_2089') : t('sys.str_2090')}
                            </h2>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSave}>
                                <div className="grid-2">
                                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="input-label">{t('sys.str_2077')}</label>
                                        <input 
                                            className="input" required placeholder={t('sys.str_2091')}
                                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">{t('sys.str_2078')}</label>
                                        <input 
                                            className="input" type="number" required
                                            value={formData.fiscalYear} onChange={e => setFormData({...formData, fiscalYear: parseInt(e.target.value)})}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">{t('sys.str_2079')}</label>
                                        <input 
                                            className="input" type="number" step="0.01" required dir="ltr"
                                            value={formData.totalAmount} onChange={e => setFormData({...formData, totalAmount: e.target.value})}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">{t('sys.str_2080')}</label>
                                        <input 
                                            className="input" type="date" required
                                            value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">{t('sys.str_2081')}</label>
                                        <input 
                                            className="input" type="date" required
                                            value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})}
                                        />
                                    </div>
                                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="input-label">{t('fin.str_227')}</label>
                                        <select className="input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                            <option value="ACTIVE">{t('sys.str_2082')}</option>
                                            <option value="DRAFT">{t('sys.str_2083')}</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                                    <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('fin.str_206')}</button>
                                    <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  type="submit" className="btn btn-primary" disabled={saving}>
                                        {saving ? t('sys.str_852') : t('sys.str_2092')}
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
