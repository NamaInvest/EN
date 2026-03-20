"use client";

import { useState, useEffect } from "react";
import { Factory, Wrench, CheckCircle, PackageOpen, Plus, Play, ShieldCheck, Truck } from "lucide-react";

export default function ManufacturingKanbanPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [recipes, setRecipes] = useState<any[]>([]);
    const [machines, setMachines] = useState<any[]>([]);
    
    // Modal states
    const [showNewOrder, setShowNewOrder] = useState(false);
    const [newOrderForm, setNewOrderForm] = useState({ recipeId: "", machineId: "", qty: "" });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("token") || "";
            const res = await fetch("/api/manufacturing/orders", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders || []);
                setRecipes(data.recipes || []);
                setMachines(data.machines || []);
            }
        } catch (e) {
            console.error("Failed to fetch manufacturing data", e);
        }
    };

    const handleCreateOrder = async () => {
        try {
            const token = localStorage.getItem("token") || "";
            await fetch("/api/manufacturing/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    recipeId: newOrderForm.recipeId,
                    machineId: newOrderForm.machineId,
                    quantityToProduce: newOrderForm.qty,
                })
            });
            setShowNewOrder(false);
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const advanceStatus = async (orderId: number, currentStatus: string) => {
        let nextStatus = currentStatus;
        if (currentStatus === 'draft') nextStatus = 'processing';
        else if (currentStatus === 'processing') nextStatus = 'qa';
        else if (currentStatus === 'qa') {
            const isSure = confirm("إنهاء أمر التصنيع سيقوم آلياً بخصم المواد الخام، واحتساب وقت الآلة، وتوريد المنتج النهائي للمخزون. هل أنت متأكد؟");
            if (!isSure) return;
            nextStatus = 'completed';
        }

        try {
            const token = localStorage.getItem("token") || "";
            await fetch("/api/manufacturing/orders", {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ id: orderId, status: nextStatus })
            });
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const renderColumn = (status: string, title: string, icon: any, colorClass: string) => {
        const colOrders = orders.filter(o => o.status === status);
        return (
            <div className={`flex flex-col gap-4 bg-slate-50 p-4 rounded-xl border-t-4 ${colorClass} min-h-[400px]`}>
                <h2 className="font-bold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-2">{icon} {title}</span>
                    <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-sm">{colOrders.length}</span>
                </h2>
                
                {colOrders.map(order => (
                    <div key={order.id} className="bg-white p-4 rounded shadow-sm border border-slate-200 hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-mono font-bold text-slate-500">{order.orderNumber}</span>
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                                خط الإنتاج: {order.machine?.name || "عام"}
                            </span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-800">{order.recipe?.finishedProduct?.name}</h3>
                        <p className="text-sm text-slate-500 mb-4">الكمية المستهدفة: <strong className="text-slate-800">{order.quantityToProduce}</strong></p>
                        
                        {status !== 'completed' && (
                            <button 
                                onClick={() => advanceStatus(order.id, status)}
                                className={`w-full py-2 rounded text-sm font-bold shadow-sm transition-colors text-white ${
                                    status === 'draft' ? "bg-amber-500 hover:bg-amber-600" :
                                    status === 'processing' ? "bg-blue-500 hover:bg-blue-600" :
                                    "bg-emerald-600 hover:bg-emerald-700"
                                }`}
                            >
                                {status === 'draft' && "بدء التصنيع 🏭"}
                                {status === 'processing' && "إرسال للفحص 🔬"}
                                {status === 'qa' && "اعتماد للمخزن ✅"}
                            </button>
                        )}
                        {status === 'completed' && (
                            <div className="text-center pt-2 border-t border-slate-100 text-emerald-600 font-bold text-sm">
                                تم خصم المواد ورفع المخزون
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
                        <Factory className="w-8 h-8 text-amber-600" /> إدارة التصنيع المتقدمة (MES)
                    </h1>
                    <p className="text-slate-500 mt-2">لوحة مراقبة خطوط الإنتاج والآلات وتحويل المواد الخام.</p>
                </div>
                <button 
                    onClick={() => setShowNewOrder(true)}
                    className="bg-slate-800 text-white px-5 py-2.5 rounded shadow-sm hover:bg-slate-700 transition flex items-center gap-2"
                >
                    <Plus size={18} /> إصدار أمر تشغيل
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {renderColumn("draft", "مُسودة الأوامر", <PackageOpen className="text-slate-500" size={20}/>, "border-slate-400")}
                {renderColumn("processing", "قيد الإنتاج والتشغيل", <Wrench className="text-amber-500" size={20}/>, "border-amber-400")}
                {renderColumn("qa", "فحص الجودة", <ShieldCheck className="text-blue-500" size={20}/>, "border-blue-400")}
                {renderColumn("completed", "أُرسلت للمخزن", <CheckCircle className="text-emerald-500" size={20}/>, "border-emerald-400")}
            </div>

            {/* Modal for New Order */}
            {showNewOrder && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4 border-b pb-2">إصدار أمر تصنيع جديد</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm mb-1 text-slate-600">وصفة التصنيع (المنتج النهائي)</label>
                                <select 
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500"
                                    value={newOrderForm.recipeId}
                                    onChange={e => setNewOrderForm({...newOrderForm, recipeId: e.target.value})}
                                >
                                    <option value="">-- اختر الوصفة --</option>
                                    {recipes.map(r => (
                                        <option key={r.id} value={r.id}>{r.finishedProduct?.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm mb-1 text-slate-600">خط الإنتاج / الآلة (اختياري، لحساب التكلفة)</label>
                                <select 
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500"
                                    value={newOrderForm.machineId}
                                    onChange={e => setNewOrderForm({...newOrderForm, machineId: e.target.value})}
                                >
                                    <option value="">-- يدوية / عامة --</option>
                                    {machines.map(m => (
                                        <option key={m.id} value={m.id}>{m.name} ({m.hourlyCost} ر.س/ساعة)</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm mb-1 text-slate-600">الكمية المطلوبة إنتاجها</label>
                                <input 
                                    type="number"
                                    min="1"
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500"
                                    value={newOrderForm.qty}
                                    onChange={e => setNewOrderForm({...newOrderForm, qty: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={() => setShowNewOrder(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded">إلغاء</button>
                            <button onClick={handleCreateOrder} disabled={!newOrderForm.recipeId || !newOrderForm.qty} className="bg-amber-600 text-white px-6 py-2 rounded hover:bg-amber-700 disabled:opacity-50 font-bold shadow">
                                اعتماد الإصدار
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
