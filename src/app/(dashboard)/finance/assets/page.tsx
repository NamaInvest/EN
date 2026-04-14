'use client';
import { useState, useEffect } from 'react';
import { Building2, Plus, ArrowDownRight, Printer } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

export default function FixedAssetsPage() {
    const { t } = useTranslation();
    const { error: toastError, success: toastSuccess } = useToast();
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    
    // Calculate current dynamic depreciation on the fly for display
    const calculateBookValue = (asset: any) => {
        const purchaseDate = new Date(asset.purchaseDate);
        const now = new Date();
        const msPassed = now.getTime() - purchaseDate.getTime();
        const yearsPassed = msPassed / (1000 * 60 * 60 * 24 * 365.25);
        
        let depreciatedLife = yearsPassed;
        if (depreciatedLife > asset.usefulLifeYears) depreciatedLife = asset.usefulLifeYears;
        
        const depreciableAmount = asset.purchaseCost - asset.salvageValue;
        const depreciationPerYear = depreciableAmount / asset.usefulLifeYears;
        
        const totalDepreciation = depreciationPerYear * depreciatedLife;
        return (asset.purchaseCost - totalDepreciation).toFixed(2);
    };

    const [form, setForm] = useState({ 
        assetName: '', assetType: '', purchaseDate: '', purchaseCost: '', salvageValue: '0', usefulLifeYears: '5', location: '' 
    });

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/finance/assets', { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setAssets(await res.json());
        } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
        setLoading(false);
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/finance/assets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                setShowModal(false);
                setForm({ assetName: '', assetType: '', purchaseDate: '', purchaseCost: '', salvageValue: '0', usefulLifeYears: '5', location: '' });
                loadData();
            } else {
                alert(t('fin.str_2020'));
            }
        } catch (e) {}
    };

    return (<>
        <div className="page-header"><h1 className="page-title">{t('fin.str_1993')}</h1></div>
        
        <div className="page-content animate-fade-in">
            <div className="toolbar">
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('fin.str_1994')}</span>
                <div className="toolbar-spacer" />
                <button className="btn btn-outline" style={{ fontSize: '12px' }}><Printer size={16} style={{display:'inline', marginRight:'4px'}}/> {t('fin.str_1995')}</button>
                <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ backgroundColor: '#2563eb', color: 'white' }}>
                    <Plus size={16} style={{marginRight:'5px'}} /> {t('sys.str_334')}</button>
            </div>

            <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>{t('fin.str_1996')}</th>
                            <th>{t('fin.str_1997')}</th>
                            <th>{t('fin.str_1998')}</th>
                            <th>{t('sys.str_340')}</th>
                            <th>{t('fin.str_1999')}</th>
                            <th>{t('sys.str_603')}</th>
                            <th>{t('sys.str_344')}</th>
                            <th>{t('fin.str_2000')}</th>
                            <th>{t('fin.str_227')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>{t('sys.str_168')}</td></tr> : assets.length === 0 ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>{t('fin.str_2001')}</td></tr> : assets.map(a => {
                            const currentVal = calculateBookValue(a);
                            return (
                            <tr key={a.id}>
                                <td><strong style={{color: '#6366f1'}}>AST-{a.id}</strong></td>
                                <td><Building2 size={14} style={{display:'inline', marginRight:'5px', color:'#9ca3af'}}/> {a.assetName}</td>
                                <td><span style={{backgroundColor: '#f3f4f6', padding: '3px 8px', borderRadius: '4px', fontSize: '12px'}}>{a.assetType}</span></td>
                                <td><span dir="ltr">{new Date(a.purchaseDate).toLocaleDateString()}</span></td>
                                <td>{a.location || '-'}</td>
                                <td><strong>{parseFloat(a.purchaseCost).toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></td>
                                <td>
                                    <strong style={{color: parseFloat(currentVal) < (a.purchaseCost/2) ? '#ef4444' : '#10b981'}}>
                                        {parseFloat(currentVal).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                    </strong>
                                </td>
                                <td><span style={{color: '#6b7280', fontSize: '12px'}}>{Math.round(100 / a.usefulLifeYears)}{t('fin.str_2002')}</span></td>
                                <td>
                                    {a.status === 'active' ? 
                                        <span style={{color: '#10b981', fontSize: '12px'}}>{t('sys.str_180')}</span> : 
                                        <span style={{color: '#ef4444', fontSize: '12px'}}>{t('fin.str_2003')}</span>
                                    }
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
        </div>

        {showModal && (
            <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
                <div className="modal animate-scale-in" style={{ maxWidth: '600px', width: '95%', backgroundColor: 'var(--card-bg, white)', borderRadius: '12px', padding: '24px', position: 'relative' }}>
                    <h2>{t('fin.str_2004')}</h2>
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                        
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div className="input-group" style={{ margin: 0, flex: 2 }}>
                                <label className="input-label">{t('fin.str_2005')}</label>
                                <input required type="text" className="input" value={form.assetName} onChange={e => setForm({...form, assetName: e.target.value})} placeholder={t('fin.str_2021')} />
                            </div>
                            <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                <label className="input-label">{t('fin.str_2006')}</label>
                                <select required className="input" value={form.assetType} onChange={e => setForm({...form, assetType: e.target.value})}>
                                    <option value="">{t('fin.str_2007')}</option>
                                    <option value={t('fin.str_2008')}>{t('fin.str_2008')}</option>
                                    <option value={t('fin.str_2022')}>{t('fin.str_2009')}</option>
                                    <option value={t('fin.str_2010')}>{t('fin.str_2010')}</option>
                                    <option value={t('fin.str_2023')}>{t('fin.str_2011')}</option>
                                    <option value={t('fin.str_2012')}>{t('fin.str_2012')}</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                <label className="input-label">{t('fin.str_2013')}</label>
                                <input required type="date" className="input" value={form.purchaseDate} onChange={e => setForm({...form, purchaseDate: e.target.value})} />
                            </div>
                            <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                <label className="input-label">{t('fin.str_2014')}</label>
                                <input type="text" className="input" value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder={t('fin.str_2024')} />
                            </div>
                        </div>

                        <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                            <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                <label className="input-label">{t('fin.str_2015')}</label>
                                <input required type="number" step="any" min="0" className="input" value={form.purchaseCost} onChange={e => setForm({...form, purchaseCost: e.target.value})} style={{fontWeight:'bold'}} />
                            </div>
                            <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                <label className="input-label">{t('fin.str_2016')}</label>
                                <input required type="number" step="any" min="0" className="input" value={form.salvageValue} onChange={e => setForm({...form, salvageValue: e.target.value})} />
                            </div>
                            <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                <label className="input-label">{t('sys.str_613')}</label>
                                <input required type="number" min="1" className="input" value={form.usefulLifeYears} onChange={e => setForm({...form, usefulLifeYears: e.target.value})} />
                            </div>
                        </div>

                        {parseFloat(form.purchaseCost) > 0 && (
                            <div style={{ padding: '10px 15px', borderRadius: '6px', backgroundColor: '#eff6ff', color: '#1e40af', fontSize: '12px' }}>
                                {t('fin.str_2017')}<strong>{((parseFloat(form.purchaseCost) - parseFloat(form.salvageValue||'0')) / parseFloat(form.usefulLifeYears||'1')).toLocaleString(undefined, {minimumFractionDigits: 2})}</strong> {t('fin.str_2018')}</div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">{t('fin.str_206')}</button>
                            <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#2563eb', color: 'white' }}>{t('fin.str_2019')}</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </>);
}