'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, User, ScanBarcode, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');`;

// MOCK DATA for POS if backend is empty
const MOCK_PRODUCTS = [
  { id: 1, name: 'لابتوب ديل XPS 15', price: 6500, category: 'إلكترونيات', stock: 12, image: '💻' },
  { id: 2, name: 'شاشة سامسونج 27 بوصة', price: 1200, category: 'شاشات', stock: 8, image: '🖥️' },
  { id: 3, name: 'لوحة مفاتيح ميكانيكية', price: 450, category: 'إكسسوارات', stock: 25, image: '⌨️' },
  { id: 4, name: 'فأرة لاسلكية لوجيتك', price: 290, category: 'إكسسوارات', stock: 30, image: '🖱️' },
  { id: 5, name: 'سماعات رأس سوني', price: 1100, category: 'صوتيات', stock: 15, image: '🎧' },
  { id: 6, name: 'طابعة ليزر HP', price: 850, category: 'مكتبية', stock: 5, image: '🖨️' },
  { id: 7, name: 'كابل HDMI 2.1', price: 90, category: 'كابلات', stock: 100, image: '🔌' },
  { id: 8, name: 'هاتف آيفون 15 برو', price: 4500, category: 'هواتف', stock: 20, image: '📱' },
];

const CATEGORIES = ['الكل', 'إلكترونيات', 'شاشات', 'إكسسوارات', 'صوتيات', 'مكتبية', 'كابلات', 'هواتف'];

interface CartItem {
  product: any;
  quantity: number;
}

export default function POSPage() {
  const { lang } = useTranslation();
  const { success: toastSuccess, error: toastError } = useToast();
  
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to load from API, fallback to mock data
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) setProducts(data);
          else setProducts(MOCK_PRODUCTS);
        } else {
          setProducts(MOCK_PRODUCTS);
        }
      } catch {
        setProducts(MOCK_PRODUCTS);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    if (confirm('هل أنت متأكد من مسح السلة بالكامل؟')) setCart([]);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    toastSuccess('تم الدفع واصدار الفاتورة بنجاح!');
    setCart([]);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'الكل' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const subtotal = cart.reduce((sum, item) => sum + ((item.product.price || 0) * item.quantity), 0);
  const tax = subtotal * 0.15; // 15% VAT
  const total = subtotal + tax;

  return (
    <div className="h-[calc(100vh-5rem)] bg-slate-100 dark:bg-[#020617] transition-colors duration-300 overflow-hidden" style={{ fontFamily: "'Fira Sans', sans-serif" }} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <style dangerouslySetInnerHTML={{ __html: fontImport }} />
      
      <div className="flex flex-col lg:flex-row h-full">
        
        {/* Left Side: Products (Takes remaining space) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden p-4 lg:p-6 lg:pl-3 rtl:lg:pl-6 rtl:lg:pr-6">
          
          {/* Top Bar: Search & Categories */}
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 mb-4 shrink-0 flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن منتج، باركود، رمز..." 
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
              </div>
              <button className="px-4 py-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors border border-indigo-200 dark:border-indigo-800/50 shrink-0">
                <ScanBarcode className="w-5 h-5" /> مسح الباركود
              </button>
            </div>
            
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {CATEGORIES.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                    selectedCategory === cat 
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm' 
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-100/50 dark:bg-[#020617]/50 rounded-2xl">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
                {filteredProducts.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="bg-white dark:bg-[#0F172A] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all flex flex-col items-center text-center group active:scale-95"
                  >
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-xl mb-3 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
                      {p.image || '📦'}
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1 line-clamp-2 min-h-[40px]">{p.name}</h3>
                    <p className="text-indigo-600 dark:text-indigo-400 font-bold font-[Fira_Code] text-lg">
                      {(p.price || 0).toLocaleString()} <span className="text-xs">SAR</span>
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Cart (Fixed width) */}
        <div className="w-full lg:w-[400px] h-full bg-white dark:bg-[#0F172A] border-l rtl:border-r rtl:border-l-0 border-slate-200 dark:border-slate-800 shadow-xl flex flex-col z-10 shrink-0">
          
          {/* Cart Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md flex justify-between items-center shrink-0">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> الطلب الحالي
            </h2>
            <div className="flex gap-2">
              <button className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors">
                <User className="w-5 h-5" />
              </button>
              <button onClick={clearCart} disabled={cart.length === 0} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-30">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-bold">السلة فارغة</p>
                <p className="text-sm">أضف منتجات للبدء</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm pr-2">{item.product.name}</h4>
                    <p className="font-bold text-slate-900 dark:text-white font-[Fira_Code] shrink-0 text-sm">
                      {((item.product.price || 0) * item.quantity).toLocaleString()} <span className="text-xs text-slate-500">SAR</span>
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-1">
                      <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold text-sm text-slate-900 dark:text-white">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.product.id)} className="text-red-500 hover:text-red-600 text-xs font-bold px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded-md">
                      إزالة
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer / Checkout */}
          <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-5 shrink-0">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400 font-bold">المجموع الفرعي</span>
                <span className="text-slate-900 dark:text-white font-[Fira_Code] font-bold">{subtotal.toLocaleString()} SAR</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400 font-bold">ضريبة القيمة المضافة (15%)</span>
                <span className="text-slate-900 dark:text-white font-[Fira_Code] font-bold">{tax.toLocaleString()} SAR</span>
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center mt-3">
                <span className="text-lg font-bold text-slate-900 dark:text-white">الإجمالي</span>
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-[Fira_Code]">{total.toLocaleString()} SAR</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <button disabled={cart.length === 0} className="py-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 rounded-xl font-bold flex items-center justify-center gap-2 border border-emerald-200 dark:border-emerald-800/30 transition-colors disabled:opacity-50">
                <Banknote className="w-5 h-5" /> نقداً
              </button>
              <button disabled={cart.length === 0} className="py-3 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-xl font-bold flex items-center justify-center gap-2 border border-blue-200 dark:border-blue-800/30 transition-colors disabled:opacity-50">
                <CreditCard className="w-5 h-5" /> شبكة
              </button>
            </div>
            
            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none"
            >
              دفع وإصدار الفاتورة <ArrowRight className="w-5 h-5 rtl:rotate-180" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
