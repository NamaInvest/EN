'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Wallet, Banknote, ShieldAlert } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";

export default function PettyCashFundsPage() {
    const { t } = useTranslation();
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
                alert(t('sys.str_2113'));
            }
        } catch (error) {
            alert(t('sys.str_2085'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t('sys.str_2114'))) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/fng/petty-cash-funds?id=${id}`, {
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
                        <Wallet size={28} color="var(--primary)" />
                        {t('sys.str_2093')}</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
                        {t('sys.str_2094')}</p>
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
                    {t('sys.str_2095')}</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                        <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', borderRadius: '12px' }}><Wallet size={24} /></div>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-muted)' }}>{t('sys.str_2096')}</span>
                    </div>
                    <span style={{ fontSize: '28px', fontWeight: '900' }}>{funds.length}</span>
                </div>
                
                <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                        <div style={{ padding: '10px', background: 'rgba(34, 197, 94, 0.1)', color: '#22C55E', borderRadius: '12px' }}><Banknote size={24} /></div>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-muted)' }}>{t('sys.str_2097')}</span>
                    </div>
                    <span style={{ fontSize: '28px', fontWeight: '900', color: 'var(--success)' }}>
                        {funds.reduce((acc, f) => acc + (f.currentBalance || 0), 0).toLocaleString()}
                    </span>
                </div>

                <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                        <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderRadius: '12px' }}><ShieldAlert size={24} /></div>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-muted)' }}>{t('sys.str_2098')}</span>
                    </div>
                    <span style={{ fontSize: '28px', fontWeight: '900', color: 'var(--danger)' }}>
                        {funds.reduce((acc, f) => acc + (f.maxLimit || 0), 0).toLocaleString()}
                    </span>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{t('sys.str_168')}</div>
                ) : funds.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{t('sys.str_2099')}</div>
                ) : (
                    <table className="table" style={{ width: '100%' }}>
                        <thead style={{ background: 'var(--bg-card-hover)', borderBottom: '2px solid var(--border)' }}>
                            <tr>
                                <th>{t('sys.str_2100')}</th>
                                <th>{t('sys.str_2101')}</th>
                                <th>{t('sys.str_2102')}</th>
                                <th>{t('sys.str_674')}</th>
                                <th>{t('sys.str_2103')}</th>
                                <th>{t('fin.str_227')}</th>
                                <th>{t('sys.str_435')}</th>
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
                                            {fund.custodian?.name || t('sys.str_179')}
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
                                            {fund.status === 'ACTIVE' ? t('sys.str_2115') : t('sys.str_2116')}
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
                                {formData.id ? t('sys.str_2117') : t('sys.str_2118')}
                            </h2>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSave}>
                                <div className="grid-2">
                                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="input-label">{t('sys.str_2104')}</label>
                                        <input 
                                            className="input" required placeholder={t('sys.str_2119')}
                                            value={formData.fundName} onChange={e => setFormData({...formData, fundName: e.target.value})}
                                        />
                                    </div>
                                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="input-label">{t('sys.str_2105')}</label>
                                        <select 
                                            className="input" required
                                            value={formData.custodianId} onChange={e => setFormData({...formData, custodianId: e.target.value})}
                                        >
                                            <option value="">{t('sys.str_2106')}</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                                            ))}
                                            {employees.length === 0 && <option value="" disabled>{t('sys.str_2107')}</option>}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">{t('sys.str_2108')}</label>
                                        <input 
                                            className="input" type="number" step="0.01" required dir="ltr"
                                            value={formData.maxLimit} onChange={e => setFormData({...formData, maxLimit: e.target.value})}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">{t('sys.str_2109')}</label>
                                        <input 
                                            className="input" type="number" step="0.01" dir="ltr"
                                            value={formData.currentBalance} onChange={e => setFormData({...formData, currentBalance: e.target.value})}
                                        />
                                    </div>
                                    <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="input-label">{t('sys.str_2110')}</label>
                                        <select className="input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                            <option value="ACTIVE">{t('sys.str_2111')}</option>
                                            <option value="FROZEN">{t('sys.str_2112')}</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                                    <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('fin.str_206')}</button>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        {saving ? t('sys.str_852') : t('sys.str_2120')}
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
