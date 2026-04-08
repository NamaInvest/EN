import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";

export default function SalesReturnModal({ onClose }: { onClose: () => void }) {
    const { t } = useTranslation();
    const [searchInvoiceNo, setSearchInvoiceNo] = useState('');
    const [originalInvoice, setOriginalInvoice] = useState<any>(null);
    const [returnItems, setReturnItems] = useState<any[]>([]);
    const [notes, setNotes] = useState('');
    const [searching, setSearching] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [saving, setSaving] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        try {
            const u = localStorage.getItem('user');
            if (u) setCurrentUser(JSON.parse(u));
        } catch (e) {}
    }, []);

    const fetchInvoice = async () => {
        if (!searchInvoiceNo) return;
        setSearching(true);
        setErrorMsg('');
        setOriginalInvoice(null);
        setReturnItems([]);

        try {
            const r = await fetch(`/api/sales?invoiceNo=${searchInvoiceNo}`);
            if (r.ok) {
                const invoices = await r.json();
                if (invoices && invoices.length > 0) {
                    const inv = invoices[0];
                    setOriginalInvoice(inv);
                    const items = inv.details.map((d: any) => ({
                        productId: d.productId,
                        productName: d.productName,
                        soldQuantity: d.quantity,
                        returnQuantity: 0,
                        price: d.price,
                        discountRate: d.discountRate
                    }));
                    setReturnItems(items);
                } else setErrorMsg(t('sales.str_1144') || 'رقم الفاتورة غير صحيح');
            } else setErrorMsg(t('sales.str_1145') || 'خطأ في جلب الفاتورة');
        } catch (e) { setErrorMsg('خطأ في الاتصال'); }
        setSearching(false);
    };

    const handleQuantityChange = (productId: number, val: string) => {
        const num = parseFloat(val) || 0;
        setReturnItems(prev => prev.map(item => {
            if (item.productId === productId) {
                const safeNum = Math.max(0, Math.min(num, item.soldQuantity));
                return { ...item, returnQuantity: safeNum };
            }
            return item;
        }));
    };

    const calculateTotals = () => {
        let sub = 0;
        returnItems.forEach(item => {
            if (item.returnQuantity > 0) sub += (item.returnQuantity * item.price * (1 - item.discountRate/100));
        });
        const tax = sub * 0.15;
        return { subtotal: sub, tax, total: sub + tax };
    };

    const currentTotals = calculateTotals();

    const handleSave = async () => {
        const itemsToReturn = returnItems
            .filter(item => item.returnQuantity > 0)
            .map(item => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.returnQuantity,
                price: item.price,
                discountRate: item.discountRate
            }));

        if (itemsToReturn.length === 0) {
            setErrorMsg('يجب تحديد كمية صنف واحد على الأقل للإرجاع');
            return;
        }

        const payload = {
            originalInvoiceId: originalInvoice?.id,
            notes: notes + (currentUser ? ` - مستخدم الإرجاع: ${currentUser.name}` : ''),
            items: itemsToReturn
        };

        setSaving(true);
        try {
            const r = await fetch('/api/sales-returns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (r.ok) {
                alert('تم حفظ المرتجع بنجاح');
                onClose();
            } else {
                const err = await r.json();
                setErrorMsg(err.error || 'فشل حفظ المرتجع');
            }
        } catch (e) { setErrorMsg('فشل الاتصال'); }
        setSaving(false);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999
        }}>
            <div style={{
                background: 'var(--bg-card)', 
                width: '90%', maxWidth: '800px', 
                borderRadius: '12px', padding: '24px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                maxHeight: '90vh', overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                    <h2 style={{ margin: 0 }}>مرتجعات المبيعات</h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text)' }}>&times;</button>
                </div>
                
                {currentUser && <div style={{ marginBottom: '15px', color: 'var(--primary)', fontWeight: 'bold' }}>المستخدم المُسترجِع: {currentUser.name}</div>}

                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                    <input 
                        value={searchInvoiceNo} 
                        onChange={e => setSearchInvoiceNo(e.target.value)} 
                        placeholder="أدخل رقم الفاتورة للبحث..."
                        onKeyDown={e => e.key === 'Enter' && fetchInvoice()}
                        style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '16px' }} 
                    />
                    <button onClick={fetchInvoice} disabled={searching} style={{ padding: '10px 20px', background: 'var(--primary-color, #4F46E5)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                        {searching ? 'جاري البحث...' : 'بحث وجلب'}
                    </button>
                </div>

                {errorMsg && <div style={{ color: '#ef4444', marginBottom: '15px', padding: '10px', background: 'rgba(239,68,68,0.1)', borderRadius: '6px' }}>{errorMsg}</div>}

                {originalInvoice && (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-card-hover)' }}>
                                    <th style={{ padding: '10px', textAlign: 'right' }}>الصنف</th>
                                    <th style={{ padding: '10px', textAlign: 'center' }}>الكمية المُباعة</th>
                                    <th style={{ padding: '10px', textAlign: 'center' }}>الكمية المُسترجعة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {returnItems.map(item => (
                                    <tr key={item.productId} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '10px' }}>{item.productName}</td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>{item.soldQuantity}</td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>
                                            <input 
                                                type="number" min="0" max={item.soldQuantity}
                                                value={item.returnQuantity || ''} 
                                                onChange={e => handleQuantityChange(item.productId, e.target.value)}
                                                style={{ width: '80px', padding: '6px', textAlign: 'center', borderRadius: '4px', border: '1px solid var(--border)' }}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, color: '#ef4444' }}>إجمالي الإرجاع: {currentTotals.total.toLocaleString()} ر.س</h3>
                            </div>
                            <button onClick={handleSave} disabled={saving || currentTotals.total === 0} style={{ padding: '12px 24px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                                {saving ? 'جاري الحفظ...' : 'تأكيد وحفظ المرتجع'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
