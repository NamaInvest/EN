'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/lib/SettingsContext';

interface DiscountRule {
    minAmount: number;
    maxDiscount: number;
    maxDiscountPercent: number;
}

interface QZPrinterConfig {
    id: string; // purely for frontend mapping
    name: string;
    type: 'os' | 'ip' | 'usb';
    ipAddress?: string;
    targetCategories?: number[];
}

export default function SalesOptionsPage() {
    const { getSetting, refreshSettings } = useSettings();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // States
    const [discountEnabled, setDiscountEnabled] = useState(true);
    const [couponsEnabled, setCouponsEnabled] = useState(true);
    const [taxEnabled, setTaxEnabled] = useState(true);
    const [taxInclusive, setTaxInclusive] = useState(true);
    const [allowNegativeStock, setAllowNegativeStock] = useState(false);
    const [allowAddProduct, setAllowAddProduct] = useState(true);
    const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
    
    // Printer States
    const [masterPrinter, setMasterPrinter] = useState('');
    const [kitchenPrinters, setKitchenPrinters] = useState<QZPrinterConfig[]>([]);
    const [categories, setCategories] = useState<{id:number, name:string}[]>([]);
    
    // Toasts
    const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        await refreshSettings();
        
        try {
            const catRes = await fetch('/api/categories?type=0');
            if (catRes.ok) {
                setCategories(await catRes.json());
            }
        } catch(e) { console.error('Failed to load categories', e); }

        // Parse states
        const enabledRaw = getSetting('POS_DISCOUNT_ENABLED', 'true');
        setDiscountEnabled(enabledRaw === 'true');
        
        const taxRaw = getSetting('POS_TAX_ENABLED', 'true');
        setTaxEnabled(taxRaw === 'true');
        
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
            if(Array.isArray(parsed)) setDiscountRules(parsed);
        } catch(e) {
            console.error('Failed to parse discount rules', e);
        }

        const masterRaw = getSetting('POS_MASTER_PRINTER', '');
        setMasterPrinter(masterRaw);

        const kitchenRaw = getSetting('POS_KITCHEN_PRINTERS', '[]');
        try {
            const kParsed = JSON.parse(kitchenRaw);
            if(Array.isArray(kParsed)) {
                setKitchenPrinters(kParsed);
            }
        } catch(e) {}


        setLoading(false);
    };

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
                POS_ALLOW_NEGATIVE_STOCK: allowNegativeStock ? 'true' : 'false',
                POS_ALLOW_ADD_PRODUCT: allowAddProduct ? 'true' : 'false',
                POS_DISCOUNT_RULES: JSON.stringify(sortedRules),
                POS_MASTER_PRINTER: masterPrinter,
                POS_KITCHEN_PRINTERS: JSON.stringify(kitchenPrinters)
            };

            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('ط¸ظ¾ط·آ´ط¸â€‍ ط·آ§ط¸â€‍ط·آ­ط¸ظ¾ط·آ¸');
            
            await refreshSettings();
            
            setToast({ msg: 'أ¢إ“â€¦ ط·ع¾ط¸â€¦ ط·آ­ط¸ظ¾ط·آ¸ ط·آ§ط¸â€‍ط·آ®ط¸ظ¹ط·آ§ط·آ±ط·آ§ط·ع¾ ط·آ¨ط¸â€ ط·آ¬ط·آ§ط·آ­', type: 'success' });
        } catch (error: any) {
            setToast({ msg: 'أ¢â€Œإ’ ' + error.message, type: 'error' });
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

    const addKitchenPrinter = () => {
        setKitchenPrinters([...kitchenPrinters, { id: Date.now().toString(), name: 'ط·ط§ط¨ط¹ط© ' + (kitchenPrinters.length + 1), type: 'ip', ipAddress: '192.168.1.100', targetCategories: [] }]);
    };

    const updateKitchenPrinter = (index: number, key: keyof QZPrinterConfig, value: any) => {
        const newPrs = [...kitchenPrinters];
        newPrs[index][key] = value as never;
        setKitchenPrinters(newPrs);
    };

    const removeKitchenPrinter = (index: number) => {
        setKitchenPrinters(kitchenPrinters.filter((_, i) => i !== index));
    };

    const togglePrinterCategory = (index: number, catId: number) => {
        const newPrs = [...kitchenPrinters];
        const pr = newPrs[index];
        if (!pr.targetCategories) pr.targetCategories = [];
        if (pr.targetCategories.includes(catId)) {
            pr.targetCategories = pr.targetCategories.filter(id => id !== catId);
        } else {
            pr.targetCategories.push(catId);
        }
        setKitchenPrinters(newPrs);
    };

    if (loading) return <div className="page" style={{ padding: '20px', textAlign:'center' }}>ط¬ط§ط±ظٹ ط§ظ„طھط­ظ…ظٹظ„...</div>;

    return (
        <div className="page fade-in" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', direction: 'rtl' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>âڑ™ï¸ڈ ط®ظٹط§ط±ط§طھ ط§ظ„ظ…ط¨ظٹط¹ط§طھ ظˆط§ظ„ط®طµظˆظ…ط§طھ</h1>
            </div>

            <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                
                {/* Enable/Disable Global Discount */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>ط·ع¾ط¸ظ¾ط·آ¹ط¸ظ¹ط¸â€‍ ط·آ¥ط¸â€¦ط¸ئ’ط·آ§ط¸â€ ط¸ظ¹ط·آ© ط·آ§ط¸â€‍ط·آ®ط·آµط¸â€¦</h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                            ط·آ§ط¸â€‍ط·آ³ط¸â€¦ط·آ§ط·آ­ ط¸â€‍ط¸â€‍ط¸ئ’ط·آ§ط·آ´ط¸ظ¹ط·آ± ط·آ¨ط·آ¥ط·آ¯ط·آ®ط·آ§ط¸â€‍ ط·آ£ط·آ±ط¸â€ڑط·آ§ط¸â€¦ ط¸â€‍ط¸â€‍ط·آ®ط·آµط¸â€¦ ط¸ظ¾ط¸ظ¹ ط·آ§ط¸â€‍ط¸ظ¾ط·آ§ط·ع¾ط¸ث†ط·آ±ط·آ©. ط·آ¹ط¸â€ ط·آ¯ ط·آ§ط¸â€‍ط·آ¥ط¸ظ¹ط¸â€ڑط·آ§ط¸ظ¾ ط·آ³ط¸ظ¹ط·آ®ط·ع¾ط¸ظ¾ط¸ظ¹ ط·آµط¸â€ ط·آ¯ط¸ث†ط¸â€ڑ ط·آ§ط¸â€‍ط·آ®ط·آµط¸â€¦ ط¸ئ’ط¸â€‍ط¸ظ¹ط·آ§ط¸â€¹.
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
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>ط·ع¾ط¸ظ¾ط·آ¹ط¸ظ¹ط¸â€‍ ط·آ¶ط·آ±ط¸ظ¹ط·آ¨ط·آ© ط·آ§ط¸â€‍ط¸â€ڑط¸ظ¹ط¸â€¦ط·آ© ط·آ§ط¸â€‍ط¸â€¦ط·آ¶ط·آ§ط¸ظ¾ط·آ©</h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                            ط·آ¹ط¸â€ ط·آ¯ ط·آ§ط¸â€‍ط·آ¥ط¸ظ¹ط¸â€ڑط·آ§ط¸ظ¾ ط·آ³ط¸ظ¹ط·ع¾ط¸â€¦ ط·آ§ط¸â€‍ط·آ¨ط¸ظ¹ط·آ¹ ط·آ¨ط·آ¯ط¸ث†ط¸â€  ط·آ­ط·آ³ط·آ§ط·آ¨ ط¸ث†ط·آ­ط¸ظ¾ط·آ¸ ط·آ§ط¸â€‍ط·آ¶ط·آ±ط¸ظ¹ط·آ¨ط·آ© ط·آ¹ط¸â€‍ط¸â€° ط¸ظ¾ط·آ§ط·ع¾ط¸ث†ط·آ±ط·آ© ط·آ§ط¸â€‍ط¸â€¦ط·آ¨ط¸ظ¹ط·آ¹ط·آ§ط·ع¾ ط¸â€‍ط¸â€‍ط¸â€¦ط·آ³ط·ع¾ط¸â€،ط¸â€‍ط¸ئ’ ط¸ث†ط¸â€‍ط¸â€  ط·ع¾ط·آ¸ط¸â€،ط·آ± ط¸ظ¾ط¸ظ¹ ط·آ§ط¸â€‍ط·آ´ط·آ§ط·آ´ط·آ©.
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

                {/* Inclusive Tax Mode */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>ط·آ§ط¸â€‍ط·آ£ط·آ³ط·آ¹ط·آ§ط·آ± ط·آ´ط·آ§ط¸â€¦ط¸â€‍ط·آ© ط·آ§ط¸â€‍ط·آ¶ط·آ±ط¸ظ¹ط·آ¨ط·آ© (ط·آ§ط¸â€‍ط·ع¾ط·آ­ط¸ظ¹ط¸ظ¹ط·آ¯ ط·آ§ط¸â€‍ط·ع¾ط¸â€‍ط¸â€ڑط·آ§ط·آ¦ط¸ظ¹)</h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                            ط·آ¹ط¸â€ ط·آ¯ ط·آ§ط¸â€‍ط·ع¾ط¸ظ¾ط·آ¹ط¸ظ¹ط¸â€‍ ط·آ³ط¸ظ¹ط¸â€ڑط¸ث†ط¸â€¦ ط·آ§ط¸â€‍ط¸â€ ط·آ¸ط·آ§ط¸â€¦ ط·آ¨ط·آ§ط·آ¹ط·ع¾ط·آ¨ط·آ§ط·آ± ط·آ£ط¸ظ¹ ط·آ³ط·آ¹ط·آ± ط¸ظ¹ط¸عˆط·آ¯ط·آ®ط¸â€‍ ط¸ئ’ط·آ£ط¸â€ ط¸â€، ط·آ³ط·آ¹ط·آ± ط¸â€ ط¸â€،ط·آ§ط·آ¦ط¸ظ¹ ط·آ´ط·آ§ط¸â€¦ط¸â€‍ ط¸â€‍ط·آ¶ط·آ±ط¸ظ¹ط·آ¨ط·آ© ط·آ§ط¸â€‍ط¸â€ڑط¸ظ¹ط¸â€¦ط·آ© ط·آ§ط¸â€‍ط¸â€¦ط·آ¶ط·آ§ط¸ظ¾ط·آ© (15ط¸ع¾)ط·إ’ ط¸ث†ط¸ظ¹ط¸â€ڑط¸ث†ط¸â€¦ ط·آ¢ط¸â€‍ط¸ظ¹ط·آ§ط¸â€¹ ط·آ¨ط·آ§ط·آ³ط·ع¾ط¸â€ڑط·آ·ط·آ§ط·آ¹ ط·آ§ط¸â€‍ط·آ¶ط·آ±ط¸ظ¹ط·آ¨ط·آ© ط¸ث†ط·آ§ط·آ³ط·ع¾ط·آ®ط·آ±ط·آ§ط·آ¬ ط·آ§ط¸â€‍ط·آ³ط·آ¹ط·آ± ط·آ§ط¸â€‍ط·آ£ط·آ³ط·آ§ط·آ³ط¸ظ¹ ط¸â€‍ط¸â€‍ط¸â€¦ط¸â€ ط·ع¾ط·آ¬ ط¸â€‍ط·آ¶ط¸â€¦ط·آ§ط¸â€  ط·آµط·آ­ط·آ© ط·آ§ط¸â€‍ط¸â€ڑط¸ظ¹ط¸ث†ط·آ¯ ط·آ§ط¸â€‍ط¸â€¦ط·آ­ط·آ§ط·آ³ط·آ¨ط¸ظ¹ط·آ©.
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
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>ط·ع¾ط¸ظ¾ط·آ¹ط¸ظ¹ط¸â€‍ ط·آ§ط¸â€‍ط¸ئ’ط¸ث†ط·آ¨ط¸ث†ط¸â€ ط·آ§ط·ع¾</h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                            ط·آ§ط¸â€‍ط·آ³ط¸â€¦ط·آ§ط·آ­ ط¸â€‍ط¸â€‍ط¸ئ’ط·آ§ط·آ´ط¸ظ¹ط·آ± ط·آ¨ط·آ¥ط·آ¯ط·آ®ط·آ§ط¸â€‍ ط·آ£ط¸ئ’ط¸ث†ط·آ§ط·آ¯ ط·آ§ط¸â€‍ط·آ®ط·آµط¸â€¦ ط·آ§ط¸â€‍ط·آ®ط·آ§ط·آ±ط·آ¬ط¸ظ¹ط·آ© (ط·آ§ط¸â€‍ط¸ئ’ط¸ث†ط·آ¨ط¸ث†ط¸â€ ط·آ§ط·ع¾). ط·آ¹ط¸â€ ط·آ¯ ط·آ§ط¸â€‍ط·آ¥ط¸ظ¹ط¸â€ڑط·آ§ط¸ظ¾ ط·آ³ط¸ظ¹ط·آ¹ط¸â€¦ط¸â€‍ ط·آ§ط¸â€‍ط¸â€ ط·آ¸ط·آ§ط¸â€¦ ط·آ¨ط·آ¯ط¸ث†ط¸â€  ط¸ئ’ط¸ث†ط·آ¨ط¸ث†ط¸â€ ط·آ§ط·ع¾.
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
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>ط·آ§ط¸â€‍ط·آ³ط¸â€¦ط·آ§ط·آ­ ط·آ¨ط·آ¥ط·آ¶ط·آ§ط¸ظ¾ط·آ© ط¸â€¦ط¸â€ ط·ع¾ط·آ¬ ط·ط›ط¸ظ¹ط·آ± ط¸â€¦ط¸ث†ط·آ¬ط¸ث†ط·آ¯</h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                            ط·آ¹ط¸â€ ط·آ¯ ط·آ§ط¸â€‍ط·آ¥ط¸ظ¹ط¸â€ڑط·آ§ط¸ظ¾ ط¸â€‍ط¸â€  ط¸ظ¹ط·آ¸ط¸â€،ط·آ± ط·آ²ط·آ± "ط·آ¥ط·آ¶ط·آ§ط¸ظ¾ط·آ© ط¸â€¦ط¸â€ ط·ع¾ط·آ¬ ط·آ¬ط·آ¯ط¸ظ¹ط·آ¯" ط¸ظ¾ط¸ظ¹ ط·آ´ط·آ§ط·آ´ط·آ© ط·آ§ط¸â€‍ط¸â€¦ط·آ¨ط¸ظ¹ط·آ¹ط·آ§ط·ع¾ط·إ’ ط¸ث†ط¸ظ¹ط·آ¬ط·آ¨ ط·آ¥ط·آ¶ط·آ§ط¸ظ¾ط·آ© ط·آ§ط¸â€‍ط¸â€¦ط¸â€ ط·ع¾ط·آ¬ط·آ§ط·ع¾ ط¸â€¦ط¸â€  ط¸â€ڑط·آ³ط¸â€¦ ط·آ§ط¸â€‍ط¸â€¦ط·آ³ط·ع¾ط¸ث†ط·آ¯ط·آ¹ط·آ§ط·ع¾ ط¸ظ¾ط¸â€ڑط·آ·.
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
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>ط·آ§ط¸â€‍ط·آ³ط¸â€¦ط·آ§ط·آ­ ط·آ¨ط·آ§ط¸â€‍ط·آ¨ط¸ظ¹ط·آ¹ ط¸ظ¾ط¸ظ¹ ط·آ­ط·آ§ط¸â€‍ط·آ© ط¸â€ ط¸ظ¾ط·آ§ط·آ° ط·آ§ط¸â€‍ط¸ئ’ط¸â€¦ط¸ظ¹ط·آ©</h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                            ط·آ¹ط¸â€ ط·آ¯ ط·آ§ط¸â€‍ط·آ¥ط¸ظ¹ط¸â€ڑط·آ§ط¸ظ¾ ط·آ³ط¸ظ¹ط·ع¾ط¸â€¦ ط¸â€¦ط¸â€ ط·آ¹ ط·آ¨ط¸ظ¹ط·آ¹ ط·آ£ط¸ظ¹ ط¸â€¦ط¸â€ ط·ع¾ط·آ¬ ط¸ئ’ط¸â€¦ط¸ظ¹ط·ع¾ط¸â€، ط¸ظ¾ط¸ظ¹ ط·آ§ط¸â€‍ط¸â€¦ط·آ³ط·ع¾ط¸ث†ط·آ¯ط·آ¹ ط·آµط¸ظ¾ط·آ± ط·آ£ط¸ث† ط·آ£ط¸â€ڑط¸â€‍. ط·آ¹ط¸â€ ط·آ¯ ط·آ§ط¸â€‍ط·ع¾ط¸ظ¾ط·آ¹ط¸ظ¹ط¸â€‍ ط¸ظ¹ط¸â€¦ط¸ئ’ط¸â€  ط·آ§ط¸â€‍ط·آ¨ط¸ظ¹ط·آ¹ ط·آ¨ط·آ§ط¸â€‍ط·آ³ط·آ§ط¸â€‍ط·آ¨.
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
                <div style={{ opacity: discountEnabled ? 1 : 0.5, pointerEvents: discountEnabled ? 'auto' : 'none', marginBottom: '40px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>ط¸â€ڑط¸ث†ط·آ§ط·آ¹ط·آ¯ ط·آ§ط¸â€‍ط·آ­ط·آ¯ ط·آ§ط¸â€‍ط·آ£ط¸â€ڑط·آµط¸â€° ط¸â€‍ط¸â€‍ط·آ®ط·آµط¸â€¦ (ط·آ¯ط¸ظ¹ط¸â€ ط·آ§ط¸â€¦ط¸ظ¹ط¸ئ’ط¸ظ¹)</h3>
                            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                                ط·آ­ط·آ¯ط·آ¯ ط·آ§ط¸â€‍ط¸â€¦ط·آ¨ط·آ§ط¸â€‍ط·ط› ط·آ§ط¸â€‍ط¸â€¦ط·آ³ط¸â€¦ط¸ث†ط·آ­ط·آ© ط¸â€‍ط¸â€‍ط·آ®ط·آµط¸â€¦ ط·آ¨ط¸â€ ط·آ§ط·طŒط¸â€¹ ط·آ¹ط¸â€‍ط¸â€° ط¸â€ڑط¸ظ¹ط¸â€¦ط·آ© ط¸â€¦ط·آ´ط·ع¾ط·آ±ط¸ظ¹ط·آ§ط·ع¾ ط·آ§ط¸â€‍ط¸ظ¾ط·آ§ط·ع¾ط¸ث†ط·آ±ط·آ©. (ط¸â€¦ط·آ«ط·آ§ط¸â€‍: ط·آ¥ط·آ°ط·آ§ ط·آ§ط¸â€‍ط¸ظ¾ط·آ§ط·ع¾ط¸ث†ط·آ±ط·آ© ط·آ¨ط¸â‚¬ 100ط·إ’ ط¸â€¦ط·آ³ط¸â€¦ط¸ث†ط·آ­ ط·آ¨ط·آ®ط·آµط¸â€¦ 10 ط·آ±ط¸ظ¹ط·آ§ط¸â€‍).
                            </p>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={addRule}>
                            + ط·آ¥ط·آ¶ط·آ§ط¸ظ¾ط·آ© ط·آ´ط·آ±ط¸ظ¹ط·آ­ط·آ©
                        </button>
                    </div>

                    {discountRules.length === 0 ? (
                        <div style={{ padding: '30px', textAlign: 'center', background: 'var(--bg-body)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                            <p style={{ color: 'var(--text-muted)' }}>ط¸â€‍ط·آ§ ط·ع¾ط¸ث†ط·آ¬ط·آ¯ ط·آ£ط¸ظ¹ ط¸â€ڑط¸ث†ط·آ§ط·آ¹ط·آ¯. ط·آ¨ط·آ°ط¸â€‍ط¸ئ’ ط¸ظ¹ط¸â€¦ط¸ئ’ط¸â€  ط¸â€‍ط¸â€‍ط¸ئ’ط·آ§ط·آ´ط¸ظ¹ط·آ± ط·آ£ط¸â€  ط¸ظ¹ط·آ®ط·آµط¸â€¦ ط·آ£ط¸ظ¹ ط¸â€¦ط·آ¨ط¸â€‍ط·ط› ط·آ¯ط¸ث†ط¸â€  ط¸â€ڑط¸ظ¹ط¸ث†ط·آ¯.</p>
                        </div>
                    ) : (
                        <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-body)' }}>
                                    <th style={{ padding: '12px' }}>ط·آ£ط¸â€ڑط¸â€‍ ط¸â€ڑط¸ظ¹ط¸â€¦ط·آ© ط¸ظ¾ط·آ§ط·ع¾ط¸ث†ط·آ±ط·آ© (ط·آ±ط¸ظ¹ط·آ§ط¸â€‍)</th>
                                    <th style={{ padding: '12px' }}>ط·آ£ط¸ئ’ط·آ¨ط·آ± ط·آ®ط·آµط¸â€¦ ط¸â€¦ط·آ³ط¸â€¦ط¸ث†ط·آ­ (ط·آ±ط¸ظ¹ط·آ§ط¸â€‍)</th>
                                    <th style={{ padding: '12px' }}>ط·آ£ط¸ئ’ط·آ¨ط·آ± ط·آ®ط·آµط¸â€¦ ط¸â€¦ط·آ³ط¸â€¦ط¸ث†ط·آ­ (%)</th>
                                    <th style={{ padding: '12px', width: '60px' }}>ط·آ¥ط·آ¬ط·آ±ط·آ§ط·طŒ</th>
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
                                                ظ‹ع؛â€”â€کأ¯آ¸عˆ
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* QZ Tray Printers */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>ط·ط§ط¨ط¹ط§طھ ط§ظ„ظƒط§ط´ظٹط± ظˆط§ظ„ظ…ط·ط¨ط® (ط¹ط¨ط± ط´ط¨ظƒط© QZ Tray)</h3>
                            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                                ظٹط¬ط¨ طھط«ط¨ظٹطھ ط¨ط±ظ†ط§ظ…ط¬ QZ Tray ط¹ظ„ظ‰ ط£ط¬ظ‡ط²ط© ط§ظ„ظƒظ…ط¨ظٹظˆطھط± ظ„ظ†ط¬ط§ط­ ط§ظ„ط§طھطµط§ظ„.
                            </p>
                        </div>
                    </div>
                    
                    {/* Master Printer */}
                    <div style={{ background: 'rgba(108, 99, 255, 0.05)', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--primary)' }}>
                        <h4 style={{ fontWeight: 'bold', marginBottom: '8px' }}>ًں–¨ï¸ڈ ط§ظ„ط·ط§ط¨ط¹ط© ط§ظ„ط±ط¦ظٹط³ظٹط© (ط·ط§ط¨ط¹ط© ط§ظ„ظƒط§ط´ظٹط± / ط§ظ„ظپظˆط§طھظٹط±)</h4>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>طھظ‚ظˆظ… ط¨ط·ط¨ط§ط¹ط© ط§ظ„ظپط§طھظˆط±ط© ط§ظ„ظ†ظ‡ط§ط¦ظٹط© ظ„ظ„ط¹ظ…ظٹظ„ ظ…ط¶ط§ظپط§ظ‹ ط¥ظ„ظٹظ‡ط§ ط¨ط§ط±ظƒظˆط¯ ظ‡ظٹط¦ط© ط§ظ„ط²ظƒط§ط©.</p>
                        <input 
                            value={masterPrinter} 
                            onChange={e => setMasterPrinter(e.target.value)} 
                            placeholder="ط§ط³ظ… ط§ظ„ط·ط§ط¨ط¹ط© ظپظٹ ظ†ط¸ط§ظ… ط§ظ„ظˆظٹظ†ط¯ظˆط² (ط£ط¯ظˆط§طھ ط§ظ„ظ†ط¸ط§ظ…)" 
                            className="input" 
                            style={{ width: '100%', maxWidth: '400px' }} 
                        />
                    </div>

                    {/* Kitchen Printers */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ fontWeight: 'bold' }}>ًںچ³ ط·ط§ط¨ط¹ط§طھ ط§ظ„ط£ظ‚ط³ط§ظ… (ط§ظ„ظ…ط·ط¨ط® / ط§ظ„ظƒظˆظپظٹ / ط§ظ„ط®)</h4>
                        <button className="btn btn-primary btn-sm" onClick={addKitchenPrinter}>
                            + ط¥ط¶ط§ظپط© ط·ط§ط¨ط¹ط© ظ…ط³ط§ط¹ط¯ط©
                        </button>
                    </div>

                    {kitchenPrinters.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', background: 'var(--bg-body)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                            <p style={{ color: 'var(--text-muted)' }}>ظ„ط§ طھظˆط¬ط¯ ط£ظٹ ط·ط§ط¨ط¹ط§طھ ظ…ط³ط§ط¹ط¯ط© ظ…ط¶ط§ظپط©.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {kitchenPrinters.map((pr, idx) => (
                                <div key={pr.id} style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)' }}>
                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                        <div style={{ flex: 1, minWidth: '150px' }}>
                                            <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ط§ط³ظ… ط§ظ„ط·ط§ط¨ط¹ط© / ط§ظ„ظ‚ط³ظ…</label>
                                            <input className="input" style={{ width: '100%' }} value={pr.name} onChange={e => updateKitchenPrinter(idx, 'name', e.target.value)} placeholder="ظ…ط«ط§ظ„: ط·ط§ط¨ط¹ط© ط§ظ„ظ…ط´ط§ظˆظٹ" />
                                        </div>
                                        <div style={{ flex: '0 0 120px' }}>
                                            <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ظ†ظˆط¹ ط§ظ„ط§طھطµط§ظ„</label>
                                            <select className="input" style={{ width: '100%' }} value={pr.type} onChange={e => updateKitchenPrinter(idx, 'type', e.target.value)}>
                                                <option value="ip">ط´ط¨ظƒط© (IP)</option>
                                                <option value="os">ط¹ط¨ط± ط§ظ„ظ†ط¸ط§ظ… (USB)</option>
                                            </select>
                                        </div>
                                        <div style={{ flex: 2, minWidth: '200px' }}>
                                            <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{pr.type === 'ip' ? 'ط¹ظ†ظˆط§ظ† ط§ظ„ط·ط§ط¨ط¹ط© (IP)' : 'ط§ط³ظ… ط§ظ„ط·ط§ط¨ط¹ط© ظپظٹ ط§ظ„ظ†ط¸ط§ظ…'}</label>
                                            <input className="input" style={{ width: '100%' }} dir="ltr" value={pr.type === 'ip' ? (pr.ipAddress || '') : pr.name} onChange={e => updateKitchenPrinter(idx, pr.type === 'ip' ? 'ipAddress' : 'name', e.target.value)} placeholder={pr.type === 'ip' ? "192.168.1.100" : "EPSON TM-T20II Receipt"} />
                                        </div>
                                        <div>
                                            <button onClick={() => removeKitchenPrinter(idx)} className="btn btn-sm" style={{ marginTop: '20px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none' }}>ط­ط°ظپ</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>ط§ظ„ط£ظ‚ط³ط§ظ… ط§ظ„ظ…ط±طھط¨ط·ط© ط¨ظ‡ط§ (ط§ظ„ط£طµظ†ط§ظپ ط§ظ„طھظٹ طھط·ط¨ط¹ ظ‡ظ†ط§):</label>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {categories.map(cat => (
                                                <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', background: (pr.targetCategories || []).includes(cat.id) ? 'var(--primary)' : 'var(--bg-body)', color: (pr.targetCategories || []).includes(cat.id) ? 'white' : 'var(--text-color)', border: '1px solid var(--border)' }}>
                                                    <input type="checkbox" style={{ display: 'none' }} checked={(pr.targetCategories || []).includes(cat.id)} onChange={() => togglePrinterCategory(idx, cat.id)} />
                                                    <span style={{ fontSize: '12px' }}>{cat.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ padding: '10px 30px', fontSize: '16px' }}>
                        {saving ? 'ط·آ¬ط·آ§ط·آ±ط¸ظ¹ ط·آ§ط¸â€‍ط·آ­ط¸ظ¾ط·آ¸...' : 'ظ‹ع؛â€™آ¾ ط·آ­ط¸ظ¾ط·آ¸ ط·آ§ط¸â€‍ط·آ¥ط·آ¹ط·آ¯ط·آ§ط·آ¯ط·آ§ط·ع¾'}
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


