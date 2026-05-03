"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Building, AlertCircle, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

export default function WarehousesPage() {
 const { success, info } = useToast();

 const { t } = useTranslation();
 const [warehouses, setWarehouses] = useState<any[]>([]);
 const [branches, setBranches] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [currentWarehouse, setCurrentWarehouse] = useState<any>(null);
 const [analytics, setAnalytics] = useState<any>(null);

 // Form states
 const [name, setName] = useState("");
 const [address, setAddress] = useState("");
 const [branchId, setBranchId] = useState("");
 const [isActive, setIsActive] = useState(true);

 useEffect(() => {
 fetchData();
 }, []);

 const fetchData = async () => {
 setLoading(true);
 try {
 const token = localStorage.getItem("token");
 if (!token) return;

 const [wRes, bRes, aRes] = await Promise.all([
 fetch("/api/warehouses", { headers: { Authorization: `Bearer ${token}` } }),
 fetch("/api/branches", { headers: { Authorization: `Bearer ${token}` } }),
 fetch("/api/warehouses/analytics", { headers: { Authorization: `Bearer ${token}` } }),
 ]);

 if (wRes.ok) setWarehouses(await wRes.json());
 if (bRes.ok) setBranches(await bRes.json());
 if (aRes.ok) setAnalytics(await aRes.json());
 } catch (e) {
 console.error(e);
 } finally {
 setLoading(false);
 }
 };

 const handleOpenModal = (warehouse: any = null) => {
 if (warehouse) {
 setCurrentWarehouse(warehouse);
 setName(warehouse.name);
 setAddress(warehouse.address || "");
 setBranchId(warehouse.branchId?.toString() || "");
 setIsActive(warehouse.active);
 } else {
 setCurrentWarehouse(null);
 setName("");
 setAddress("");
 setBranchId("");
 setIsActive(true);
 }
 setIsModalOpen(true);
 };

 const handleSave = async (e: React.FormEvent) => {
 e.preventDefault();
 const token = localStorage.getItem("token");
 if (!token) return;

 const payload = {
 name,
 address,
 branchId: branchId ? parseInt(branchId) : null,
 active: isActive
 };

 try {
 if (currentWarehouse) {
 // Update
 await fetch(`/api/warehouses/${currentWarehouse.id}`, {
 method: "PUT",
 headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
 body: JSON.stringify(payload)
 });
 } else {
 // Create
 await fetch("/api/warehouses", {
 method: "POST",
 headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
 body: JSON.stringify(payload)
 });
 }
 setIsModalOpen(false);
 fetchData();
 } catch (err) {
 console.error(err);
 alert("Error saving warehouse.");
 }
 };

 const handleDelete = async (id: number) => {
 if (!confirm(t("are_you_sure_delete"))) return;

 const token = localStorage.getItem("token");
 try {
 const res = await fetch(`/api/warehouses/${id}`, {
 method: "DELETE",
 headers: { Authorization: `Bearer ${token}` }
 });
 if (res.ok) fetchData();
 else alert("Cannot delete warehouse. It might have products or invoices tied to it.");
 } catch (e) {
 console.error(e);
 }
 };

 return (
 <div className="p-6">
 <div className="flex justify-between items-center mb-6">
 <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
 <Building className="w-8 h-8 text-primary" />
 {'إدارة المستودعات'}
 </h1>
 <button
 onClick={() => handleOpenModal()}
 className="bg-primary text-white px-4 py-2 rounded shadow flex items-center gap-2 hover:bg-primary/90"
 >
 <Plus size={18} />
 {'إضافة مستودع'}
 </button>
 </div>

 {/* Analytics Banner */}
 {analytics && (
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
 <div className="p-4 bg-emerald-100 text-emerald-600 rounded-full">
 <DollarSign className="w-8 h-8" />
 </div>
 <div>
 <p className="text-sm text-slate-500 font-semibold">{t('sys.str_1506')}</p>
 <h3 className="text-2xl font-bold text-slate-800">{analytics.totalValuationBuy?.toLocaleString()} {t('sys.str_68')}</h3>
 </div>
 </div>
 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
 <div className="p-4 bg-blue-100 text-blue-600 rounded-full">
 <TrendingUp className="w-8 h-8" />
 </div>
 <div>
 <p className="text-sm text-slate-500 font-semibold">{t('sys.str_1507')}</p>
 <h3 className="text-2xl font-bold text-slate-800">{analytics.expectedProfit?.toLocaleString()} {t('sys.str_68')}</h3>
 </div>
 </div>
 <a href="/warehouses/alerts" className="bg-white p-6 rounded-xl border border-red-200 shadow-sm flex items-center gap-4 hover:border-red-300 hover:shadow transition cursor-pointer group">
 <div className="p-4 bg-red-100 text-red-600 rounded-full group-hover:bg-red-500 group-hover:text-white transition-colors">
 <AlertTriangle className="w-8 h-8" />
 </div>
 <div>
 <p className="text-sm text-slate-500 font-semibold">{t('sys.str_1508')}</p>
 <h3 className="text-2xl font-bold text-red-600">{analytics.lowStockCount} {t('sys.str_1509')}</h3>
 </div>
 </a>
 </div>
 )}

 <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
 {loading ? (
 <div className="p-8 text-center text-slate-500">{t("sys.str_168")}</div>
 ) : (
 <table className="w-full text-sm text-left">
 <thead className="bg-slate-50 border-b border-slate-200 ">
 <tr>
 <th className="px-6 py-4">#</th>
 <th className="px-6 py-4">{'الاسم'}</th>
 <th className="px-6 py-4">{'الفرع'}</th>
 <th className="px-6 py-4">{'العنوان'}</th>
 <th className="px-6 py-4">{'الحالة'}</th>
 <th className="px-6 py-4 text-center">{'الإجراءات'}</th>
 </tr>
 </thead>
 <tbody>
 {warehouses.map((wh) => (
 <tr key={wh.id} className="border-b border-slate-100 hover:bg-slate-50">
 <td className="px-6 py-3">#{wh.id}</td>
 <td className="px-6 py-3 font-semibold">{wh.name}</td>
 <td className="px-6 py-3 text-slate-500">
 {wh.branch ? wh.branch.name : "-"}
 </td>
 <td className="px-6 py-3 text-slate-500 dark:text-slate-300">{wh.address || "-"}</td>
 <td className="px-6 py-3">
 <span
 className={`px-3 py-1 rounded-full text-xs font-semibold ${
 wh.active ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
 }`}
 >
 {wh.active ? 'نشط' : 'غير نشط'}
 </span>
 </td>
 <td className="px-6 py-3">
 <div className="flex justify-center gap-3">
 <button
 onClick={() => handleOpenModal(wh)}
 className="text-blue-600 hover:text-blue-800"
 >
 <Edit size={18} />
 </button>
 <button
 onClick={() => handleDelete(wh.id)}
 className="text-red-500 hover:text-red-700"
 >
 <Trash2 size={18} />
 </button>
 </div>
 </td>
 </tr>
 ))}
 {warehouses.length === 0 && (
 <tr>
 <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
 <div className="flex flex-col items-center justify-center gap-2">
 <AlertCircle className="w-8 h-8 text-slate-300" />
 <p>{t("no_warehouses_found")}</p>
 </div>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 )}
 </div>

 {isModalOpen && (
 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
 <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
 <div className="p-6 border-b border-slate-100 flex justify-between items-center">
 <h2 className="text-xl font-bold text-slate-900 ">
 {currentWarehouse ? 'تعديل المستودع' : 'إضافة مستودع'}
 </h2>
 </div>
 
 <form onSubmit={handleSave} className="p-6">
 <div className="space-y-4">
 <div>
 <label className="block text-sm font-semibold mb-1 text-slate-700 ">{'اسم المستودع'} *</label>
 <input
 type="text"
 required
 value={name}
 onChange={(e) => setName(e.target.value)}
 className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:outline-none "
 />
 </div>

 <div>
 <label className="block text-sm font-semibold mb-1 text-slate-700 ">{'ارتباط بفرع'} ({'اختياري'})</label>
 <select
 value={branchId}
 onChange={(e) => setBranchId(e.target.value)}
 className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:outline-none "
 >
 <option value="">{'بدون فرع'}</option>
 {branches.map(b => (
 <option key={b.id} value={b.id}>{b.name}</option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-sm font-semibold mb-1 text-slate-700 ">{'العنوان'} ({'اختياري'})</label>
 <input
 type="text"
 value={address}
 onChange={(e) => setAddress(e.target.value)}
 className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:outline-none "
 />
 </div>

 <div className="flex items-center gap-2">
 <input
 type="checkbox"
 id="wh-active"
 checked={isActive}
 onChange={(e) => setIsActive(e.target.checked)}
 className="w-4 h-4 text-primary rounded"
 />
 <label htmlFor="wh-active" className="text-sm font-semibold select-none cursor-pointer text-slate-700 ">
 {'نشط'}
 </label>
 </div>
 </div>

 <div className="mt-8 flex justify-end gap-3">
 <button
 type="button"
 onClick={() => setIsModalOpen(false)}
 className="px-4 py-2 border rounded text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-700"
 >
 {'إلغاء'}
 </button>
 <button 
 type="submit"
 className="px-4 py-2 bg-primary text-white font-bold rounded shadow hover:bg-primary/90"
 >
 {'حفظ'}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}
