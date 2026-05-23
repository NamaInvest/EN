'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';
const _t = (ar: string, en: string) => ar; // i18n helper

interface InvoiceDetail {
    productId: number;
    productName: string;
    quantity: number; 
    price: number;
    discountRate: number;
    discountValue: number;
    taxRate: number;
    taxValue: number;
    total: number;
}

interface Invoice {
    id: number;
    invoiceNo: number;
    date: string;
    subtotal: number;
    total: number;
    customer?: {
        id: number;
        taxNumber?: string | null;
        crNo?: string | null;
    } | null;
    details: InvoiceDetail[];
}

interface DebitItem {
    productId: number;
    productName: string;
    quantity: number;
    debitQuantity: number;
    price: number;
    discountRate: number;
}

export default function DebitNotesPage() {
    const { t } = useTranslation();
    const { error: toastError, success: toastSuccess } = useToast();
    const [debitNotes, setDebitNotes] = useState<any[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [loading, setLoading] = useState(true);

    const [searchInvoiceNo, setSearchInvoiceNo] = useState('');
    const [originalInvoice, setOriginalInvoice] = useState<Invoice | null>(null);
    const [debitItems, setDebitItems] = useState<DebitItem[]>([]);
    const [notes, setNotes] = useState('');
    const [searching, setSearching] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => { load(); }, []);

    async function load() {
        setLoading(true);
        try {
            // Load debit notes (sales invoices where docType is debit)
            const r = await fetch('/api/sales');
            if (r.ok) {
                const data = await r.json();
                setDebitNotes(data.filter((inv: any) => inv.docType === 'standard_debit' || inv.docType === 'simplified_debit'));
            }
        } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
        setLoading(false);
    }

    const fmt = (n: number) => n.toLocaleString('en-SA', { minimumFractionDigits: 2 });

    const fetchInvoice = async () => {
        if (!searchInvoiceNo) return;
        setSearching(true);
        setErrorMsg('');
        setOriginalInvoice(null);
        setDebitItems([]);

        try {
            const r = await fetch(`/api/sales?invoiceNo=${searchInvoiceNo}`);
            if (r.ok) {
                const invoices = await r.json();
                if (invoices && invoices.length > 0) {
                    const inv = invoices[0];
                    setOriginalInvoice(inv);
                    
                    const items: DebitItem[] = inv.details.map((d: InvoiceDetail) => ({
                        productId: d.productId,
                        productName: d.productName,
                        quantity: d.quantity,
                        debitQuantity: 0,
                        price: d.price,
                        discountRate: d.discountRate
                    }));
                    setDebitItems(items);
                } else {
                    setErrorMsg('لم يتم العثور على الفاتورة');
                }
            } else {
                setErrorMsg('خطأ في جلب الفاتورة');
            }
        } catch (e) {
            console.error(e);
            setErrorMsg('فشل الاتصال بالخادم');
        }
        setSearching(false);
    };

    const handleQuantityChange = (productId: number, val: string) => {
        const num = parseFloat(val) || 0;
        setDebitItems(prev => prev.map(item => {
            if (item.productId === productId) {
                return { ...item, debitQuantity: Math.max(0, num) };
            }
            return item;
        }));
    };

    const calculateTotals = () => {
        let sub = 0;
        debitItems.forEach(item => {
            if (item.debitQuantity > 0) {
                const itemTot = item.debitQuantity * item.price;
                const dVal = itemTot * (item.discountRate / 100);
                sub += (itemTot - dVal);
            }
        });
        const tax = sub * 0.15;
        return { subtotal: sub, tax, total: sub + tax };
    };

    const currentTotals = calculateTotals();

    const handleSave = async () => {
        const itemsToDebit = debitItems
            .filter(item => item.debitQuantity > 0)
            .map(item => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.debitQuantity,
                price: item.price,
                discountRate: item.discountRate
            }));

        if (itemsToDebit.length === 0) {
            setErrorMsg('يجب إضافة عناصر للإشعار المدين');
            return;
        }

        const isStandard = !!originalInvoice?.customer?.taxNumber;
        const payload = {
            originalInvoiceId: originalInvoice?.id,
            customerId: originalInvoice?.customer?.id,
            notes,
            docType: isStandard ? 'standard_debit' : 'simplified_debit',
            items: itemsToDebit
        };

        try {
            const r = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (r.ok) {
                toastSuccess('تم إصدار الإشعار المدين بنجاح');
                setShowAdd(false);
                setSearchInvoiceNo('');
                setOriginalInvoice(null);
                setDebitItems([]);
                setNotes('');
                load();
            } else {
                const err = await r.json();
                setErrorMsg(err.error || 'فشل الحفظ');
            }
        } catch (e) {
            console.error(e);
            setErrorMsg('فشل الاتصال بالخادم');
        }
    };

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">{_t('الإشعارات المدينة (مدين ملاحظات)', 'الإشعارات المدينة (Debit Notes)')}</h1>
            </div>
            <div className="page-content animate-fade-in">
                <div className="toolbar">
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{debitNotes.length} إشعار مدين</span>
                    <div className="toolbar-spacer" />
                    {!showAdd && <button className="btn btn-primary" onClick={() => setShowAdd(true)}>إصدار إشعار مدين جديد</button>}
                </div>

                {showAdd && (
                    <div className="card" style={{ marginBottom: '16px', padding: '16px' }}>
                        <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>إصدار إشعار مدين</h3>
                        
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', marginBottom: '20px' }}>
                            <div>
                                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>رقم الفاتورة الأصلية</label>
                                <input 
                                    value={searchInvoiceNo} 
                                    onChange={e => setSearchInvoiceNo(e.target.value)} 
                                    placeholder="بحث برقم الفاتورة..."
                                    onKeyDown={e => e.key === 'Enter' && fetchInvoice()}
                                    style={{ width: '200px', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)' }} 
                                />
                            </div>
                            <button className="btn btn-primary" onClick={fetchInvoice} disabled={searching || !searchInvoiceNo}>
                                {searching ? 'جاري البحث...' : 'بحث'}
                            </button>
                            <button className="btn btn-ghost" onClick={() => { setShowAdd(false); setOriginalInvoice(null); setErrorMsg(''); }}>{t('fin.str_206')}</button>
                        </div>

                        {errorMsg && <div style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '16px', padding: '8px', background: 'rgba(239,68,68,0.1)', borderRadius: '6px' }}>{errorMsg}</div>}

                        {originalInvoice && (
                            <div style={{ background: 'var(--bg-card-hover)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '13px' }}>
                                    <div><strong>فاتورة أصلية</strong> #{originalInvoice.invoiceNo}</div>
                                    <div><strong>{t('sys.str_113')}</strong> {new Date(originalInvoice.date).toLocaleDateString('en-GB')}</div>
                                    <div><strong>{t('sales.str_1131')}</strong> {fmt(originalInvoice.total)} {t('sys.str_68')}</div>
                                </div>

                                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--bg-card)' }}>
                                            <th style={{ padding: '8px', textAlign: 'right', fontSize: '12px' }}>{t('sys.str_63')}</th>
                                            <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px' }}>الكمية الأصلية</th>
                                            <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', width: '150px' }}>الكمية الإضافية (للإشعار)</th>
                                            <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px' }}>إجمالي الإشعار</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {debitItems.map(item => {
                                            const lineItemTotal = item.debitQuantity * item.price * (1 - item.discountRate/100) * 1.15;
                                            return (
                                                <tr key={item.productId} style={{ borderBottom: '1px solid var(--border)' }}>
                                                    <td style={{ padding: '8px', fontSize: '13px', fontWeight: 'bold' }}>{item.productName}</td>
                                                    <td style={{ padding: '8px', textAlign: 'center', fontFamily: 'monospace' }}>{item.quantity}</td>
                                                    <td style={{ padding: '8px', textAlign: 'center' }}>
                                                        <input 
                                                            type="number" 
                                                            min="0"
                                                            value={item.debitQuantity === 0 ? '' : item.debitQuantity} 
                                                            placeholder="0"
                                                            onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                                                            style={{ width: '80px', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--primary)', textAlign: 'center', fontWeight: 'bold' }} 
                                                        />
                                                    </td>
                                                    <td style={{ padding: '8px', textAlign: 'left', fontFamily: 'monospace', color: 'var(--primary)' }}>
                                                        {lineItemTotal > 0 ? `+${fmt(lineItemTotal)}` : '0.00'}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>

                                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                        <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>السبب / ملاحظات (ZATCA)</label>
                                        <input 
                                            value={notes} 
                                            onChange={e => setNotes(e.target.value)} 
                                            placeholder="أدخل سبب إصدار الإشعار المدين..."
                                            style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }} 
                                        />
                                    </div>
                                    <div style={{ textAlign: 'right', minWidth: '200px', background: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>إجمالي الإشعار (بدون ضريبة): {fmt(currentTotals.subtotal)}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>الضريبة (15%): {fmt(currentTotals.tax)}</div>
                                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>المبلغ الإضافي المطلوب (ZATCA Legal)</div>
                                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--primary)' }}>{fmt(currentTotals.total)} {t('sys.str_68')}</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div style={{ marginTop: '16px', textAlign: 'left' }}>
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={handleSave}
                                        disabled={currentTotals.total === 0}
                                        style={{ background: 'var(--primary)', color: 'white', border: 'none' }}
                                    >
                                        حفظ وإصدار الإشعار المدين
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="card">
                    {loading ? <div className="empty-state"><div className="empty-state-text">{t('sys.str_168')}</div></div> :
                        debitNotes.length === 0 ? <div className="empty-state"><div className="empty-state-icon">📄</div><div className="empty-state-text">لا توجد إشعارات مدينة</div></div> :
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(108,99,255,0.05)' }}>
                                        <th style={{ padding: '8px', textAlign: 'right' }}>رقم الإشعار (فاتورة)</th>
                                        <th style={{ padding: '8px', textAlign: 'right' }}>{t('fin.str_232')}</th>
                                        <th style={{ padding: '8px', textAlign: 'right' }}>الفاتورة الأصلية</th>
                                        <th style={{ padding: '8px', textAlign: 'right' }}>النوع</th>
                                        <th style={{ padding: '8px', textAlign: 'right' }}>{t('sys.str_463')}</th>
                                        <th style={{ padding: '8px', textAlign: 'right' }}>{t('sys.str_946')}</th>
                                        <th style={{ padding: '8px', textAlign: 'right' }}>إجمالي الإشعار</th>
                                        <th style={{ padding: '8px', textAlign: 'right' }}>السبب</th>
                                        <th style={{ padding: '8px', textAlign: 'right' }}>{_t('زاتكا', 'ZATCA')}</th>
                                    </tr>
                                </thead>
                                <tbody>{debitNotes.map(r => (
                                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '8px', fontFamily: 'monospace', fontWeight: 'bold' }}>#{r.invoiceNo}</td>
                                        <td style={{ padding: '8px', fontSize: '12px' }}>{new Date(r.date).toLocaleDateString('en-GB')}</td>
                                        <td style={{ padding: '8px', fontFamily: 'monospace', color: 'var(--primary)' }}>
                                            {r.originalInvoiceId ? `#INV-${r.originalInvoiceId}` : 'غير مرتبط'}
                                        </td>
                                        <td style={{ padding: '8px', fontSize: '12px' }}>
                                            {r.docType === 'standard_debit' ? <span className="badge badge-primary">قياسي</span> : <span className="badge badge-success">مبسط</span>}
                                        </td>
                                        <td style={{ padding: '8px', fontFamily: 'monospace' }}>{fmt(r.subtotal)}</td>
                                        <td style={{ padding: '8px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{fmt(r.taxValue)}</td>
                                        <td style={{ padding: '8px', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--primary)' }}>+{fmt(r.total)}</td>
                                        <td style={{ padding: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>{r.notes || '-'}</td>
                                        <td style={{ padding: '8px', fontSize: '12px' }}>
                                            {r.zatcaStatus === 'reported' || r.zatcaStatus === 'cleared' ? 
                                                <span className="badge" style={{background: 'var(--success)', color: '#fff'}}>✔ ZATCA</span> : 
                                                <span className="badge badge-ghost">{_t('قيد الانتظار', 'Pending')}</span>}
                                        </td>
                                    </tr>
                                ))}</tbody>
                            </table>}
                </div>
            </div>
        </>
    );
}
