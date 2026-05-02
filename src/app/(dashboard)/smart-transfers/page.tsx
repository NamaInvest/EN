'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Truck, PackageCheck, Send, ArrowRightLeft, RefreshCw, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function SmartTransfersPage() {
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

    const { t, lang } = useTranslation();
    const { error: toastError, success: toastSuccess } = useToast();
    const isRTL = lang === 'ar';

    const [activeTab, setActiveTab] = useState<'dispatch' | 'track'>('dispatch');
    const [products, setProducts] = useState<any[]>([]);
    const [stocks, setStocks] = useState<any[]>([]);
    const [activeTransits, setActiveTransits] = useState<any[]>([]);
    const [completedTransits, setCompletedTransits] = useState<any[]>([]);
    
    // Form state
    const [selectedProduct, setSelectedProduct] = useState('');
    const [senderStock, setSenderStock] = useState('');
    const [receiverStock, setReceiverStock] = useState('');
    const [quantity, setQuantity] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchResources();
        fetchTransits();
        
        // Auto-Refresh for real-time tracking (every 10 seconds)
        const interval = setInterval(() => {
            if (activeTab === 'track') {
                fetchTransits();
            }
        }, 10000);
        
        return () => clearInterval(interval);
    }, [activeTab]);

    const fetchResources = async () => {
        try {
            const [pRes, sRes] = await Promise.all([
                fetch('/api/products?limit=5000'), // Quick pull
                fetch('/api/warehouses')
            ]);
            const pData = await pRes.json();
            const sData = await sRes.json();
            
            // Map properly handles both raw arrays or {products: []} structures seamlessly.
            setProducts(pData.products || pData || []);
            setStocks(sData.stocks || sData || []);
        } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
    };

    const fetchTransits = async () => {
        try {
            const res = await fetch('/api/smart-transfers');
            const data = await res.json();
            setActiveTransits(data.activeTransits || []);
            setCompletedTransits(data.completedTransits || []);
        } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
    };

    const handleDispatch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (senderStock === receiverStock) return alert(t('sys.str_1435'));

        setLoading(true);
        try {
            const res = await fetch('/api/smart-transfers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: selectedProduct,
                    senderStockId: senderStock,
                    receiverStockId: receiverStock,
                    quantity: Number(quantity)
                })
            });
            const data = await res.json();
            if (data.success) {
                alert(data.message);
                // Reset fields
                setSelectedProduct('');
                setSenderStock('');
                setReceiverStock('');
                setQuantity('');
                fetchTransits();
                setActiveTab('track'); // Switch to tracking
            } else {
                alert(data.error || t('sys.str_1436'));
            }
        } catch (e) {
            alert(t('sys.str_1437'));
        } finally {
            setLoading(false);
        }
    };

    const handleReceive = async (movementId: number) => {
        if (!confirm(t('sys.str_1438'))) return;

        setLoading(true);
        try {
            const res = await fetch('/api/smart-transfers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ movementId })
            });
            const data = await res.json();
            if (data.success) {
                alert(data.message);
                fetchTransits();
            } else {
                alert(data.error);
            }
        } catch (e) {
            alert(t('sys.str_1437'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-transparent min-h-screen">
            <div className="p-6 max-w-6xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
                
                <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
                    <Truck className="text-blue-500" size={32} />
                    {t('sys.str_1413')}</h1>

                {/* TABS */}
                <div className="flex border-b border-divider mb-8">
                    <button 
                        onClick={() => setActiveTab('dispatch')}
                        className={`px-6 py-3 font-semibold text-lg flex items-center gap-2 border-b-2 transition ${activeTab === 'dispatch' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500'}`}
                    >
                        <Send size={20} /> {t('sys.str_1414')}</button>
                    <button 
                        onClick={() => setActiveTab('track')}
                        className={`px-6 py-3 font-semibold text-lg flex items-center gap-2 border-b-2 transition ${activeTab === 'track' ? 'border-orange-500 text-orange-400' : 'border-transparent text-gray-500'}`}
                    >
                        <ArrowRightLeft size={20} /> {t('sys.str_1415')}{activeTransits.length > 0 && (
                            <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">{activeTransits.length}</span>
                        )}
                    </button>
                </div>

                {/* DISPATCH VIEW */}
                {activeTab === 'dispatch' && (
                    <div className="bg-surface border border-divider rounded-2xl p-8 shadow-sm">
                        <div className="mb-6 bg-blue-500/10 border border-blue-500/20 text-blue-400 p-4 rounded-xl flex items-center gap-3">
                            <AlertTriangle />
                            <p>{t('sys.str_1416')}<b>{t('sys.str_1417')}</b> {t('sys.str_1418')}</p>
                        </div>
                        
                        <form onSubmit={handleDispatch} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-gray-300 font-bold mb-2">{t('sys.str_1419')}</label>
                                    <select 
                                        required
                                        value={selectedProduct} 
                                        onChange={e => setSelectedProduct(e.target.value)}
                                        className="w-full bg-[#111] border border-divider text-white p-3 rounded-xl outline-none focus:border-blue-500"
                                    >
                                        <option value="">{t('sys.str_439')}</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-300 font-bold mb-2">{t('sys.str_1420')}</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        required
                                        value={quantity}
                                        onChange={e => setQuantity(e.target.value)}
                                        placeholder={t('sys.str_1439')}
                                        className="w-full bg-[#111] border border-divider text-white p-3 rounded-xl outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div className="p-4 bg-black/20 rounded-xl border border-dashed border-gray-600">
                                    <label className="block text-gray-400 font-bold mb-2 text-sm">{t('sys.str_1421')}</label>
                                    <select 
                                        required
                                        value={senderStock} 
                                        onChange={e => setSenderStock(e.target.value)}
                                        className="w-full bg-transparent text-white p-2 border-b border-gray-700 outline-none focus:border-blue-500"
                                    >
                                        <option value="" className="bg-[#111]">{t('sys.str_1422')}</option>
                                        {stocks.map(s => (
                                            <option key={s.id} value={s.id} className="bg-[#111]">
                                                {s.branch?.name ? `${s.branch.name} - ${s.name}` : s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="p-4 bg-black/20 rounded-xl border border-dashed border-gray-600">
                                    <label className="block text-orange-400 font-bold mb-2 text-sm">{t('sys.str_1423')}</label>
                                    <select 
                                        required
                                        value={receiverStock} 
                                        onChange={e => setReceiverStock(e.target.value)}
                                        className="w-full bg-transparent text-white p-2 border-b border-gray-700 outline-none focus:border-orange-500"
                                    >
                                        <option value="" className="bg-[#111]">{t('sys.str_1424')}</option>
                                        {stocks.map(s => (
                                            <option key={s.id} value={s.id} className="bg-[#111]">
                                                {s.branch?.name ? `${s.branch.name} - ${s.name}` : s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="flex justify-end pt-4">
                                <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  
                                    type="submit"
                                    disabled={loading}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                                >
                                    <Truck size={20} />
                                    {loading ? t('sys.str_1440') : t('sys.str_1441')}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* TRACKING VIEW */}
                {activeTab === 'track' && (
                    <div className="space-y-6">
                        <div className="bg-surface rounded-2xl border border-orange-500/30 overflow-hidden shadow-lg shadow-orange-500/5">
                            <div className="p-4 bg-orange-500/10 border-b border-orange-500/20 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-orange-400 flex items-center gap-2"><Truck /> {t('sys.str_1425')}</h2>
                                <button onClick={fetchTransits} className="text-orange-300 hover:text-white"><RefreshCw size={20} /></button>
                            </div>
                            
                            <div className="p-0 overflow-x-auto">
                                <table className="w-full text-left" dir={isRTL ? 'rtl':'ltr'}>
                                    <thead className="bg-[#111]">
                                        <tr>
                                            <th className="p-4 font-medium text-gray-400">{t('sys.str_1426')}</th>
                                            <th className="p-4 font-medium text-gray-400">{t('sys.str_63')}</th>
                                            <th className="p-4 font-medium text-gray-400">{t('sys.str_64')}</th>
                                            <th className="p-4 font-medium text-gray-400">{t('sys.str_1427')}</th>
                                            <th className="p-4 font-medium text-gray-400">{t('sys.str_1428')}</th>
                                            <th className="p-4 font-medium text-gray-400">{t('fin.str_232')}</th>
                                            <th className="p-4 font-medium text-gray-400">{t('sys.str_1429')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeTransits.map(tr => (
                                            <tr key={tr.id} className="border-t border-divider hover:bg-white/5 transition">
                                                <td className="p-4 font-mono text-orange-300 font-bold">{tr.reference}</td>
                                                <td className="p-4 text-white font-bold">{tr.productName}</td>
                                                <td className="p-4 text-xl font-bold">{tr.quantity} {t('sys.str_813')}</td>
                                                <td className="p-4 text-gray-400">{tr.senderStock}<br/><span className="text-xs">{t('sys.str_1430')}{tr.senderName}</span></td>
                                                <td className="p-4 text-orange-400 font-bold border-l-2 border-r-2 border-dashed border-orange-500/30">{tr.receiverStock}</td>
                                                <td className="p-4 text-sm text-gray-400">{new Date(tr.date).toLocaleDateString('en-GB')}</td>
                                                <td className="p-4">
                                                    <button 
                                                        disabled={loading}
                                                        onClick={() => handleReceive(tr.id)}
                                                        className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md flex items-center gap-1"
                                                    >
                                                        <PackageCheck size={16} /> {t('sys.str_1431')}</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {activeTransits.length === 0 && (
                                            <tr><td colSpan={7} className="p-8 text-center text-gray-500">{t('sys.str_1432')}</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* COMPLETED */}
                        <div className="bg-surface rounded-2xl border border-divider overflow-hidden opacity-80">
                            <div className="p-4 bg-[#111] border-b border-divider">
                                <h2 className="text-lg font-bold text-gray-400 flex items-center gap-2"><PackageCheck /> {t('sys.str_1433')}</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left" dir={isRTL ? 'rtl':'ltr'}>
                                    <tbody>
                                        {completedTransits.map(tr => (
                                            <tr key={tr.id} className="border-b border-divider/50">
                                                <td className="p-4 text-green-400 font-mono text-sm">{tr.reference}</td>
                                                <td className="p-4">{tr.productName} ({tr.quantity})</td>
                                                <td className="p-4 text-gray-400">{tr.senderStock} ➔ {tr.receiverStock}</td>
                                                <td className="p-4 text-green-500 text-sm">{t('sys.str_1434')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
