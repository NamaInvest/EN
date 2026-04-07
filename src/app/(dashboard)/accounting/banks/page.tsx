'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from "@/lib/i18n";

interface BankAccount {
    id: number;
    bankName: string;
    accountName: string;
    accountNumber: string;
    iban: string | null;
    currency: string;
    currentBalance: number;
    isActive: boolean;
    branchId: number | null;
    branch?: { id: number; name: string } | null;
}

export default function BanksPage() {
    const { t } = useTranslation();
    const [banks, setBanks] = useState<BankAccount[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<BankAccount | null>(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        bankName: '',
        accountName: '',
        accountNumber: '',
        iban: '',
        currency: 'SAR',
        currentBalance: '',
        branchId: '',
        isActive: true
    });

    async function fetchData() {
        try {
            const token = localStorage.getItem('token');
            const [banksRes, branchesRes] = await Promise.all([
                fetch('/api/banks', { headers: { Authorization: `Bearer ${token}` } }),
                branches.length === 0 ? fetch('/api/branches', { headers: { Authorization: `Bearer ${token}` } }) : Promise.resolve(null)
            ]);

            if (banksRes.ok) setBanks(await banksRes.json());
            if (branchesRes && branchesRes.ok) setBranches(await branchesRes.json());
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openAdd = () => {
        setEditItem(null);
        setForm({
            bankName: '',
            accountName: '',
            accountNumber: '',
            iban: '',
            currency: 'SAR',
            currentBalance: '',
            branchId: '',
            isActive: true
        });
        setShowModal(true);
    };

    const openEdit = (bank: BankAccount) => {
        setEditItem(bank);
        setForm({
            bankName: bank.bankName,
            accountName: bank.accountName,
            accountNumber: bank.accountNumber,
            iban: bank.iban || '',
            currency: bank.currency,
            currentBalance: bank.currentBalance.toString(),
            branchId: bank.branchId ? bank.branchId.toString() : '',
            isActive: bank.isActive
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.bankName || !form.accountName || !form.accountNumber) {
            alert(t('fin.str_1681'));
            return;
        }

        setSaving(true);
        const token = localStorage.getItem('token');
        const url = editItem ? `/api/banks/${editItem.id}` : '/api/banks';
        const method = editItem ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(form)
            });

            if (res.ok) {
                setShowModal(false);
                fetchData();
            } else {
                const data = await res.json();
                alert(data.error || t('sys.str_698'));
            }
        } catch (error) {
            console.error(error);
            alert(t('sys.str_446'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t('fin.str_1682'))) return;
        
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/banks/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                fetchData();
            } else {
                const data = await res.json();
                alert(data.error || t('fin.str_1683'));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fmt = (num: number) => num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>{t('fin.str_1668')}</h1>
                <button className="btn btn-primary" onClick={openAdd}>{t('fin.str_1669')}</button>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>{t('hr.str_565')}</th>
                                <th>{t('fin.str_264')}</th>
                                <th>{t('fin.str_1670')}</th>
                                <th>{t('hr.str_556')}</th>
                                <th>{t('sys.str_674')}</th>
                                <th>{t('fin.str_227')}</th>
                                <th>{t('sys.str_435')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>{t('sys.str_168')}</td></tr>
                            ) : banks.length === 0 ? (
                                <tr>
                                    <td colSpan={7}>
                                        <div className="empty-state">
                                            <div className="empty-state-icon">🏦</div>
                                            <div className="empty-state-text">{t('fin.str_1671')}</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : banks.map(b => (
                                <tr key={b.id} style={{ opacity: b.isActive ? 1 : 0.6 }}>
                                    <td style={{ fontWeight: '600' }}>{b.bankName}</td>
                                    <td>{b.accountName}</td>
                                    <td dir="ltr" style={{ color: 'var(--text-secondary)' }}>{b.accountNumber}</td>
                                    <td><span className="badge badge-outline">{b.branch?.name || t('sys.str_733')}</span></td>
                                    <td style={{ fontWeight: '700', color: b.currentBalance < 0 ? '#ef4444' : '#10b981' }}>
                                        {fmt(b.currentBalance)} {b.currency}
                                    </td>
                                    <td>
                                        <span className={`badge ${b.isActive ? 'badge-success' : 'badge-ghost'}`}>
                                            {b.isActive ? t('sys.str_180') : t('fin.str_1684')}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <Link href={`/accounting/banks/${b.id}`} className="btn btn-sm" style={{ background: 'var(--primary-color)', color: '#fff', border: 'none' }}>
                                                {t('fin.str_1672')}</Link>
                                            <button className="btn btn-sm btn-ghost" onClick={() => openEdit(b)}>{t('sys.str_547')}</button>
                                            <button className="btn btn-sm" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: 'none' }} onClick={() => handleDelete(b.id)}>🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h3>{editItem ? t('fin.str_1685') : t('fin.str_1686')}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="grid-2">
                                <div className="input-group">
                                    <label className="input-label">{t('fin.str_1673')}</label>
                                    <input className="input" placeholder={t('fin.str_1687')} value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t('fin.str_1674')}</label>
                                    <input className="input" placeholder={t('fin.str_1688')} value={form.accountName} onChange={e => setForm({ ...form, accountName: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t('fin.str_1675')}</label>
                                    <input className="input" dir="ltr" value={form.accountNumber} onChange={e => setForm({ ...form, accountNumber: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t('hr.str_566')}</label>
                                    <input className="input" dir="ltr" value={form.iban} onChange={e => setForm({ ...form, iban: e.target.value })} />
                                </div>
                                
                                {!editItem && (
                                    <div className="input-group">
                                        <label className="input-label">{t('fin.str_1676')}</label>
                                        <input className="input" type="number" dir="ltr" value={form.currentBalance} onChange={e => setForm({ ...form, currentBalance: e.target.value })} />
                                    </div>
                                )}
                                
                                <div className="input-group">
                                    <label className="input-label">{t('purchases.str_1013')}</label>
                                    <select className="input" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>
                                        <option value="SAR">{t('purchases.str_1011')}</option>
                                        <option value="USD">{t('purchases.str_1012')}</option>
                                        <option value="EUR">{t('fin.str_1677')}</option>
                                    </select>
                                </div>
                                
                                <div className="input-group">
                                    <label className="input-label">{t('fin.str_1678')}</label>
                                    <select className="input" value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })}>
                                        <option value="">{t('fin.str_1679')}</option>
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {editItem && (
                                    <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '30px' }}>
                                        <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                                        <label htmlFor="isActive" style={{ fontWeight: '500', cursor: 'pointer' }}>{t('fin.str_1680')}</label>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer" style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? t('sys.str_454') : t('sys.str_455')}
                            </button>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('fin.str_206')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
