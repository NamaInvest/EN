'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from "@/lib/i18n";

export default function LandedCostsPage() {
    const { t } = useTranslation();
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;
    
    const [order, setOrder] = useState<any>(null);
    const [costs, setCosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [accounts, setAccounts] = useState<any[]>([]);
    const [currencies, setCurrencies] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        description: '', amount: '', currencyId: '',
        exchangeRate: '1', allocationMethod: 'value',
        expenseAccountId: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || '';
            const opts = { headers: { Authorization: `Bearer ${token}` } };
            
            const [orderRes, costsRes, actsRes, currRes] = await Promise.all([
                fetch(`/api/purchase-orders/${orderId}`, opts),
                fetch(`/api/purchase-orders/${orderId}/landed-costs`, opts),
                fetch(`/api/accounts`, opts),
                fetch(`/api/settings/currencies`, opts)
            ]);
            
            if (orderRes.ok) setOrder(await orderRes.json());
            if (costsRes.ok) setCosts(await costsRes.json());
            if (actsRes.ok) setAccounts(await actsRes.json());
            if (currRes.ok) setCurrencies(await currRes.json());
            
        } catch(e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => {
        if (orderId) fetchData();
    }, [orderId]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch(`/api/purchase-orders/${orderId}/landed-costs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setFormData({
                    description: '', amount: '', currencyId: '',
                    exchangeRate: '1', allocationMethod: 'value',
                    expenseAccountId: ''
                });
                fetchData();
            } else {
                alert(t('sys.str_961'));
            }
        } catch(e) { console.error(e); }
    };

    const deleteCost = async (id: number) => {
        if (!confirm(t('sys.str_2897'))) return;
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch(`/api/purchase-orders/${orderId}/landed-costs/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) fetchData();
        } catch(e) { console.error(e); }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>{t('sys.str_168')}</div>;
    if (!order) return <div style={{ padding: '40px', textAlign: 'center' }}>{t('sys.str_2871')}</div>;

    // Calculate distributed costs
    const totalLandedCostInBaseCurrency = costs.reduce((sum, c) => sum + (c.amount * c.exchangeRate), 0);
    const orderSubtotal = order.subtotal || 1; // Prevent div zero

    return (
        <>
            <div className="page-header" style={{ marginBottom: '20px' }}>
                <div>
                    <button onClick={() => router.back()} className="btn btn-ghost" style={{ marginBottom: '10px' }}>{t('sys.str_2872')}</button>
                    <h1 className="page-title">{t('sys.str_2873')}</h1>
                    <p className="page-description">{t('sys.str_2874')}{order.orderNo} {t('sys.str_2875')}{order.supplier?.name}</p>
                </div>
            </div>

            <div className="page-content animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 5fr)', gap: '20px' }}>
                
                {/* Costs Distribution List */}
                <div className="card" style={{ padding: '20px' }}>
                    <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px' }}>
                        {t('sys.str_2876')}</h3>
                    
                    {costs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', background: 'var(--bg-lighter)', borderRadius: '8px' }}>
                            {t('sys.str_2877')}</div>
                    ) : (
                        <table className="table" style={{ marginBottom: '20px' }}>
                            <thead>
                                <tr>
                                    <th>{t('fin.str_212')}</th>
                                    <th>{t('sys.str_463')}</th>
                                    <th>{t('purchases.str_1013')}</th>
                                    <th>{t('sys.str_2878')}</th>
                                    <th>{t('sys.str_2879')}</th>
                                    <th>{t('sys.str_2880')}</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {costs.map(c => (
                                    <tr key={c.id}>
                                        <td>{c.description}</td>
                                        <td>{c.amount.toLocaleString()}</td>
                                        <td>{c.currency?.code || t('sys.str_2520')}</td>
                                        <td>{c.exchangeRate}</td>
                                        <td style={{ fontWeight: 'bold' }}>{(c.amount * c.exchangeRate).toLocaleString()}</td>
                                        <td>{c.expenseAccount?.nameAr}</td>
                                        <td>
                                            <button onClick={() => deleteCost(c.id)} className="btn btn-ghost" style={{ color: 'var(--danger)', padding: '5px' }}>✕</button>
                                        </td>
                                    </tr>
                                ))}
                                <tr style={{ background: 'var(--bg-lighter)', fontWeight: 'bold' }}>
                                    <td colSpan={4} style={{ textAlign: 'left' }}>{t('sys.str_2881')}</td>
                                    <td colSpan={3} style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{totalLandedCostInBaseCurrency.toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                    )}

                    <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', margin: '30px 0 20px' }}>
                        {t('sys.str_2882')}</h3>
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>{t('sys.str_801')}</th>
                                    <th>{t('sys.str_64')}</th>
                                    <th>{t('sys.str_2883')}</th>
                                    <th>{t('sys.str_2884')}</th>
                                    <th>{t('sys.str_2885')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.details.map((item: any) => {
                                    // Allocate by Value: (Item Subtotal / Total Order Subtotal) * Total Landed Costs
                                    const itemSubtotal = item.quantity * item.price;
                                    const ratio = itemSubtotal / orderSubtotal;
                                    const totalItemLandedCost = ratio * totalLandedCostInBaseCurrency;
                                    const unitLandedCost = totalItemLandedCost / item.quantity;
                                    const finalUnitCost = item.price + unitLandedCost;

                                    return (
                                        <tr key={item.id}>
                                            <td>{item.productName}</td>
                                            <td>{item.quantity}</td>
                                            <td>{item.price.toLocaleString()}</td>
                                            <td style={{ color: 'var(--warning)', fontWeight: 'bold' }}>+ {unitLandedCost.toFixed(2)}</td>
                                            <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>{finalUnitCost.toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add Cost Form */}
                <div className="card" style={{ padding: '20px', height: 'fit-content' }}>
                    <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px' }}>
                        {t('sys.str_2886')}</h3>
                    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div className="input-group">
                            <label className="input-label">{t('sys.str_2887')}</label>
                            <input className="input" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="input-group">
                                <label className="input-label">{t('sys.str_463')}</label>
                                <input type="number" step="0.01" className="input" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">{t('purchases.str_1013')}</label>
                                <select className="input" value={formData.currencyId} onChange={e => setFormData({...formData, currencyId: e.target.value})}>
                                    <option value="">{t('sys.str_2888')}</option>
                                    {currencies.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
                                </select>
                            </div>
                        </div>
                        {formData.currencyId && (
                            <div className="input-group">
                                <label className="input-label">{t('sys.str_2889')}</label>
                                <input type="number" step="0.0001" className="input" required value={formData.exchangeRate} onChange={e => setFormData({...formData, exchangeRate: e.target.value})} />
                            </div>
                        )}
                        <div className="input-group">
                            <label className="input-label">{t('sys.str_2890')}</label>
                            <select className="input" required value={formData.expenseAccountId} onChange={e => setFormData({...formData, expenseAccountId: e.target.value})}>
                                <option value="">{t('sys.str_2891')}</option>
                                {accounts.map(a => <option key={a.id} value={a.id}>{a.accountNumber} - {a.nameAr}</option>)}
                            </select>
                            <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '5px' }}>{t('sys.str_2892')}</small>
                        </div>
                        <div className="input-group">
                            <label className="input-label">{t('sys.str_2893')}</label>
                            <select className="input" value={formData.allocationMethod} onChange={e => setFormData({...formData, allocationMethod: e.target.value})}>
                                <option value="value">{t('sys.str_2894')}</option>
                                <option value="quantity">{t('sys.str_2895')}</option>
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                            {t('sys.str_2896')}</button>
                    </form>
                </div>

            </div>
        </>
    );
}
