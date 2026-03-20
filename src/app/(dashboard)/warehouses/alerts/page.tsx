"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, AlertCircle, PackageSearch, RefreshCcw, ShoppingCart } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function LowStockAlertsPage() {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/warehouses/analytics", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.lowStockAlerts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const generateAutoPO = async () => {
    if (!confirm("هل أنت متأكد من إنشاء أمر شراء يغطي جميع النواقص الحالية؟")) return;
    setGenerating(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/procurement/auto-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert("✅ تم تدشين أمر الشراء الآلي بنجاح! راجع قسم المشتريات.");
      } else {
        const err = await res.json();
        alert(err.message || err.error || "خطأ في التوليد الآلي");
      }
    } catch (e) {
      console.error(e);
      alert("تعذر الاتصال بالمزود");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
          تنبيهات نواقص المخزون
        </h1>
        <div className="flex gap-3">
          <button
            onClick={generateAutoPO}
            disabled={generating || alerts.length === 0}
            className="bg-emerald-600 text-white px-4 py-2 rounded shadow-sm flex items-center gap-2 hover:bg-emerald-700 disabled:opacity-50 transition font-bold"
          >
            {generating ? <RefreshCcw size={18} className="animate-spin" /> : <ShoppingCart size={18} />}
            توليد أمر شراء يغطي النواقص (آلي)
          </button>
          <button
            onClick={fetchAlerts}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded shadow-sm flex items-center gap-2 hover:bg-slate-50 transition"
          >
            <RefreshCcw size={18} className={loading ? "animate-spin text-slate-400" : ""} />
            تحديث السجل
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <RefreshCcw className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center gap-4">
            <PackageSearch className="w-16 h-16 text-emerald-400 opacity-50" />
            <p className="text-lg font-semibold text-slate-700">المخزون بوضع أمن جداً!</p>
            <p className="text-sm">لا توجد أي منتجات تحت الحد الأدنى حالياً.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-amber-50 border-b border-amber-100 text-amber-900">
                <tr>
                  <th className="px-6 py-4">باركود</th>
                  <th className="px-6 py-4">المنتج</th>
                  <th className="px-6 py-4">المستودع</th>
                  <th className="px-6 py-4 text-center">الرصيد الفعلي</th>
                  <th className="px-6 py-4 text-center">الحد الأدنى للطلب</th>
                  <th className="px-6 py-4 text-center">الحالة</th>
                  <th className="px-6 py-4 text-center">إجراء سريع</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-500">{item.barcode}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{item.name}</td>
                    <td className="px-6 py-4 text-slate-600">{item.warehouseName}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-red-600 bg-red-100 px-3 py-1 rounded-lg">
                        {item.currentStock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-slate-600">
                      {item.minQuantity}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="flex items-center justify-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-full w-max mx-auto">
                        <AlertCircle size={14} /> نفاد وشيك
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <a
                        href="/purchase-orders"
                        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-800 text-white rounded text-xs hover:bg-slate-700 transition shadow-sm"
                      >
                        <ShoppingCart size={14} /> طلب شراء
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
