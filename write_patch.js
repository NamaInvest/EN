const fs = require('fs');
const filePath = 'src/app/(dashboard)/pos/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const searchStr = 'className="restaurant-pos"';
const classIndex = content.indexOf(searchStr);
if (classIndex === -1) {
    console.error('Could not find restaurant-pos div!');
    process.exit(1);
}

const beforeClass = content.substring(0, classIndex);
const returnIndex = beforeClass.lastIndexOf('return');
if (returnIndex === -1) {
    console.error('Could not find return statement before class!');
    process.exit(1);
}

const beforeReturn = content.substring(0, returnIndex);

const newJsx = `return (
        <div className="flex h-[calc(100vh-4rem)] bg-slate-50 dark:bg-[#020617] overflow-hidden font-sans" dir="rtl">
            {/* Sidebar / Categories */}
            <div className="w-24 bg-white dark:bg-[#0f172a] border-l border-slate-200 dark:border-slate-800 flex flex-col items-center py-4 gap-4 z-10 shadow-sm shrink-0">
                <button onClick={() => setPosMode('FLOOR')} className={\`w-16 h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all \${posMode === 'FLOOR' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}\`}>
                    <Grid className="w-6 h-6" />
                    <span className="text-[10px] font-bold">الطاولات</span>
                </button>
                <button onClick={() => setPosMode('MENU')} className={\`w-16 h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all \${posMode === 'MENU' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}\`}>
                    <Utensils className="w-6 h-6" />
                    <span className="text-[10px] font-bold">المنيو</span>
                </button>
                <div className="w-12 h-px bg-slate-200 dark:bg-slate-700 my-2"></div>
                <div className="flex-1 w-full overflow-y-auto hide-scrollbar flex flex-col items-center gap-2">
                    <button onClick={() => { setActiveCategory(null); setPosMode('MENU'); }} className={\`w-16 h-16 rounded-xl flex items-center justify-center text-xs font-bold text-center p-1 transition-colors \${!activeCategory && posMode === 'MENU' ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-400'}\`}>
                        الكل
                    </button>
                    {categories.map(cat => (
                        <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setPosMode('MENU'); }} className={\`w-16 h-16 rounded-xl flex items-center justify-center text-xs font-bold text-center p-1 transition-colors \${activeCategory === cat.id && posMode === 'MENU' ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-400'}\`}>
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Top Header */}
                <div className="h-20 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-10">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative w-full max-w-md">
                            <Search className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="ابحث عن وجبة أو منتج..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl py-3 pr-12 pl-4 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <button onClick={() => {}} className="px-4 py-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors border border-indigo-200 dark:border-indigo-800/30">
                            <Plus className="w-5 h-5" /> منتج جديد
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowHistoryModal(true)} className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="السجل (F9)">
                            <History className="w-5 h-5" />
                        </button>
                        <button onClick={() => setShowHeldOrdersModal(true)} className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors relative" title="الطلبات المعلقة">
                            <Clock className="w-5 h-5" />
                            {heldOrders && heldOrders.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold animate-bounce">{heldOrders.length}</span>}
                        </button>
                        <button onClick={() => setShowPendingModal(true)} className={\`p-3 rounded-xl transition-all relative \${notifFlash ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}\`}>
                            <Bell className="w-5 h-5" />
                            {lastKnownCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold">{lastKnownCount}</span>}
                        </button>
                    </div>
                </div>

                {/* Content Grid (Menu or Floor) */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-[#020617] custom-scrollbar pb-32">
                    {posMode === 'FLOOR' ? (
                        <div className="space-y-6">
                            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                                {zones.map(z => (
                                    <button key={z.id} onClick={() => setActiveZone(z)} className={\`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-colors \${activeZone?.id === z.id ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}\`}>
                                        {z.name}
                                    </button>
                                ))}
                                <button onClick={createZone} className="px-4 py-3 border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"><Plus className="w-5 h-5" /></button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {activeZone?.tables?.map((table: any) => {
                                    const isOccupied = table.status === 'Occupied';
                                    return (
                                        <div key={table.id} onClick={() => openTableSession(table)} className={\`relative p-4 rounded-2xl border-2 cursor-pointer transition-all hover:-translate-y-1 \${isOccupied ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800/50' : 'bg-white border-slate-100 dark:bg-slate-800 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-sm'}\`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className={\`text-2xl font-black \${isOccupied ? 'text-orange-600 dark:text-orange-400' : 'text-slate-800 dark:text-white'}\`}>{table.name}</h3>
                                                <div className="flex items-center gap-1 text-slate-400 text-xs font-bold bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-md"><User className="w-3 h-3" /> {table.capacity}</div>
                                            </div>
                                            <div className={\`text-sm font-bold \${isOccupied ? 'text-orange-500' : 'text-emerald-500'}\`}>{isOccupied ? 'مشغولة' : 'متاحة'}</div>
                                            {isOccupied && (
                                                <button onClick={(e) => closeTableSession(e, table)} className="absolute bottom-4 left-4 p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg hover:bg-red-200"><Trash2 className="w-4 h-4" /></button>
                                            )}
                                        </div>
                                    );
                                })}
                                <button onClick={createTable} className="min-h-[120px] rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300 transition-colors"><Plus className="w-8 h-8 mb-2" /><span className="font-bold">إضافة طاولة</span></button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-20">
                            {products.filter(p => (!activeCategory || p.categoryId === activeCategory) && p.name.includes(searchQuery)).map(p => (
                                <button key={p.id} onClick={() => addToCart(p)} className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-col items-center text-center shadow-sm hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 transition-all active:scale-95 group overflow-hidden relative">
                                    <div className="w-full h-32 bg-slate-100 dark:bg-slate-900 rounded-xl mb-3 overflow-hidden flex items-center justify-center">
                                        {p.imageUrl || p.image ? (
                                            <img src={p.imageUrl || p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <span className="text-4xl group-hover:scale-110 transition-transform duration-300">🍔</span>
                                        )}
                                    </div>
                                    <h4 className="font-bold text-slate-800 dark:text-white text-sm line-clamp-2 h-10 mb-1">{p.name}</h4>
                                    <span className="text-indigo-600 dark:text-indigo-400 font-black font-[Fira_Code] text-lg mt-auto">{p.price} <span className="text-[10px]">SAR</span></span>
                                </button>
                            ))}
                            {products.filter(p => (!activeCategory || p.categoryId === activeCategory) && p.name.includes(searchQuery)).length === 0 && (
                                <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
                                    <Utensils className="w-16 h-16 mb-4 opacity-20" />
                                    <p className="font-bold text-lg">لا توجد منتجات مطابقة</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Cart Panel */}
            <div className="w-full lg:w-[420px] bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col shrink-0 z-20">
                {/* Customer & Table Info */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col gap-3">
                    <button onClick={() => setShowCustomerModal(true)} className={\`w-full py-3 px-4 rounded-xl flex items-center justify-between font-bold text-sm border transition-colors \${selectedCustomer ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}\`}>
                        <div className="flex items-center gap-2"><User className="w-5 h-5" /> {selectedCustomer ? selectedCustomer.name : 'اختيار أو إضافة عميل'}</div>
                        {selectedCustomer && <span onClick={(e) => {e.stopPropagation(); setSelectedCustomer(null);}} className="text-red-500 p-1 hover:bg-red-100 rounded-md"><XIcon className="w-4 h-4"/></span>}
                    </button>
                    {activeTable && (
                        <div className="flex items-center justify-between bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-xl px-4 py-2">
                            <span className="font-bold text-orange-700 dark:text-orange-400 text-sm flex items-center gap-2"><Utensils className="w-4 h-4"/> طاولة: {activeTable.name}</span>
                            <button onClick={() => {setActiveTable(null); setCart([]);}} className="text-red-500 hover:bg-red-100 p-1 rounded-md"><XIcon className="w-4 h-4"/></button>
                        </div>
                    )}
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                            <ShoppingCart className="w-20 h-20 mb-4" />
                            <p className="font-bold text-lg">الطلب فارغ</p>
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
                                        <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-600"><Minus className="w-4 h-4"/></button>
                                        <span className="w-8 text-center font-bold text-sm">{item.qty}</span>
                                        <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-600"><Plus className="w-4 h-4"/></button>
                                    </div>
                                    <button onClick={() => setCart((prev: any) => prev.filter((i: any) => i.id !== item.id))} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Totals & Numpad */}
                <div className="bg-white dark:bg-[#0f172a] border-t border-slate-200 dark:border-slate-800 p-4 shrink-0">
                    <div className="space-y-1 mb-4">
                        <div className="flex justify-between text-sm font-bold text-slate-500"><span>المجموع</span><span className="font-[Fira_Code]">{displaySubtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                        <div className="flex justify-between text-sm font-bold text-emerald-500"><span>الخصم</span><span className="font-[Fira_Code]">- {displayDiscount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                        <div className="flex justify-between text-sm font-bold text-slate-500"><span>الضريبة ({(taxRate)}%)</span><span className="font-[Fira_Code]">{tax.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                        <div className="flex justify-between text-xl font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                            <span>الإجمالي</span><span className="font-[Fira_Code] text-indigo-600 dark:text-indigo-400">{finalTotal.toLocaleString(undefined, {minimumFractionDigits: 2})} SAR</span>
                        </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="grid grid-cols-4 gap-2 mb-2">
                        <button onClick={handleHoldOrder} disabled={cart.length === 0} className="py-3 bg-amber-100 text-amber-700 rounded-xl font-bold flex flex-col items-center gap-1 hover:bg-amber-200 disabled:opacity-50"><Clock className="w-5 h-5" /><span className="text-[10px]">تعليق (F3)</span></button>
                        <button onClick={() => setShowSplitModal(true)} disabled={cart.length === 0} className="py-3 bg-purple-100 text-purple-700 rounded-xl font-bold flex flex-col items-center gap-1 hover:bg-purple-200 disabled:opacity-50"><LayoutDashboard className="w-5 h-5" /><span className="text-[10px]">مجزأ</span></button>
                        <button onClick={() => handleCheckout('TRANSFER' as any)} disabled={cart.length === 0 || isProcessing} className="py-3 bg-blue-100 text-blue-700 rounded-xl font-bold flex flex-col items-center gap-1 hover:bg-blue-200 disabled:opacity-50"><RefreshCcw className="w-5 h-5" /><span className="text-[10px]">تحويل</span></button>
                        <button onClick={() => handleCheckout('CARD')} disabled={cart.length === 0 || isProcessing} className="py-3 bg-cyan-100 text-cyan-700 rounded-xl font-bold flex flex-col items-center gap-1 hover:bg-cyan-200 disabled:opacity-50"><CreditCard className="w-5 h-5" /><span className="text-[10px]">MADA</span></button>
                    </div>
                    <button onClick={() => handleCheckout('CASH')} disabled={cart.length === 0 || isProcessing} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95">
                        <Banknote className="w-6 h-6" /> دفع نقدي (F2)
                    </button>
                </div>
            </div>

            {/* MODALS INJECTED HERE */}
            {/* Customer Modal */}
            {showCustomerModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCustomerModal(false)}>
                    <div className="bg-white dark:bg-[#0F172A] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                            <h3 className="font-bold text-xl flex items-center gap-2 text-slate-800 dark:text-white"><User className="text-indigo-500"/> اختيار أو إضافة عميل</h3>
                            <button onClick={() => setShowCustomerModal(false)} className="p-2 bg-white dark:bg-slate-800 rounded-full hover:bg-slate-100 shadow-sm border border-slate-200 dark:border-slate-700"><XIcon size={16}/></button>
                        </div>
                        <div className="p-6">
                            <input type="text" placeholder="البحث باسم العميل أو رقم الهاتف..." className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl mb-4 font-bold" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} />
                            <div className="max-h-60 overflow-y-auto mb-4 space-y-2 custom-scrollbar">
                                {customers.filter((c: any) => c.name.includes(customerSearch) || (c.phone && c.phone.includes(customerSearch))).map((c: any) => (
                                    <div key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerModal(false); }} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer flex justify-between font-bold transition-colors">
                                        <span className="text-slate-800 dark:text-white">{c.name}</span>
                                        <span className="text-slate-500 dark:text-slate-400 font-[Fira_Code]">{c.phone}</span>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => { alert('تفعيل إضافة عميل جديد'); }} className="w-full py-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold border border-indigo-200 dark:border-indigo-800/50 flex justify-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
                                <Plus className="w-5 h-5"/> إضافة عميل جديد
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Split Modal */}
            {showSplitModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowSplitModal(false)}>
                    <div className="bg-white dark:bg-[#0F172A] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-xl mb-4 text-center text-slate-800 dark:text-white">تقسيم الدفع</h3>
                        <div className="text-center text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-6 font-[Fira_Code]">{finalTotal.toLocaleString()} SAR</div>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-2">المبلغ النقدي (Cash)</label>
                                <input type="number" className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl font-black text-xl text-center text-slate-900 dark:text-white" value={splitCash} onChange={e => { const val = Number(e.target.value); setSplitCash(e.target.value); setSplitCard(val < finalTotal ? (finalTotal - val).toFixed(2) : '0'); }} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-2">المبلغ المتبقي للشبكة (Card)</label>
                                <input type="number" disabled className="w-full p-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-xl text-center text-slate-400" value={splitCard} />
                            </div>
                        </div>
                        <button onClick={() => { setShowSplitModal(false); handleCheckout('SPLIT'); }} disabled={((Number(splitCash)||0) + (Number(splitCard)||0)) < (finalTotal - 0.01) || isProcessing} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg disabled:opacity-50 transition-colors shadow-lg shadow-indigo-500/30">تأكيد الدفع</button>
                    </div>
                </div>
            )}
        </div>
    );
}
`;

let finalContent = beforeReturn + newJsx;

if (!finalContent.includes('Grid,')) {
    finalContent = finalContent.replace("from 'lucide-react';", "Grid, Utensils, LayoutDashboard, RefreshCcw, Minus, Plus, from 'lucide-react';");
}

fs.writeFileSync(filePath, finalContent);
console.log('JSX patched successfully');
