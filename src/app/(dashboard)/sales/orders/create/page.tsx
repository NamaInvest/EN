'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from "@/lib/i18n";
import { useSettings } from '@/lib/SettingsContext';
import { useToast } from '@/components/Toast';

export default function CreateSalesOrderPage() {
    const { getSetting } = useSettings();
    const { t } = useTranslation();
    const { error: toastError, success: toastSuccess } = useToast();
    const router = useRouter();
    const [customers, setCustomers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Form fields specific to Sales Orders
    const [form, setForm] = useState({ 
        customerId: '', 
        notes: ''
    });
    
    const [items, setItems] = useState<any[]>([]);
    const isTaxInclusive = getSetting('POS_TAX_INCLUSIVE', 'true') === 'true';
    const taxRate = parseFloat(getSetting('tax_rate', '15')) || 15;

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        try {
            const token = localStorage.getItem('token') || '';
            const [cRes, pRes] = await Promise.all([
                fetch('/api/customers?type=0', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            if (cRes.ok) setCustomers(await cRes.json());
            if (pRes.ok) setProducts(await pRes.json());
        } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
    }

    const addItem = () => setItems([...items, { productId: '', productName: '', quantity: 1, price: 0, total: 0 }]);
    
    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index][field] = value;
        
        if (field === 'productId') {
            const p = products.find(x => x.id.toString() === value.toString());
            if (p) {
                newItems[index].productName = p.name;
                newItems[index].price = p.sellPrice || p.salePrice || 0;
            }
        }
        
        if (field === 'quantity' || field === 'price' || field === 'productId') {
            newItems[index].total = parseFloat(newItems[index].quantity || 0) * parseFloat(newItems[index].price || 0);
        }
        setItems(newItems);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    let subtotal = 0;
    for (const item of items) {
        let p = parseFloat(item.price) || 0;
        if (isTaxInclusive) p = p * 100 / (100 + taxRate);
        subtotal += (parseFloat(item.quantity) || 1) * p;
    }
    
    const taxValue = subtotal * (taxRate / 100);
    const total = subtotal + taxValue;

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0) {
            alert(t('sales.str_2913'));
            return;
        }
        if (!form.customerId) {
            alert(t('sales.str_2914'));
            return;
        }
        
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/sales-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...form, items, subtotal, taxValue, total, isTaxInclusive })
            });
            
            if (res.ok) {
                router.push('/sales/orders');
            } else {
                const errData = await res.json();
                alert(errData.error || t('sales.str_2915'));
            }
        } catch (e) {
            console.error(e);
            alert(t('sales.str_2916'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-content animate-fade-in p-6 max-w-5xl mx-auto" dir="rtl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">{t('sys.str_1377')}</h1>
                <button onClick={() => router.push('/sales/orders')} className="text-gray-400 hover:text-white">{t('sys.str_487')}</button>
            </div>

            <div className="bg-surface border border-divider rounded-xl p-6 shadow-lg">
                <form onSubmit={handleCreate} className="space-y-6">
                    
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="input-group m-0">
                            <label className="text-sm text-gray-400 mb-1 block">{t('sales.str_2900')}</label>
                            <select required className="w-full bg-[#111] border border-gray-700 rounded-lg p-3 text-white" value={form.customerId} onChange={e => setForm({...form, customerId: e.target.value})}>
                                <option value="">{t('sys.str_1811')}</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Items Section */}
                    <div className="mt-8">
                        <h4 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">{t('sales.str_2906')}</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left" dir="rtl">
                                <thead>
                                    <tr className="text-gray-400 text-sm">
                                        <th className="pb-3 text-right">{t('sales.str_2907')}</th>
                                        <th className="pb-3 w-24 text-center">{t('sys.str_64')}</th>
                                        <th className="pb-3 w-32 text-center">{t('sys.str_958')}</th>
                                        <th className="pb-3 w-32 text-center">{t('sys.str_66')}</th>
                                        <th className="pb-3 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, index) => (
                                        <tr key={index} className="border-t border-gray-800">
                                            <td className="py-3">
                                                <select required className="w-full bg-[#111] border border-gray-700 rounded p-2 text-white" value={item.productId} onChange={e => updateItem(index, 'productId', e.target.value)}>
                                                    <option value="">{t('sales.str_2908')}</option>
                                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="py-3 px-2">
                                                <input required type="number" min="1" className="w-full bg-[#111] border border-gray-700 rounded p-2 text-white text-center" value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} />
                                            </td>
                                            <td className="py-3 px-2">
                                                <input required type="number" step="0.01" className="w-full bg-[#111] border border-gray-700 rounded p-2 text-white text-center" value={item.price} onChange={e => updateItem(index, 'price', e.target.value)} />
                                            </td>
                                            <td className="py-3 text-center text-gray-300 font-mono">
                                                {item.total.toLocaleString()}
                                            </td>
                                            <td className="py-3 text-center">
                                                <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-400 text-xl font-bold">×</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button type="button" onClick={addItem} className="mt-4 bg-gray-800 hover:bg-gray-700 text-blue-400 px-4 py-2 rounded-lg text-sm transition">
                            {t('sales.str_2909')}</button>
                    </div>

                    {/* Totals & Submit */}
                    <div className="flex flex-col md:flex-row justify-between items-end mt-8 border-t border-gray-700 pt-6">
                        <div className="w-full md:w-1/2 mb-4 md:mb-0 pr-0 md:pr-4">
                            <label className="text-sm text-gray-400 mb-1 block">{t('sales.str_2910')}</label>
                            <textarea className="w-full bg-[#111] border border-gray-700 rounded-lg p-3 text-white h-24" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder={t('sales.str_2917')}></textarea>
                        </div>
                        
                        <div className="w-full md:w-1/3 bg-[#0a0a0a] border border-gray-800 rounded-xl p-5 space-y-3 shadow-inner">
                            <div className="flex justify-between text-gray-400 text-sm">
                                <span>{t('sys.str_1579')}</span>
                                <span className="font-mono">{subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})} {t('sys.str_68')}</span>
                            </div>
                            <div className="flex justify-between text-red-400/80 text-sm">
                                <span>{t('sales.str_2448')}</span>
                                <span className="font-mono">{taxValue.toLocaleString(undefined, {minimumFractionDigits: 2})} {t('sys.str_68')}</span>
                            </div>
                            <div className="flex justify-between text-emerald-400 text-lg font-bold border-t border-gray-800 pt-3 mt-2">
                                <span>{t('sales.str_2911')}</span>
                                <span className="font-mono">{total.toLocaleString(undefined, {minimumFractionDigits: 2})} {t('sys.str_68')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => router.push('/sales/orders')} className="px-6 py-3 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition">
                            {t('sys.str_487')}</button>
                        <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  type="submit" disabled={loading} className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-500/20 transition disabled:opacity-50">
                            {loading ? t('sys.str_454') : t('sys.str_448')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
