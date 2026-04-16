'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/lib/SettingsContext';

import { QZPrinterConfig } from '@/lib/qz';
import { useToast } from '@/components/Toast';

interface DiscountRule {
    minAmount: number;
    maxDiscount: number;
    maxDiscountPercent: number;
}

export default function SalesOptionsPage() {
    const { getSetting, refreshSettings, loading: settingsLoading } = useSettings();
    const [loading, setLoading] = useState(true);
    const { error: toastError, success: toastSuccess } = useToast();
    const [saving, setSaving] = useState(false);
    
    // States
    const [discountEnabled, setDiscountEnabled] = useState(true);
    const [couponsEnabled, setCouponsEnabled] = useState(true);
    const [taxEnabled, setTaxEnabled] = useState(true);
    const [taxInclusive, setTaxInclusive] = useState(true);
    const [taxRate, setTaxRate] = useState('15');
    const [allowNegativeStock, setAllowNegativeStock] = useState(false);
    const [allowAddProduct, setAllowAddProduct] = useState(true);
    const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
    const [masterPrinter, setMasterPrinter] = useState('');
    const [kitchenPrinters, setKitchenPrinters] = useState<any[]>([]);
    const [categories, setCategories] = useState<{id:number, name:string}[]>([]);
    
    // Toasts
    const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);

    useEffect(() => {
        fetchCats();
    }, []);

    const fetchCats = async () => {
        try {
            const token = localStorage.getItem('token');
            const catRes = await fetch('/api/categories', { headers: { 'Authorization': `Bearer ${token}` } });
            if (catRes.ok) setCategories(await catRes.json());
        } catch(e) { console.error('Failed to load categories', e) }
    };

    useEffect(() => {
        if (settingsLoading) return;
        
        // Parse states after settings are completely loaded from context
        const enabledRaw = getSetting('POS_DISCOUNT_ENABLED', 'true');
        setDiscountEnabled(enabledRaw === 'true');
        
        const taxRaw = getSetting('POS_TAX_ENABLED', 'true');
        setTaxEnabled(taxRaw === 'true');

        const rateRaw = getSetting('tax_rate', '15');
        setTaxRate(rateRaw);

        const taxIncRaw = getSetting('POS_TAX_INCLUSIVE', 'true');
        setTaxInclusive(taxIncRaw === 'true');
        
        const couponsRaw = getSetting('POS_COUPONS_ENABLED', 'true');
        setCouponsEnabled(couponsRaw === 'true');

        const negativeRaw = getSetting('POS_ALLOW_NEGATIVE_STOCK', 'false');
        setAllowNegativeStock(negativeRaw === 'true');
        
        const allowAddRaw = getSetting('POS_ALLOW_ADD_PRODUCT', 'true');
        setAllowAddProduct(allowAddRaw === 'true');
        
        const rulesRaw = getSetting('POS_DISCOUNT_RULES', '[]');
        try {
            const parsed = JSON.parse(rulesRaw);
            if(Array.isArray(parsed)) {
                setDiscountRules(parsed);
            }
        } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }

        setMasterPrinter(getSetting('POS_MASTER_PRINTER', ''));
        try {
            const kParsed = JSON.parse(getSetting('POS_KITCHEN_PRINTERS', '[]'));
            if(Array.isArray(kParsed)) setKitchenPrinters(kParsed);
        } catch(e) {}
        
        setLoading(false);
    }, [settingsLoading, getSetting]);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Sort rules by minAmount ascending
            const sortedRules = [...discountRules].sort((a,b) => a.minAmount - b.minAmount);
            
            const payload = {
                POS_DISCOUNT_ENABLED: discountEnabled ? 'true' : 'false',
                POS_COUPONS_ENABLED: couponsEnabled ? 'true' : 'false',
                POS_TAX_ENABLED: taxEnabled ? 'true' : 'false',
                POS_TAX_INCLUSIVE: taxInclusive ? 'true' : 'false',
                tax_rate: taxRate,
                POS_ALLOW_NEGATIVE_STOCK: allowNegativeStock ? 'true' : 'false',
                POS_ALLOW_ADD_PRODUCT: allowAddProduct ? 'true' : 'false',
                POS_DISCOUNT_RULES: JSON.stringify(sortedRules),
                POS_MASTER_PRINTER: masterPrinter,
                POS_KITCHEN_PRINTERS: JSON.stringify(kitchenPrinters)
            };

            const token = localStorage.getItem('token');
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('فشل الحفظ');
            
            await refreshSettings();
            
            setToast({ msg: '✅ تم حفظ الخيارات بنجاح', type: 'success' });
        } catch (error: any) {
            setToast({ msg: '❌ ' + error.message, type: 'error' });
        } finally {
            setSaving(false);
            setTimeout(() => setToast(null), 3000);
        }
    };

    const addRule = () => {
        setDiscountRules([...discountRules, { minAmount: 100, maxDiscount: 10, maxDiscountPercent: 5 }]);
    };

    const updateRule = (index: number, key: keyof DiscountRule, value: number) => {
        const newRules = [...discountRules];
        newRules[index][key] = value;
        setDiscountRules(newRules);
    };

    const removeRule = (index: number) => {
        const newRules = discountRules.filter((_, i) => i !== index);
        setDiscountRules(newRules);
    };

    if (loading) return <div className="page" style={{ padding: '20px', textAlign:'center' }}>جاري التحميل...</div>;

    return (
        <div className="page fade-in" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', direction: 'rtl' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>⚙️ خيارات المبيعات والخصومات</h1>
            </div>

            <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>

                {/* QZ Tray Printers */}
                <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>طابعات الكاشير والمطبخ (عبر شبكة QZ Tray)</h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                        يجب تثبيت برنامج QZ Tray على أجهزة الكمبيوتر لنجاح الاتصال.
                    </p>

                    <div style={{ marginBottom: '20px', background: 'var(--bg-body, #1a1b23)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <h4 style={{ margin: '0 0 10px 0' }}>الطابعة الرئيسية (للكاشير)</h4>
                        <input
                            type="text"
                            className="input"
                            placeholder="اسم الطابعة في الويندوز (مثل: EPSON TM-T20)"
                            value={masterPrinter}
                            onChange={e => setMasterPrinter(e.target.value)}
                            style={{ width: '100%', maxWidth: '400px' }}
                        />
                    </div>

                    <div style={{ background: 'var(--bg-body, #1a1b23)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h4 style={{ margin: 0 }}>طابعات الدعم الإضافية للمطبخ</h4>
                            <button
                                onClick={() => setKitchenPrinters([...kitchenPrinters, { name: '', connectionType: 'OS', connectionString: '', targetCategories: [] }])}
                                className="btn btn-secondary"
                                style={{ padding: '4px 12px', fontSize: '14px' }}
                            >
                                + إضافة طابعة مساعدة
                            </button>
                        </div>

                        {kitchenPrinters.length === 0 && (
                            <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0, textAlign: 'center' }}>لا توجد طابعات مساعدة مضافة.</p>
                        )}

                        {kitchenPrinters.map((printer, index) => (
                            <div key={index} style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'flex-end', background: 'var(--bg-card)', padding: '12px', border: '1px solid var(--border)', borderRadius: '6px' }}>
                                <div style={{ flex: '1 1 200px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>اسم الطابعة (للتوضيح)</label>
                                    <input type="text" className="input" style={{ width: '100%' }} value={printer.name} onChange={e => { const updated = [...kitchenPrinters]; updated[index].name = e.target.value; setKitchenPrinters(updated); }} />
                                </div>
                                <div style={{ flex: '0 1 100px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>نوع الاتصال</label>
                                    <select className="input" style={{ width: '100%' }} value={printer.connectionType} onChange={e => { const updated = [...kitchenPrinters]; updated[index].connectionType = e.target.value as 'OS' | 'IP'; setKitchenPrinters(updated); }}>
                                        <option value="OS">محلية (USB/OS)</option>
                                        <option value="IP">شبكة (IP/LAN)</option>
                                    </select>
                                </div>
                                <div style={{ flex: '2 1 200px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>مسار الطابعة (OS Name أو IP Address)</label>
                                    <input type="text" className="input" style={{ width: '100%' }} value={printer.connectionString} onChange={e => { const updated = [...kitchenPrinters]; updated[index].connectionString = e.target.value; setKitchenPrinters(updated); }} placeholder={printer.connectionType === 'IP' ? '192.168.1.100' : 'POS Printer 80mm'} />
                                </div>
                                <div style={{ flex: '2 1 200px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>الأقسام المخصصة لهذه الطابعة</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', border: '1px solid var(--border)', minHeight: '38px', padding: '4px', borderRadius: '4px', alignItems: 'center' }}>
                                        {categories && categories.map(cat => (
                                            <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: printer.targetCategories.includes(cat.id) ? 'var(--primary-light, rgba(99,102,241,0.2))' : 'transparent', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>
                                                <input type="checkbox" checked={printer.targetCategories.includes(cat.id)} onChange={e => {
                                                    const updated = [...kitchenPrinters];
                                                    if(e.target.checked) updated[index].targetCategories.push(cat.id);
                                                    else updated[index].targetCategories = updated[index].targetCategories.filter((id: any) => id !== cat.id);
                                                    setKitchenPrinters(updated);
                                                }} />
                                                {cat.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <button onClick={() => { const updated = [...kitchenPrinters]; updated.splice(index, 1); setKitchenPrinters(updated); }} className="btn btn-danger" style={{ padding: '6px 12px' }}>حذف</button>
                                </div>
                            </div>
                        ))}
                        {kitchenPrinters.length === 0 && <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>لا توجد طابعات مساعدة مضافة.</p>}
                    </div>
                </div>

                {/* Enable/Disable Global Discount */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>تفعيل إمكانية الخصم</h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                            السماح للكاشير بإدخال أرقام للخصم في الفاتورة. عند الإيقاف سيختفي صندوق الخصم كلياً.
                        </p>
                    </div>
                    <div>
                        <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px' }}>
                            <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} 
                                checked={discountEnabled} 
                                onChange={e => setDiscountEnabled(e.target.checked)} />
                            <span style={{
                                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: discountEnabled ? 'var(--primary)' : '#ccc',
                                transition: '.4s', borderRadius: '34px'
                            }}>
                                <span style={{
                                    position: 'absolute', content: '""', height: '20px', width: '20px',
                                    left: discountEnabled ? '26px' : '4px', bottom: '4px',
                                    backgroundColor: 'white', transition: '.4s', borderRadius: '50%'
                                }}></span>
                            </span>
                        </label>
                    </div>
                </div>

                {/* Enable/Disable Tax */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>تفعيل ضريبة القيمة المضافة</h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                            عند الإيقاف سيتم البيع بدون حساب وحفظ الضريبة على فاتورة المبيعات للمستهلك ولن تظهر في الشاشة.
                        </p>
                    </div>
                    <div>
                        <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px' }}>
                            <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} 
                                checked={taxEnabled} 
                                onChange={e => setTaxEnabled(e.target.checked)} />
                            <span style={{
                                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: taxEnabled ? 'var(--primary)' : '#ccc',
                                transition: '.4s', borderRadius: '34px'
                            }}>
                                <span style={{
                                    position: 'absolute', content: '""', height: '20px', width: '20px',
                                    left: taxEnabled ? '26px' : '4px', bottom: '4px',
                                    backgroundColor: 'white', transition: '.4s', borderRadius: '50%'
                                }}></span>
                            </span>
                        </label>
                    </div>
                </div>

                {taxEnabled && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)', background: 'rgba(99,102,241,0.05)', padding: '16px', borderRadius: '8px' }}>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>نسبة القيمة المضافة الافتراضية (VAT)</h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                                النسبة المئوية المطبقة افتراضياً في شاشة نقاط البيع (POS).
                            </p>
                        </div>
                        <div>
                            <select className="input" style={{ width: '150px' }} value={taxRate} onChange={e => setTaxRate(e.target.value)}>
                                <option value="15">15% (أساسية)</option>
                                <option value="5">5% (مخفضة)</option>
                                <option value="0">0% (معفاة/صفرية)</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Tax Inclusive / Exclusive */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>أسعار البيع شاملة الضريبة</h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                            عند التفعيل، سيعتبر النظام أن أسعار المنتجات المضافة للفاتورة تشمل ضريبة القيمة المضافة وسيستخرج الضريبة منها. عند الإيقاف، سيضيف الضريبة فوق السعر.
                        </p>
                    </div>
                    <div>
                        <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px' }}>
                            <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} 
                                checked={taxInclusive} 
                                onChange={e => setTaxInclusive(e.target.checked)} />
                            <span style={{
                                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: taxInclusive ? 'var(--primary)' : '#ccc',
                                transition: '.4s', borderRadius: '34px'
                            }}>
                                <span style={{
                                    position: 'absolute', content: '""', height: '20px', width: '20px',
                                    left: taxInclusive ? '26px' : '4px', bottom: '4px',
                                    backgroundColor: 'white', transition: '.4s', borderRadius: '50%'
                                }}></span>
                            </span>
                        </label>
                    </div>
                </div>

                {/* Enable/Disable Coupons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>تفعيل الكوبونات</h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                            السماح للكاشير بإدخال أكواد الخصم الخارجية (الكوبونات). عند الإيقاف سيعمل النظام بدون كوبونات.
                        </p>
                    </div>
                    <div>
                        <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px' }}>
                            <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} 
                                checked={couponsEnabled} 
                                onChange={e => setCouponsEnabled(e.target.checked)} />
                            <span style={{
                                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: couponsEnabled ? 'var(--primary)' : '#ccc',
                                transition: '.4s', borderRadius: '34px'
                            }}>
                                <span style={{
                                    position: 'absolute', content: '""', height: '20px', width: '20px',
                                    left: couponsEnabled ? '26px' : '4px', bottom: '4px',
                                    backgroundColor: 'white', transition: '.4s', borderRadius: '50%'
                                }}></span>
                            </span>
                        </label>
                    </div>
                </div>

                {/* Allow Add Product */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>السماح بإضافة منتج غير موجود</h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                            عند الإيقاف لن يظهر زر "إضافة منتج جديد" في شاشة المبيعات، ويجب إضافة المنتجات من قسم المستودعات فقط.
                        </p>
                    </div>
                    <div>
                        <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px' }}>
                            <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} 
                                checked={allowAddProduct} 
                                onChange={e => setAllowAddProduct(e.target.checked)} />
                            <span style={{
                                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: allowAddProduct ? 'var(--primary)' : '#ccc',
                                transition: '.4s', borderRadius: '34px'
                            }}>
                                <span style={{
                                    position: 'absolute', content: '""', height: '20px', width: '20px',
                                    left: allowAddProduct ? '26px' : '4px', bottom: '4px',
                                    backgroundColor: 'white', transition: '.4s', borderRadius: '50%'
                                }}></span>
                            </span>
                        </label>
                    </div>
                </div>

                {/* Allow Negative Stock */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>السماح بالبيع في حالة نفاذ الكمية</h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                            عند الإيقاف سيتم منع بيع أي منتج كميته في المستودع صفر أو أقل. عند التفعيل يمكن البيع بالسالب.
                        </p>
                    </div>
                    <div>
                        <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px' }}>
                            <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} 
                                checked={allowNegativeStock} 
                                onChange={e => setAllowNegativeStock(e.target.checked)} />
                            <span style={{
                                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: allowNegativeStock ? 'var(--primary)' : '#ccc',
                                transition: '.4s', borderRadius: '34px'
                            }}>
                                <span style={{
                                    position: 'absolute', content: '""', height: '20px', width: '20px',
                                    left: allowNegativeStock ? '26px' : '4px', bottom: '4px',
                                    backgroundColor: 'white', transition: '.4s', borderRadius: '50%'
                                }}></span>
                            </span>
                        </label>
                    </div>
                </div>

                {/* Automation Rules */}
                <div style={{ opacity: discountEnabled ? 1 : 0.5, pointerEvents: discountEnabled ? 'auto' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>قواعد الحد الأقصى للخصم (ديناميكي)</h3>
                            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                                حدد المبالغ المسموحة للخصم بناءً على قيمة مشتريات الفاتورة. (مثال: إذا الفاتورة بـ 100، مسموح بخصم 10 ريال).
                            </p>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={addRule}>
                            + إضافة شريحة
                        </button>
                    </div>

                    {discountRules.length === 0 ? (
                        <div style={{ padding: '30px', textAlign: 'center', background: 'var(--bg-body)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                            <p style={{ color: 'var(--text-muted)' }}>لا توجد أي قواعد. بذلك يمكن للكاشير أن يخصم أي مبلغ دون قيود.</p>
                        </div>
                    ) : (
                        <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-body)' }}>
                                    <th style={{ padding: '12px' }}>أقل قيمة فاتورة (ريال)</th>
                                    <th style={{ padding: '12px' }}>أكبر خصم مسموح (ريال)</th>
                                    <th style={{ padding: '12px' }}>أكبر خصم مسموح (%)</th>
                                    <th style={{ padding: '12px', width: '60px' }}>إجراء</th>
                                </tr>
                            </thead>
                            <tbody>
                                {discountRules.map((rule, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '12px' }}>
                                            <input type="number" min="0" className="input" 
                                                style={{ width: '100%', textAlign: 'center' }} dir="ltr"
                                                value={rule.minAmount} 
                                                onChange={e => updateRule(idx, 'minAmount', parseFloat(e.target.value) || 0)} 
                                            />
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <input type="number" min="0" className="input" 
                                                style={{ width: '100%', textAlign: 'center' }} dir="ltr"
                                                value={rule.maxDiscount} 
                                                onChange={e => updateRule(idx, 'maxDiscount', parseFloat(e.target.value) || 0)} 
                                            />
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <input type="number" min="0" max="100" className="input" 
                                                style={{ width: '100%', textAlign: 'center' }} dir="ltr"
                                                value={rule.maxDiscountPercent || 0} 
                                                onChange={e => updateRule(idx, 'maxDiscountPercent', parseFloat(e.target.value) || 0)} 
                                            />
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <button onClick={() => removeRule(idx)} 
                                                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '18px' }}>
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ padding: '10px 30px', fontSize: '16px' }}>
                        {saving ? 'جاري الحفظ...' : '💾 حفظ الإعدادات'}
                    </button>
                </div>
            </div>

            {toast && (
                <div style={{
                    position: 'fixed', bottom: '20px', left: '20px', padding: '15px 25px', zIndex: 9999,
                    background: toast.type === 'success' ? '#22c55e' : '#ef4444',
                    color: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    fontWeight: 'bold', fontSize: '15px', animation: 'slideUp 0.3s ease-out'
                }}>
                    {toast.msg}
                </div>
            )}
        </div>
    );
}
