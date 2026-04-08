'use client';
import React, { useState } from 'react';
import { useTranslation } from "@/lib/i18n";
import { X } from 'lucide-react';

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
    details: InvoiceDetail[];
}

interface ReturnItem {
    productId: number;
    productName: string;
    soldQuantity: number;
    returnQuantity: number;
    price: number;
    discountRate: number;
}

export default function PosReturnsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const { t } = useTranslation();
    const [searchInvoiceNo, setSearchInvoiceNo] = useState('');
    const [originalInvoice, setOriginalInvoice] = useState<Invoice | null>(null);
    const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
    const [notes, setNotes] = useState('');
    const [searching, setSearching] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    if (!isOpen) return null;

    const fmt = (n: number) => n.toLocaleString('en-SA', { minimumFractionDigits: 2 });

    const fetchInvoice = async () => {
        if (!searchInvoiceNo) return;
        setSearching(true);
        setErrorMsg('');
        setSuccessMsg('');
        setOriginalInvoice(null);
        setReturnItems([]);

        try {
            const r = await fetch(`/api/sales?invoiceNo=${searchInvoiceNo}`);
            if (r.ok) {
                const invoices = await r.json();
                if (invoices && invoices.length > 0) {
                    const inv = invoices[0];
                    setOriginalInvoice(inv);
                    const items: ReturnItem[] = inv.details.map((d: InvoiceDetail) => ({
                        productId: d.productId,
                        productName: d.productName,
                        soldQuantity: d.quantity,
                        returnQuantity: 0,
                        price: d.price,
                        discountRate: d.discountRate
                    }));
                    setReturnItems(items);
                } else {
                    setErrorMsg(t('sales.str_1144') || 'الفاتورة غير موجودة');
                }
            } else {
                setErrorMsg(t('sales.str_1145') || 'خطأ في جلب الفاتورة');
            }
        } catch (e) {
            console.error(e);
            setErrorMsg(t('sales.str_1146') || 'حدث خطأ بالاتصال');
        }
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
            if (item.returnQuantity > 0) {
                const itemTot = item.returnQuantity * item.price;
                const dVal = itemTot * (item.discountRate / 100);
                sub += (itemTot - dVal);
            }
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
            setErrorMsg(t('sales.str_1147') || 'يجب تحديد كمية صالحة للارجاع');
            return;
        }

        const payload = {
            originalInvoiceId: originalInvoice?.id,
            notes,
            items: itemsToReturn
        };

        try {
            const r = await fetch('/api/sales-returns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (r.ok) {
                setSuccessMsg('✅ تم إنشاء فاتورة الاسترجاع بنجاح');
                setSearchInvoiceNo('');
                setOriginalInvoice(null);
                setReturnItems([]);
                setNotes('');
                setTimeout(() => {
                    setSuccessMsg('');
                    onClose();
                }, 2000);
            } else {
                const err = await r.json();
                setErrorMsg(err.error || t('sales.str_1148'));
            }
        } catch (e) {
            console.error(e);
            setErrorMsg(t('sales.str_1149') || 'فشل في الاتصال وحفظ المرتجع');
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-[9998]" onClick={onClose}></div>
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-[9999] w-[95%] max-w-4xl p-0 overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
                <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <span className="text-red-500">↩</span> {t('sales.str_1128') || 'استرجاع فاتورة (مرتجع)'}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 transition">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1">
                    {successMsg && <div className="mb-6 p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg font-bold">{successMsg}</div>}
                    
                    <div className="flex gap-4 items-end mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 block mb-2">{t('sales.str_1129') || 'رقم الفاتورة الأصلي'}</label>
                            <input 
                                value={searchInvoiceNo} 
                                onChange={e => setSearchInvoiceNo(e.target.value)} 
                                placeholder={t('sales.str_1150') || 'أدخل رقم الفاتورة للبحث'}
                                onKeyDown={e => e.key === 'Enter' && fetchInvoice()}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition" 
                            />
                        </div>
                        <button 
                            className="px-6 py-2.5 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 transition disabled:opacity-50" 
                            onClick={fetchInvoice} 
                            disabled={searching || !searchInvoiceNo}
                        >
                            {searching ? t('sales.str_1151') : t('sales.str_1152') || 'بحث عن الفاتورة'}
                        </button>
                    </div>

                    {errorMsg && <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">{errorMsg}</div>}

                    {originalInvoice && (
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                            <div className="flex justify-between items-center p-4 bg-slate-50 border-b border-slate-200 text-sm">
                                <div><span className="text-slate-500">{t('sales.str_1130')}</span> <strong className="text-slate-800">#{originalInvoice.invoiceNo}</strong></div>
                                <div><span className="text-slate-500">{t('sys.str_113')}</span> <strong className="text-slate-800">{new Date(originalInvoice.date).toLocaleDateString('ar-SA')}</strong></div>
                                <div><span className="text-slate-500">{t('sales.str_1131')}</span> <strong className="text-slate-800">{fmt(originalInvoice.total)} {t('sys.str_68')}</strong></div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="p-3 text-right font-bold text-slate-600">{t('sys.str_63') || 'المنتج'}</th>
                                            <th className="p-3 text-center font-bold text-slate-600">{t('sales.str_1132') || 'الكمية المباعة'}</th>
                                            <th className="p-3 text-center font-bold text-slate-600 w-40">{t('sales.str_1133') || 'كمية الإرجاع'}</th>
                                            <th className="p-3 text-left font-bold text-slate-600">{t('sales.str_1134') || 'إجمالي الخصم (للمرتجع)'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {returnItems.map(item => {
                                            const lineItemTotal = item.returnQuantity * item.price * (1 - item.discountRate/100) * 1.15;
                                            return (
                                                <tr key={item.productId} className="hover:bg-slate-50/50">
                                                    <td className="p-3 font-semibold text-slate-800">{item.productName}</td>
                                                    <td className="p-3 text-center font-mono text-slate-500">{item.soldQuantity}</td>
                                                    <td className="p-3 text-center">
                                                        <input 
                                                            type="number" 
                                                            min="0"
                                                            max={item.soldQuantity}
                                                            value={item.returnQuantity === 0 ? '' : item.returnQuantity} 
                                                            placeholder="0"
                                                            onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                                                            className="w-20 px-3 py-1.5 rounded-md border border-red-200 focus:border-red-500 text-center font-bold outline-none" 
                                                        />
                                                    </td>
                                                    <td className="p-3 text-left font-mono font-bold text-red-500">
                                                        {lineItemTotal > 0 ? `-${fmt(lineItemTotal)}` : '0.00'}
                                                    </td>
                                                </tr>
                                        )})}
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex-1 w-full relative">
                                    <label className="text-xs font-bold text-slate-500 block mb-1">{t('sales.str_1135') || 'ملاحظات وتسبب الارجاع (اختياري)'}</label>
                                    <input 
                                        value={notes} 
                                        onChange={e => setNotes(e.target.value)} 
                                        placeholder={t('sales.str_1153') || 'اكتب أي ملاحظات هنا..'}
                                        className="w-full max-w-sm px-4 py-2 rounded-lg border border-slate-200 focus:border-red-500 outline-none" 
                                    />
                                </div>
                                <div className="text-left bg-white p-3 rounded-lg border border-slate-200 min-w-[200px]">
                                    <div className="text-xs text-slate-500 flex justify-between mb-1">
                                        <span>{t('sales.str_1136') || 'المجموع الفرعي:'}</span>
                                        <span className="font-mono">{fmt(currentTotals.subtotal)}</span>
                                    </div>
                                    <div className="text-xs text-slate-500 flex justify-between mb-2">
                                        <span>{t('sales.str_1137') || 'الضريبة (15%):'}</span>
                                        <span className="font-mono">{fmt(currentTotals.tax)}</span>
                                    </div>
                                    <div className="text-base text-red-600 font-bold flex justify-between border-t border-slate-100 pt-2 mt-1">
                                        <span>{t('sales.str_1138') || 'قيمة المرتجع:'}</span>
                                        <span className="font-mono">{fmt(currentTotals.total)} {t('sys.str_68') || 'ر.س'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3">
                    <button 
                        className="px-6 py-2.5 font-bold rounded-lg text-slate-600 hover:bg-slate-100 transition" 
                        onClick={onClose}
                    >
                        إلغاء
                    </button>
                    {originalInvoice && (
                        <button 
                            className="px-8 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition shadow-sm shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed" 
                            onClick={handleSave}
                            disabled={currentTotals.total === 0}
                        >
                            {t('sales.str_1139') || 'اعتماد وترجيع المبلغ'}
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
