'use client';
import { useState, useEffect } from 'react';
import { Building2, Plus, ArrowDownRight, Printer } from 'lucide-react';

export default function FixedAssetsPage() {
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
        } catch (e) {
            console.error(e);
        }
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
                alert('فشل حفظ الأصل');
            }
        } catch (e) {}
    };

    return (<>
        <div className="page-header"><h1 className="page-title">🏢 الأصول الثابتة والإهلاكات (Fixed Assets)</h1></div>
        
        <div className="page-content animate-fade-in">
            <div className="toolbar">
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>إدارة ممتلكات المنشأة واحتساب نسب الاستهلاك الدفتري بشكل آلي وتلقائي (Straight-Line Depreciation)</span>
                <div className="toolbar-spacer" />
                <button className="btn btn-outline" style={{ fontSize: '12px' }}><Printer size={16} style={{display:'inline', marginRight:'4px'}}/> سجل الأصول</button>
                <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ backgroundColor: '#2563eb', color: 'white' }}>
                    <Plus size={16} style={{marginRight:'5px'}} /> إضافة أصل جديد
                </button>
            </div>

            <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>رقم الأصل</th>
                            <th>الاسم / البيان</th>
                            <th>الفئة تصنيف</th>
                            <th>تاريخ الشراء</th>
                            <th>الموقع / الفرع</th>
                            <th>تكلفة الشراء</th>
                            <th>القيمة الدفترية الحالية</th>
                            <th>معدل الإهلاك</th>
                            <th>الحالة</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>جاري التحميل...</td></tr> : assets.length === 0 ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>سجل الأصول فارغ</td></tr> : assets.map(a => {
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
                                <td><span style={{color: '#6b7280', fontSize: '12px'}}>{Math.round(100 / a.usefulLifeYears)}% سنوياً</span></td>
                                <td>
                                    {a.status === 'active' ? 
                                        <span style={{color: '#10b981', fontSize: '12px'}}>نشط</span> : 
                                        <span style={{color: '#ef4444', fontSize: '12px'}}>مُكهن/مُباع</span>
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
                    <h2>تسجيل أصل ثابت جديد (New Fixed Asset)</h2>
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                        
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div className="input-group" style={{ margin: 0, flex: 2 }}>
                                <label className="input-label">اسم الأصل (البيان)</label>
                                <input required type="text" className="input" value={form.assetName} onChange={e => setForm({...form, assetName: e.target.value})} placeholder="مثال: سيارة تويوتا 2024 لوحة 123" />
                            </div>
                            <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                <label className="input-label">نوع الأصل (الفئة)</label>
                                <select required className="input" value={form.assetType} onChange={e => setForm({...form, assetType: e.target.value})}>
                                    <option value="">اختيار...</option>
                                    <option value="سيارات ومعدات">سيارات ومعدات</option>
                                    <option value="الآلات والمصانع">الآلات والمعدات</option>
                                    <option value="أثاث وتركيبات">أثاث وتركيبات</option>
                                    <option value="أجهزة كمبيوتر وبرامج">أجهزة وبرامج</option>
                                    <option value="عقارات ومباني">عقارات ومباني</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                <label className="input-label">تاريخ الشراء / الإضافة</label>
                                <input required type="date" className="input" value={form.purchaseDate} onChange={e => setForm({...form, purchaseDate: e.target.value})} />
                            </div>
                            <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                <label className="input-label">الموقع الخاص بالأصل</label>
                                <input type="text" className="input" value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="مثال: المستودع الشمالي" />
                            </div>
                        </div>

                        <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                            <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                <label className="input-label">قيمة الشراء الأصلية</label>
                                <input required type="number" step="any" min="0" className="input" value={form.purchaseCost} onChange={e => setForm({...form, purchaseCost: e.target.value})} style={{fontWeight:'bold'}} />
                            </div>
                            <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                <label className="input-label">القيمة التخريدية (الخردة)</label>
                                <input required type="number" step="any" min="0" className="input" value={form.salvageValue} onChange={e => setForm({...form, salvageValue: e.target.value})} />
                            </div>
                            <div className="input-group" style={{ margin: 0, flex: 1 }}>
                                <label className="input-label">العمر الافتراضي (سنوات)</label>
                                <input required type="number" min="1" className="input" value={form.usefulLifeYears} onChange={e => setForm({...form, usefulLifeYears: e.target.value})} />
                            </div>
                        </div>

                        {parseFloat(form.purchaseCost) > 0 && (
                            <div style={{ padding: '10px 15px', borderRadius: '6px', backgroundColor: '#eff6ff', color: '#1e40af', fontSize: '12px' }}>
                                ℹ️ سيتم إهلاك <strong>{((parseFloat(form.purchaseCost) - parseFloat(form.salvageValue||'0')) / parseFloat(form.usefulLifeYears||'1')).toLocaleString(undefined, {minimumFractionDigits: 2})}</strong> بشكل سنوي بطريقة القسط الثابت (Straight-Line).
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">إلغاء</button>
                            <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#2563eb', color: 'white' }}>حفظ وإثبات الأصل</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </>);
}