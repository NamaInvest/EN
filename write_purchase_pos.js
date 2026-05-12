const fs = require('fs');
const content = `'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';
import { ShoppingCart, Search, User, CreditCard, Banknote, Save, ArrowRight, Trash2, Printer, Clock, History, CheckCircle2, QrCode, Bell, Plus, Minus, X as XIcon, Package, LayoutDashboard, RefreshCcw } from 'lucide-react';

export default function PurchaseOrdersPOS() {
    const { t, lang } = useTranslation();
    const { error: toastError, success: toastSuccess } = useToast();
    const router = useRouter();

    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [activeCategory, setActiveCategory] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState<any[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Supplier State
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
    const [supplierSearch, setSupplierSearch] = useState('');

    // Split Payment State
    const [showSplitModal, setShowSplitModal] = useState(false);
    const [splitCash, setSplitCash] = useState('');
    const [splitCard, setSplitCard] = useState('');

    // History State
    const [orders, setOrders] = useState<any[]>([]);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);

    const taxRate = 15;

    useEffect(() => {
        fetchProducts();
        fetchSuppliers();
        loadOrders();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/pos/products');
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
                const uniqueCats = Array.from(new Set(data.map((p: any) => p.category?.name).filter(Boolean)));
                setCategories(uniqueCats.map((name, i) => ({ id: i + 1, name })));
            }
        } catch (e) {
            toastError('فشل جلب المنتجات');
        }
    };

    const fetchSuppliers = async () => {
        try {
            const res = await fetch('/api/customers?type=1');
            if (res.ok) {
                setSuppliers(await res.json());
            }
        } catch (e) { }
    };

    const loadOrders = async () => {
        setHistoryLoading(true);
        try {
            const r = await fetch('/api/purchase-orders');
            if (r.ok) {
                const json = await r.json();
                setOrders(Array.isArray(json) ? json : (json.data || []));
            }
        } catch (e) { }
        setHistoryLoading(false);
    };

    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === product.id);
            if (existing) {
                return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, { ...product, qty: 1 }];
        });
    };

    const updateQty = (id: number, delta: number) => {
        setCart(prev => prev.map(i => {
            if (i.id === id) {
                const newQty = Math.max(1, i.qty + delta);
                return { ...i, qty: newQty };
            }
            return i;
        }));
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const tax = subtotal * (taxRate / 100);
    const finalTotal = subtotal + tax;

    const handleCheckout = async (paymentMethod: string) => {
        if (!selectedSupplier) {
            toastError('يرجى اختيار المورد أولاً');
            setShowSupplierModal(true);
            return;
        }

        setIsProcessing(true);
        try {
            const token = localStorage.getItem('token') || '';
            const orderData = {
                supplierId: selectedSupplier.id,
                notes: \`دفع: \${paymentMethod}\`,
                items: cart.map(item => ({
                    productId: item.id.toString(),
                    productName: item.name,
                    quantity: item.qty,
                    price: item.price
                }))
            };

            const res = await fetch('/api/purchase-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
                body: JSON.stringify(orderData)
            });

            if (res.ok) {
                toastSuccess('تم إنشاء أمر الشراء بنجاح');
                setCart([]);
                setSelectedSupplier(null);
                setShowSplitModal(false);
                loadOrders();
            } else {
                toastError('فشل إنشاء أمر الشراء');
            }
        } catch (e) {
            toastError('حدث خطأ');
        }
        setIsProcessing(false);
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-slate-50 dark:bg-[#020617] overflow-hidden font-sans" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {/* Sidebar / Categories */}
            <div className="w-24 bg-white dark:bg-[#0f172a] border-l border-slate-200 dark:border-slate-800 flex flex-col items-center py-4 gap-4 z-10 shadow-sm shrink-0">
                <button onClick={() => { setActiveCategory(null); }} className={\`w-16 h-16 rounded-xl flex items-center justify-center text-xs font-bold text-center p-1 transition-colors \${!activeCategory ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-400'}\`}>
                    الكل
                </button>
                {categories.map(cat => (
                    <button key={cat.id} onClick={() => { setActiveCategory(cat.id); }} className={\`w-16 h-16 rounded-xl flex items-center justify-center text-xs font-bold text-center p-1 transition-colors \${activeCategory === cat.id ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-400'}\`}>
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Top Header */}
                <div className="h-20 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-10">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative w-full max-w-md">
                            <Search className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="ابحث عن منتج..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl py-3 pr-12 pl-4 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowHistoryModal(true)} className="px-4 py-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors border border-indigo-200 dark:border-indigo-800/30">
                            <History className="w-5 h-5" /> سجل المشتريات
                        </button>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-[#020617] custom-scrollbar pb-32">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-20">
                        {products.filter(p => (!activeCategory || p.category?.name === categories.find(c => c.id === activeCategory)?.name) && p.name.includes(searchQuery)).map(p => (
                            <button key={p.id} onClick={() => addToCart(p)} className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-col items-center text-center shadow-sm hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 transition-all active:scale-95 group overflow-hidden relative">
                                <div className="w-full h-32 bg-slate-100 dark:bg-slate-900 rounded-xl mb-3 overflow-hidden flex items-center justify-center">
                                    {p.imageUrl || p.image ? (
                                        <img src={p.imageUrl || p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <Package className="w-10 h-10 text-slate-300 group-hover:scale-110 transition-transform duration-300" />
                                    )}
                                </div>
                                <h4 className="font-bold text-slate-800 dark:text-white text-sm line-clamp-2 h-10 mb-1">{p.name}</h4>
                                <span className="text-indigo-600 dark:text-indigo-400 font-black font-[Fira_Code] text-lg mt-auto">{p.price} <span className="text-[10px]">SAR</span></span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Cart Panel */}
            <div className="w-full lg:w-[420px] bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col shrink-0 z-20">
                {/* Supplier Info */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col gap-3">
                    <button onClick={() => setShowSupplierModal(true)} className={\`w-full py-3 px-4 rounded-xl flex items-center justify-between font-bold text-sm border transition-colors \${selectedSupplier ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}\`}>
                        <div className="flex items-center gap-2"><User className="w-5 h-5" /> {selectedSupplier ? selectedSupplier.name : 'اختيار المورد'}</div>
                        {selectedSupplier && <span onClick={(e) => { e.stopPropagation(); setSelectedSupplier(null); }} className="text-red-500 p-1 hover:bg-red-100 rounded-md"><XIcon className="w-4 h-4" /></span>}
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                            <ShoppingCart className="w-20 h-20 mb-4" />
                            <p className="font-bold text-lg">أمر الشراء فارغ</p>
                        </div>
                    ) : (
                        cart.map((item: any) => (
                            <div key={item.id} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-2 relative group">
                                <div className="flex justify-between pr-2">
                                    <h4 className="font-bold text-sm text-slate-800 dark:text-white line-clamp-1">{item.name}</h4>
                                    <span className="font-black text-indigo-600 dark:text-indigo-400 font-[Fira_Code]">{(item.price * item.qty).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-1">
                                        <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-600"><Minus className="w-4 h-4" /></button>
                                        <span className="w-8 text-center font-bold text-sm">{item.qty}</span>
                                        <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-600"><Plus className="w-4 h-4" /></button>
                                    </div>
                                    <button onClick={() => setCart((prev: any) => prev.filter((i: any) => i.id !== item.id))} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Totals & Actions */}
                <div className="bg-white dark:bg-[#0f172a] border-t border-slate-200 dark:border-slate-800 p-4 shrink-0">
                    <div className="space-y-1 mb-4">
                        <div className="flex justify-between text-sm font-bold text-slate-500"><span>المجموع</span><span className="font-[Fira_Code]">{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                        <div className="flex justify-between text-sm font-bold text-slate-500"><span>الضريبة ({taxRate}%)</span><span className="font-[Fira_Code]">{tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                        <div className="flex justify-between text-xl font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                            <span>الإجمالي</span><span className="font-[Fira_Code] text-indigo-600 dark:text-indigo-400">{finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <button onClick={() => handleCheckout('CARD')} disabled={cart.length === 0 || isProcessing} className="py-3 bg-cyan-100 text-cyan-700 rounded-xl font-bold flex flex-col items-center gap-1 hover:bg-cyan-200 disabled:opacity-50"><CreditCard className="w-5 h-5" /><span className="text-[10px]">شبكة / تحويل</span></button>
                        <button onClick={() => setShowSplitModal(true)} disabled={cart.length === 0 || isProcessing} className="py-3 bg-purple-100 text-purple-700 rounded-xl font-bold flex flex-col items-center gap-1 hover:bg-purple-200 disabled:opacity-50"><LayoutDashboard className="w-5 h-5" /><span className="text-[10px]">مجزأ</span></button>
                    </div>
                    <button onClick={() => handleCheckout('CASH')} disabled={cart.length === 0 || isProcessing} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95">
                        <Save className="w-6 h-6" /> حفظ أمر الشراء (كاش)
                    </button>
                </div>
            </div>

            {/* MODALS */}
            {/* Supplier Modal */}
            {showSupplierModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowSupplierModal(false)}>
                    <div className="bg-white dark:bg-[#0F172A] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                            <h3 className="font-bold text-xl flex items-center gap-2 text-slate-800 dark:text-white"><User className="text-indigo-500" /> اختيار المورد</h3>
                            <button onClick={() => setShowSupplierModal(false)} className="p-2 bg-white dark:bg-slate-800 rounded-full hover:bg-slate-100"><XIcon size={16} /></button>
                        </div>
                        <div className="p-6">
                            <input type="text" placeholder="البحث باسم المورد..." className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl mb-4 font-bold" value={supplierSearch} onChange={e => setSupplierSearch(e.target.value)} />
                            <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar">
                                {suppliers.filter((s: any) => s.name.includes(supplierSearch)).map((s: any) => (
                                    <div key={s.id} onClick={() => { setSelectedSupplier(s); setShowSupplierModal(false); }} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer flex justify-between font-bold transition-colors">
                                        <span className="text-slate-800 dark:text-white">{s.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Split Modal */}
            {showSplitModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowSplitModal(false)}>
                    <div className="bg-white dark:bg-[#0F172A] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-xl mb-4 text-center text-slate-800 dark:text-white">دفع مجزأ</h3>
                        <div className="text-center text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-6 font-[Fira_Code]">{finalTotal.toLocaleString()} SAR</div>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-2">كاش</label>
                                <input type="number" className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl font-black text-xl text-center" value={splitCash} onChange={e => { const val = Number(e.target.value); setSplitCash(e.target.value); setSplitCard(val < finalTotal ? (finalTotal - val).toFixed(2) : '0'); }} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-2">بطاقة/تحويل</label>
                                <input type="number" disabled className="w-full p-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-xl text-center text-slate-400" value={splitCard} />
                            </div>
                        </div>
                        <button onClick={() => { setShowSplitModal(false); handleCheckout('SPLIT'); }} disabled={((Number(splitCash) || 0) + (Number(splitCard) || 0)) < (finalTotal - 0.01) || isProcessing} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg disabled:opacity-50 transition-colors shadow-lg shadow-indigo-500/30">حفظ الأمر</button>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowHistoryModal(false)}>
                    <div className="bg-white dark:bg-[#0F172A] rounded-3xl w-full max-w-4xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 shrink-0">
                            <h3 className="font-bold text-xl flex items-center gap-2 text-slate-800 dark:text-white"><History className="text-indigo-500" /> سجل أوامر الشراء</h3>
                            <button onClick={() => setShowHistoryModal(false)} className="p-2 bg-white dark:bg-slate-800 rounded-full hover:bg-slate-100"><XIcon size={16} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <table className="w-full text-right text-sm">
                                <thead className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th className="pb-3 font-bold">رقم الأمر</th>
                                        <th className="pb-3 font-bold">المورد</th>
                                        <th className="pb-3 font-bold">التاريخ</th>
                                        <th className="pb-3 font-bold">الحالة</th>
                                        <th className="pb-3 font-bold">الإجمالي</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {orders.slice(0, 15).map(o => (
                                        <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                            <td className="py-3 font-bold text-slate-900 dark:text-white">#{o.orderNo}</td>
                                            <td className="py-3 text-slate-700 dark:text-slate-300">{o.supplier?.name || '--'}</td>
                                            <td className="py-3 font-[Fira_Code] text-slate-700 dark:text-slate-300">{new Date(o.date).toLocaleDateString('en-GB')}</td>
                                            <td className="py-3">
                                                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-bold">{o.status}</span>
                                            </td>
                                            <td className="py-3 font-bold text-indigo-600 dark:text-indigo-400">{o.total.toLocaleString()} SAR</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
`;

fs.writeFileSync('src/app/(dashboard)/purchase-orders/page.tsx', content);
console.log('Purchase Orders updated to POS layout');
