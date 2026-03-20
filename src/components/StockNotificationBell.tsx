"use client";

import { useState, useEffect } from "react";
import { Bell, AlertCircle } from "lucide-react";

export default function StockNotificationBell() {
  const [alertsCount, setAlertsCount] = useState(0);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchAlerts();
    // Refresh interval every 5 minutes
    const interval = setInterval(fetchAlerts, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/warehouses/analytics", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAlertsCount(data.lowStockCount || 0);
        setAlerts(data.lowStockAlerts || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-slate-100 transition relative text-slate-600 focus:outline-none"
      >
        <Bell size={20} />
        {alertsCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 border-2 border-white rounded-full">
            {alertsCount > 9 ? "9+" : alertsCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute left-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden" style={{ top: '100%', marginLeft: '-150px' }}>
            <div className="p-4 border-b border-slate-50 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">إشعارات المخزون ⚠️</h3>
              <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                {alertsCount} نواقص
              </span>
            </div>
            
            <div className="max-h-64 overflow-y-auto w-full">
              {alerts.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">
                  لا توجد تنبيهات حالياً. المخزون آمن ✨
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {alerts.slice(0, 5).map((item, idx) => (
                    <li key={idx} className="p-4 hover:bg-slate-50 transition flex items-start gap-3">
                      <div className="mt-1 bg-red-50 p-1.5 rounded-full text-red-500">
                        <AlertCircle size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800 line-clamp-1">{item.name}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          متوفر: <span className="font-bold text-red-600">{item.currentStock}</span> 
                          {' '}| الحد: {item.minQuantity}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            {alerts.length > 5 && (
              <div className="p-2 border-t border-slate-50 text-center text-xs text-slate-500 bg-slate-50 italic">
                {alerts.length - 5} منتجات إضافية نفدت...
              </div>
            )}

            <div className="p-3 border-t border-slate-100 bg-white">
              <a 
                href="/warehouses/alerts" 
                className="block w-full py-2 text-center text-sm font-bold text-white bg-slate-800 rounded-lg shadow-sm hover:bg-slate-700 transition"
              >
                عرض تفاصيل النواقص
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
