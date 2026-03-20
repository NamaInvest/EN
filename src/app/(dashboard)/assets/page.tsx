"use client";

import { useState, useEffect } from "react";
import { Truck, Car, Building, Wrench, Plus, Calculator, History } from "lucide-react";

export default function FixedAssetsPage() {
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal state
    const [showNewAsset, setShowNewAsset] = useState(false);
    const [form, setForm] = useState({
        assetName: "", assetType: "معدات", purchaseDate: "", purchaseCost: "", 
        salvageValue: "0", usefulLifeYears: "5", location: ""
    });

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token") || "";
            const res = await fetch("/api/assets", { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setAssets(data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAsset = async () => {
        try {
            const token = localStorage.getItem("token") || "";
            const res = await fetch("/api/assets", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(form)
            });
            if(res.ok) {
                setShowNewAsset(false);
                fetchAssets();
            } else {
                alert("تفاصيل الأصل غير مكتملة.");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleRunDepreciation = async () => {
        const confirmRun = confirm("تنبيه: سيقوم النظام الان بالمرور على كافة الأصول التشغيلية وتطبيق الإهلاك الشهري آلياً وتخفيض القيمة الدفترية للأصل. هل أنت متأكد؟ (يُفضل تنفيذه مرة واحدة نهاية كل شهر)");
        if (!confirmRun) return;

        try {
            const token = localStorage.getItem("token") || "";
            const res = await fetch("/api/assets/depreciate", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if(res.ok) {
                alert(data.message);
                fetchAssets();
            } else {
                alert(data.error || "خطأ في حساب التفاضل والاهلاك.");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const getTypeIcon = (type: string) => {
        if (type === 'سيارات') return <Car className="text-blue-500" size={18} />;
        if (type === 'شاحنات') return <Truck className="text-amber-500" size={18} />;
        if (type === 'مباني') return <Building className="text-indigo-500" size={18} />;
        return <Wrench className="text-slate-500" size={18} />;
    };

    const totalPortfolioValue = assets.reduce((acc, curr) => acc + (curr.purchaseCost || 0), 0);
    const currentBookValue = assets.reduce((acc, curr) => acc + (curr.currentValue || 0), 0);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
                        <Truck className="w-8 h-8 text-amber-600" /> إدارة الأصول والمعدات 
                    </h1>
                    <p className="text-slate-500 mt-2">نظام تسجيل أصول الشركة والمركبات وتطبيق الاهلاكات الشهرية ਆلياً.</p>
                </div>
                
                <div className="flex gap-3">
                    <button 
                        onClick={handleRunDepreciation}
                        className="bg-indigo-600 text-white px-5 py-2.5 rounded shadow hover:bg-indigo-700 transition flex items-center gap-2 font-bold"
                    >
                        <Calculator size={18} /> تشغيل دورة الإهلاك الشهرية
                    </button>
                    <button 
                        onClick={() => setShowNewAsset(true)}
                        className="bg-slate-800 text-white px-5 py-2.5 rounded shadow hover:bg-slate-700 transition flex items-center gap-2"
                    >
                        <Plus size={18} /> إضافة أصل جديد
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center shadow-sm">
                    <p className="text-sm font-bold text-slate-500 mb-1">إجمالي الأصول النشطة</p>
                    <p className="text-3xl font-extrabold text-blue-600">{assets.length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center shadow-sm">
                    <p className="text-sm font-bold text-slate-500 mb-1">تكلفة الشراء التاريخية (Portfolio)</p>
                    <p className="text-3xl font-extrabold text-slate-700" dir="ltr">{totalPortfolioValue.toLocaleString()} <span className="text-sm text-slate-400">SAR</span></p>
                </div>
                <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 flex flex-col items-center justify-center text-center shadow-sm">
                    <p className="text-sm font-bold text-amber-700 mb-1">إجمالي القيمة الدفترية الحالية (Book Value)</p>
                    <p className="text-3xl font-extrabold text-amber-600" dir="ltr">{currentBookValue.toLocaleString()} <span className="text-sm text-amber-400/80">SAR</span></p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-400">جاري تحميل سجل الأصول...</div>
                ) : (
                    <table className="w-full text-sm text-right">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                            <tr>
                                <th className="px-6 py-4 font-bold">اسم الأصل الوصفي</th>
                                <th className="px-6 py-4 font-bold text-center">النوع</th>
                                <th className="px-6 py-4 font-bold text-center">تاريخ الشراء</th>
                                <th className="px-6 py-4 font-bold text-center">العمر (سنوات)</th>
                                <th className="px-6 py-4 font-bold text-left">التكلفة الأساسية</th>
                                <th className="px-6 py-4 font-bold text-left">قيمة الخردة (Salvage)</th>
                                <th className="px-6 py-4 font-bold text-left">القيمة الدفترية الحالية</th>
                                <th className="px-6 py-4 font-bold text-center">الحالة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assets.length === 0 ? (
                                <tr><td colSpan={8} className="p-8 text-center text-slate-500">سجل الأصول فارغ.</td></tr>
                            ) : assets.map(asset => (
                                <tr key={asset.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-6 py-4 font-bold text-slate-800 flex flex-col">
                                        <span>{asset.assetName}</span>
                                        <span className="text-xs text-slate-400 font-normal">{asset.location || "بدون موقع"}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-1 text-slate-600">
                                            {getTypeIcon(asset.assetType)} <span>{asset.assetType}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-mono text-slate-500">
                                        {new Date(asset.purchaseDate).toLocaleDateString('en-GB')}
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-slate-600">{asset.usefulLifeYears}</td>
                                    
                                    <td className="px-6 py-4 font-bold text-slate-700 text-left" dir="ltr">
                                        {asset.purchaseCost.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-left" dir="ltr">
                                        {asset.salvageValue.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 font-black text-amber-600 text-left" dir="ltr">
                                        {asset.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    
                                    <td className="px-6 py-4 text-center">
                                        {asset.status === 'active' ? (
                                            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">نشط ويهلك</span>
                                        ) : (
                                            <span className="bg-slate-200 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">مُستهلك بالكامل</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {showNewAsset && (
                <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6 text-slate-800 border-b pb-3 flex items-center gap-2">
                            <Plus className="text-amber-600" /> إضافة أصل أو معدة جديدة لكشوفات الشركة
                        </h2>
                        
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-sm font-semibold mb-1">اسم/وصف الأصل (مثل: شاحنة مرسيدس موديل 2024 لوحة أ ب ج)</label>
                                <input type="text" className="w-full p-2 border rounded bg-slate-50 focus:ring-2 focus:ring-amber-500" value={form.assetName} onChange={e => setForm({...form, assetName: e.target.value})} />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold mb-1">فئة الأصل</label>
                                <select className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500" value={form.assetType} onChange={e => setForm({...form, assetType: e.target.value})}>
                                    <option value="معدات">معدات ومكائن مصانع</option>
                                    <option value="شاحنات">شاحنات نقل ومعدات ثقيلة</option>
                                    <option value="سيارات">سيارات إدارة ومبيعات</option>
                                    <option value="مباني">مباني وعقارات</option>
                                    <option value="أجهزة">أجهزة حاسب وتقنية</option>
                                    <option value="أثاث">أثاث وتجهيزات مكتبية</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">تاريخ الشراء / الإستحواذ</label>
                                <input type="date" className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500" value={form.purchaseDate} onChange={e => setForm({...form, purchaseDate: e.target.value})} />
                            </div>

                            <div className="col-span-2 bg-amber-50 p-4 rounded-lg border border-amber-200">
                                <h3 className="font-bold text-amber-800 mb-3 text-sm">مُحددات الإهلاك (القسط الثابت)</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-amber-900 mb-1">تكلفة الشراء (SAR)</label>
                                        <input type="number" className="w-full p-2 border rounded font-bold border-amber-300" value={form.purchaseCost} onChange={e => setForm({...form, purchaseCost: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-amber-900 mb-1">قيمة الخردة بنهاية العمر (SAR)</label>
                                        <input type="number" className="w-full p-2 border rounded border-amber-300" value={form.salvageValue} onChange={e => setForm({...form, salvageValue: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-amber-900 mb-1">العمر الإنتاجي (سنوات)</label>
                                        <input type="number" className="w-full p-2 border rounded border-amber-300" value={form.usefulLifeYears} onChange={e => setForm({...form, usefulLifeYears: e.target.value})} />
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-semibold mb-1">موقع الأصل (الفرع/المستودع/الإدارة)</label>
                                <input type="text" className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500" value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="اختياري..." />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-200">
                            <button onClick={() => setShowNewAsset(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded font-bold">إلغاء</button>
                            <button 
                                onClick={handleCreateAsset} 
                                disabled={!form.assetName || !form.purchaseDate || !form.purchaseCost || !form.usefulLifeYears} 
                                className="bg-amber-600 text-white px-8 py-2.5 rounded hover:bg-amber-700 disabled:opacity-50 font-bold shadow-md"
                            >
                                اعتماد وحفظ الأصل في السجل
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
