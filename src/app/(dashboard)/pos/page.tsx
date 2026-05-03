"use client";

import React, { useState } from 'react';
import { ShoppingCart, Search, CreditCard, Banknote, X, Plus, Minus, User, Printer, QrCode } from 'lucide-react';

const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');`;

export default function POSTerminal() {
    const [cart, setCart] = useState([
        { id: 1, name: 'قهوة مختصة (V60)', price: 18.00, qty: 2 },
        { id: 2, name: 'كيكة العسل الروسية', price: 25.00, qty: 1 }
    ]);

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const tax = subtotal * 0.15;
    const total = subtotal + tax;

    return (
        <div className="h-screen flex flex-col bg-slate-100 dark:bg-[#020617] overflow-hidden transition-colors duration-300" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
            <style dangerouslySetInnerHTML={{ __html: fontImport }} />
            
            {/* Top Navigation Bar */}
            <header className="bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="bg-emerald-500 text-white p-2 rounded-lg">
                        <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="font-bold text-slate-900 dark:text-white text-lg">نقطة البيع (POS)</h1>
                        <p className="text-xs text-slate-500 font-[Fira_Code]">جهاز الكاشير #01 | فرع العليا</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3 space-x-reverse">
                    <button className="flex items-center px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <User className="w-4 h-4 ml-2" /> العميل: نقدي (افتراضي)
                    </button>
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 font-bold border border-indigo-200 dark:border-indigo-800">
                        JS
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Side: Product Grid (70%) */}
                <div className="w-[70%] flex flex-col p-6 overflow-hidden">
                    {/* Search and Categories */}
                    <div className="flex gap-4 mb-6 shrink-0">
                        <div className="relative flex-1">
                            <Search className="w-5 h-5 absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="ابحث عن منتج أو امسح الباركود..." 
                                className="w-full pl-4 pr-12 py-3 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl text-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 mb-6 shrink-0 overflow-x-auto pb-2 scrollbar-hide">
                        {['الكل', 'مشروبات ساخنة', 'مشروبات باردة', 'حلويات', 'وجبات خفيفة', 'حبوب قهوة'].map((cat, i) => (
                            <button key={i} className={`px-6 py-2.5 rounded-full font-bold whitespace-nowrap transition-colors ${i === 0 ? 'bg-slate-800 text-white dark:bg-emerald-500' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-[#0F172A] dark:border-slate-800 dark:text-slate-300 dark:hover:border-slate-600'}`}>
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Products Grid */}
                    <div className="flex-1 overflow-y-auto pr-2">
                        <div className="grid grid-cols-3 xl:grid-cols-4 gap-4">
                            {[
                                { name: 'قهوة مختصة (V60)', price: 18, img: 'bg-amber-100', cat: 'مشروبات ساخنة' },
                                { name: 'كورتادو', price: 15, img: 'bg-amber-100', cat: 'مشروبات ساخنة' },
                                { name: 'فلات وايت', price: 16, img: 'bg-amber-100', cat: 'مشروبات ساخنة' },
                                { name: 'ايس دريب', price: 20, img: 'bg-blue-100', cat: 'مشروبات باردة' },
                                { name: 'موهيتو توت', price: 22, img: 'bg-rose-100', cat: 'مشروبات باردة' },
                                { name: 'كيكة العسل الروسية', price: 25, img: 'bg-yellow-100', cat: 'حلويات' },
                                { name: 'تيراميسو', price: 28, img: 'bg-orange-100', cat: 'حلويات' },
                                { name: 'كرواسون زبدة', price: 12, img: 'bg-yellow-50', cat: 'وجبات خفيفة' },
                                { name: 'حبوب إثيوبيا (250g)', price: 65, img: 'bg-slate-200', cat: 'حبوب قهوة' }
                            ].map((product, i) => (
                                <button key={i} className="flex flex-col bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-500 hover:shadow-md transition-all group text-right">
                                    <div className={`h-32 w-full ${product.img} dark:opacity-80 relative`}>
                                        {/* Mock Image Area */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-30 text-slate-800 text-4xl">☕</div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">{product.name}</h3>
                                        <p className="text-emerald-600 dark:text-emerald-400 font-bold font-[Fira_Code] text-lg">{product.price.toFixed(2)} ﷼</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side: Cart (30%) */}
                <div className="w-[30%] bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.02)] z-10">
                    
                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {cart.map((item, i) => (
                            <div key={i} className="flex flex-col p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-tight max-w-[70%]">{item.name}</span>
                                    <button className="text-slate-400 hover:text-red-500 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-2 space-x-reverse bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                        <button className="p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"><Plus className="w-4 h-4" /></button>
                                        <span className="w-8 text-center font-bold font-[Fira_Code] text-slate-900 dark:text-white">{item.qty}</span>
                                        <button className="p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"><Minus className="w-4 h-4" /></button>
                                    </div>
                                    <span className="font-bold text-slate-900 dark:text-white font-[Fira_Code]">{(item.price * item.qty).toFixed(2)} ﷼</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Totals & Payment */}
                    <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-slate-500 dark:text-slate-400 text-sm">
                                <span>المجموع الفرعي</span>
                                <span className="font-[Fira_Code]">{subtotal.toFixed(2)} ﷼</span>
                            </div>
                            <div className="flex justify-between text-slate-500 dark:text-slate-400 text-sm">
                                <span>ضريبة القيمة المضافة (15%)</span>
                                <span className="font-[Fira_Code]">{tax.toFixed(2)} ﷼</span>
                            </div>
                            <div className="flex justify-between text-slate-900 dark:text-white text-2xl font-black pt-3 border-t border-slate-200 dark:border-slate-700">
                                <span>الإجمالي</span>
                                <span className="font-[Fira_Code] text-emerald-600 dark:text-emerald-400">{total.toFixed(2)} ﷼</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <button className="flex flex-col items-center justify-center p-4 bg-white dark:bg-[#0F172A] border border-emerald-500 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors group">
                                <Banknote className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="font-bold text-sm">نقدي (Cash)</span>
                            </button>
                            <button className="flex flex-col items-center justify-center p-4 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors shadow-lg shadow-slate-800/20 group">
                                <CreditCard className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="font-bold text-sm">بطاقة (Mada/Visa)</span>
                            </button>
                        </div>
                        
                        <div className="flex justify-center items-center text-xs text-slate-400 font-[Fira_Code] mt-4">
                            <QrCode className="w-3 h-3 ml-1" /> ZATCA Phase 2 Ready
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
