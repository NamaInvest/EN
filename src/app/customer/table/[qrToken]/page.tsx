'use client';

import React, { useState, useEffect, use } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Utensils, CheckCircle2, Coffee, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Product {
    id: string;
    name: string;
    barcode: string;
    price: number;
    taxRate: number;
    categoryId: string;
    categoryName: string;
    img: string;
    sellByWeight: boolean;
}

interface Category {
    id: string;
    name: string;
}

export default function CustomerTablePage({ params }: { params: Promise<{ qrToken: string }> }) {
    const resolvedParams = use(params);
    const qrToken = resolvedParams.qrToken;

    const [loading, setLoading] = useState(true);
    const [tableData, setTableData] = useState<any>(null);
    const [callStatus, setCallStatus] = useState<'IDLE' | 'CALLING' | 'CALLED'>('IDLE');

    // Products & Categories States
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCat, setSelectedCat] = useState('all');

    useEffect(() => {
        // Fetch table details using the token
        const fetchTable = async () => {
            try {
                const res = await fetch(`/api/customer/table/${qrToken}`);
                const data = await res.json();
                if (data.success) {
                    setTableData(data.table);
                } else {
                    toast.error('لم يتم العثور على الطاولة');
                }
            } catch (e) {
                toast.error('خطأ في الاتصال بالخادم');
            } finally {
                setLoading(false);
            }
        };

        // Fetch products and categories dynamically
        const fetchMenu = async () => {
            try {
                const res = await fetch('/api/pos/products');
                const data = await res.json();
                if (data.success) {
                    setProducts(data.products || []);
                    setCategories(data.categories || []);
                }
            } catch (e) {
                console.error('Failed to load menu products:', e);
            }
        };

        fetchTable();
        fetchMenu();
    }, [qrToken]);

    const callWaiter = async () => {
        setCallStatus('CALLING');
        try {
            const res = await fetch(`/api/customer/table/${qrToken}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'CALL_WAITER' })
            });
            const data = await res.json();
            if (data.success) {
                setCallStatus('CALLED');
                toast.success('تم استدعاء النادل بنجاح، سيأتيك قريباً!');
                setTimeout(() => setCallStatus('IDLE'), 60000); // Reset after 1 min
            } else {
                setCallStatus('IDLE');
                toast.error('حدث خطأ أثناء المحاولة');
            }
        } catch (e) {
            setCallStatus('IDLE');
            toast.error('خطأ في الاتصال');
        }
    };

    const fmt = (n: number) => n.toLocaleString('en-SA', { minimumFractionDigits: 2 });

    if (loading) {
        return (
            <div className="min-h-screen bg-orange-50 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <Coffee className="w-12 h-12 text-orange-500 mb-4" />
                    <p className="text-orange-800 font-bold">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    if (!tableData) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
                <Card className="max-w-md w-full text-center p-8 border-red-200 shadow-xl rounded-3xl">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-black">X</div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">عفواً، الرابط غير صالح</h2>
                    <p className="text-slate-500 text-sm">يرجى التأكد من مسح الباركود بشكل صحيح من الطاولة.</p>
                </Card>
            </div>
        );
    }

    const filteredProducts = products.filter(p => selectedCat === 'all' || p.categoryId === selectedCat);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-cairo" dir="rtl">
            {/* Header */}
            <div className="bg-orange-500 text-white p-6 rounded-b-[2rem] shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black opacity-10 rounded-full -ml-8 -mb-8 blur-lg"></div>
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black mb-1">أهلاً بك 👋</h1>
                        <p className="text-orange-100 text-sm font-semibold">نحن سعداء بخدمتك اليوم</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                        <Utensils className="w-8 h-8 text-white" />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 flex flex-col gap-6 -mt-6 relative z-20">
                {/* Table Info Card */}
                <Card className="border-0 shadow-xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-xl">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                                <Coffee className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-bold">أنت تجلس على</p>
                                <h2 className="text-3xl font-black text-slate-800">{tableData.name}</h2>
                                <p className="text-xs text-slate-400 mt-1">المنطقة: {tableData.zone?.name}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Action - Call Waiter */}
                <Card className="border-0 shadow-lg rounded-3xl bg-white p-6 flex flex-col items-center justify-center text-center">
                    <button 
                        onClick={callWaiter}
                        disabled={callStatus !== 'IDLE'}
                        className={`relative group w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-xl ${
                            callStatus === 'CALLED' 
                                ? 'bg-emerald-500 text-white shadow-emerald-500/40 scale-95' 
                                : callStatus === 'CALLING'
                                ? 'bg-orange-400 text-white shadow-orange-500/40 animate-pulse'
                                : 'bg-linear-to-br from-orange-400 to-red-500 text-white shadow-red-500/30 hover:scale-105 active:scale-95'
                        }`}
                    >
                        {/* Ripples */}
                        {callStatus === 'IDLE' && (
                            <>
                                <div className="absolute inset-0 rounded-full border-2 border-orange-500 opacity-20 group-hover:animate-ping"></div>
                                <div className="absolute -inset-4 rounded-full border border-red-500 opacity-10 group-hover:animate-ping" style={{ animationDelay: '200ms' }}></div>
                            </>
                        )}
                        
                        {callStatus === 'CALLED' ? (
                            <CheckCircle2 className="w-14 h-14 mb-1" />
                        ) : (
                            <Bell className={`w-14 h-14 mb-1 ${callStatus === 'IDLE' ? 'group-hover:-rotate-12 transition-transform' : 'animate-bounce'}`} />
                        )}
                        
                        <span className="text-lg font-black tracking-tight">
                            {callStatus === 'CALLED' ? 'تم الاستدعاء' : callStatus === 'CALLING' ? 'جاري...' : 'استدعاء النادل'}
                        </span>
                    </button>
                    <p className="text-slate-400 font-bold mt-4 text-sm max-w-[240px]">
                        {callStatus === 'CALLED' 
                            ? 'لقد استلمنا طلبك، النادل في الطريق إليك!' 
                            : 'اضغط على الزر إذا كنت بحاجة للمساعدة أو للطلب'}
                    </p>
                </Card>

                {/* Products Menu Section */}
                <div className="space-y-4">
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Sparkles className="text-orange-500 w-5 h-5" />
                        قائمة المأكولات والمشروبات (Menu)
                    </h3>

                    {/* Categories Badges */}
                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6" style={{ scrollbarWidth: 'none' }}>
                        <Button 
                            variant={selectedCat === 'all' ? 'default' : 'outline'}
                            onClick={() => setSelectedCat('all')}
                            className={`rounded-full px-5 font-bold ${selectedCat === 'all' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'text-slate-600'}`}
                        >
                            الكل
                        </Button>
                        {categories.map(c => (
                            <Button 
                                key={c.id} 
                                variant={selectedCat === c.id ? 'default' : 'outline'}
                                onClick={() => setSelectedCat(c.id)}
                                className={`rounded-full px-5 font-bold ${selectedCat === c.id ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'text-slate-600'}`}
                            >
                                {c.name}
                            </Button>
                        ))}
                    </div>

                    {/* Products Grid */}
                    {filteredProducts.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 bg-white rounded-3xl p-6 shadow-sm">
                            <p className="font-bold">لا توجد منتجات متوفرة حالياً في هذا القسم</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredProducts.map(product => (
                                <Card key={product.id} className="border-0 shadow-md rounded-2xl overflow-hidden bg-white hover:scale-[1.01] transition-all">
                                    <CardContent className="p-4 flex gap-4 items-center">
                                        <div className="w-16 h-16 rounded-xl bg-orange-100 flex items-center justify-center text-3xl select-none">
                                            {product.img}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-800 text-base truncate">{product.name}</h4>
                                            <p className="text-slate-400 text-xs mt-1">القسم: {product.categoryName}</p>
                                        </div>
                                        <div className="text-left">
                                            <span className="text-emerald-600 font-black text-lg">{fmt(product.price)}</span>
                                            <span className="text-xs text-slate-400 block">ريال سعودي</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Minimal Footer */}
            <div className="py-6 text-center text-xs font-bold text-slate-300">
                Powered by NamaSoft
            </div>
        </div>
    );
}
