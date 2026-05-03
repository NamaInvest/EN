"use client";

import { useState, useEffect } from "react";
import { Ship, Landmark, LandmarkIcon, Building2, Plus, Info } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

export default function LcManagementPage() {

 const { t } = useTranslation();
 const [lcs, setLcs] = useState<any[]>([]);
 const [banks, setBanks] = useState<any[]>([]);
 const [suppliers, setSuppliers] = useState<any[]>([]);
 
 // Modal state
 const [showNewLc, setShowNewLc] = useState(false);
 const [form, setForm] = useState({
 lcNumber: "", bankId: "", supplierId: "", amount: "", currency: "USD",
 exchangeRate: "3.75", expiryDate: "", marginPercent: "20", marginPaid: "0", portOfLoading: "", portOfDischarge: ""
 });

 useEffect(() => {
 fetchData();
 }, []);

 const fetchData = async () => {
 try {
 const token = localStorage.getItem("token") || "";
 const res = await fetch("/api/accounting/lc", {
 headers: { Authorization: `Bearer ${token}` }
 });
 if (res.ok) {
 const data = await res.json();
 setLcs(data.lcs || []);
 setBanks(data.banks || []);
 setSuppliers(data.suppliers || []);
 }
 } catch (e) {
 console.error(e);
 }
 };

 const handleCreateLc = async () => {
 try {
 const token = localStorage.getItem("token") || "";
 const res = await fetch("/api/accounting/lc", {
 method: "POST",
 headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
 body: JSON.stringify(form)
 });
 if(res.ok) {
 setShowNewLc(false);
 fetchData();
 } else {
 alert(t('fin.str_1716'));
 }
 } catch (e) {
 console.error(e);
 }
 };

 const calcMargin = () => {
 const amt = parseFloat(form.amount) || 0;
 const rate = parseFloat(form.exchangeRate) || 1;
 const per = parseFloat(form.marginPercent) || 0;
 return ((amt * rate) * (per / 100)).toFixed(2);
 };

 return (
 <div className="p-6 max-w-7xl mx-auto">
 <div className="flex justify-between items-center mb-8">
 <div>
 <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
 <Ship className="w-8 h-8 text-blue-600" /> {t('fin.str_1689')}</h1>
 <p className="text-slate-500 mt-2">{t('fin.str_1690')}</p>
 </div>
 <button 
 onClick={() => {
 setForm({...form, lcNumber: `LC-${Math.floor(Math.random() * 100000)}`});
 setShowNewLc(true);
 }}
 className="bg-blue-700 text-white px-5 py-2.5 rounded shadow hover:bg-blue-800 transition flex items-center gap-2 font-bold"
 >
 <Plus size={18} /> {t('fin.str_1691')}</button>
 </div>

 <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
 <table className="w-full text-sm text-left">
 <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
 <tr>
 <th className="px-6 py-4 font-bold text-right">{t('fin.str_1692')}</th>
 <th className="px-6 py-4 font-bold text-right">{t('fin.str_1693')}</th>
 <th className="px-6 py-4 font-bold text-right">{t('fin.str_1694')}</th>
 <th className="px-6 py-4 font-bold text-right">{t('fin.str_1695')}</th>
 <th className="px-6 py-4 font-bold text-right">{t('fin.str_1696')}</th>
 <th className="px-6 py-4 font-bold text-right">{t('fin.str_1697')}</th>
 <th className="px-6 py-4 font-bold text-center">{t('fin.str_227')}</th>
 </tr>
 </thead>
 <tbody>
 {lcs.length === 0 ? (
 <tr><td colSpan={7} className="p-8 text-center text-slate-500">{t('fin.str_1698')}</td></tr>
 ) : lcs.map(lc => (
 <tr key={lc.id} className="border-b border-slate-100 hover:bg-slate-50">
 <td className="px-6 py-4 font-mono font-bold text-blue-600">{lc.lcNumber}</td>
 <td className="px-6 py-4 flex items-center gap-2"><Landmark size={14} className="text-slate-400"/> {lc.bank?.bankName || '-'}</td>
 <td className="px-6 py-4 font-semibold text-slate-700"><Building2 size={14} className="inline text-slate-400 mr-1"/> {lc.supplier?.name || '-'}</td>
 <td className="px-6 py-4 font-bold" dir="ltr">
 {lc.amount.toLocaleString()} <span className="text-xs text-slate-500">{lc.currency}</span>
 </td>
 <td className="px-6 py-4 text-emerald-600 font-bold" dir="ltr">
 {lc.marginPaid.toLocaleString()} <span className="text-xs text-slate-500">SAR</span>
 <div className="text-[10px] text-slate-400">({lc.marginPercent}%)</div>
 </td>
 <td className="px-6 py-4">{new Date(lc.expiryDate).toLocaleDateString('en-GB')}</td>
 <td className="px-6 py-4 text-center">
 <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
 {lc.status === 'draft' ? t('fin.str_1717') : lc.status}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {/* Modal */}
 {showNewLc && (
 <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
 <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
 <h2 className="text-2xl font-bold mb-6 text-slate-800 border-b pb-3 flex items-center gap-2">
 <LandmarkIcon className="text-blue-600" /> {t('fin.str_1699')}</h2>
 
 <div className="grid grid-cols-2 gap-6">
 <div>
 <label className="block text-sm font-semibold mb-1">{t('fin.str_1700')}</label>
 <input type="text" className="w-full p-2 border rounded bg-slate-50" value={form.lcNumber} onChange={e => setForm({...form, lcNumber: e.target.value})} />
 </div>
 <div>
 <label className="block text-sm font-semibold mb-1 text-red-600">{t('fin.str_1701')}</label>
 <input type="date" className="w-full p-2 border rounded border-red-200" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} />
 </div>
 
 <div>
 <label className="block text-sm font-semibold mb-1">{t('fin.str_1702')}</label>
 <select className="w-full p-2 border rounded" value={form.bankId} onChange={e => setForm({...form, bankId: e.target.value})}>
 <option value="">{t('fin.str_1703')}</option>
 {banks.map(b => <option key={b.id} value={b.id}>{b.bankName} ({b.accountNumber})</option>)}
 </select>
 </div>
 <div>
 <label className="block text-sm font-semibold mb-1">{t('fin.str_1704')}</label>
 <select className="w-full p-2 border rounded" value={form.supplierId} onChange={e => setForm({...form, supplierId: e.target.value})}>
 <option value="">{t('fin.str_1705')}</option>
 {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.country || t('fin.str_1718')})</option>)}
 </select>
 </div>

 <div className="col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
 <h3 className="font-bold text-slate-700 mb-3 text-sm">{t('fin.str_1706')}</h3>
 <div className="grid grid-cols-3 gap-4">
 <div>
 <label className="block text-xs mb-1">{t('fin.str_1707')}</label>
 <select className="w-full p-2 border rounded" value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}>
 <option value="USD">{t('purchases.str_1012')}</option>
 <option value="EUR">{t('fin.str_1677')}</option>
 <option value="CNY">{t('fin.str_1708')}</option>
 <option value="SAR">{t('fin.str_1709')}</option>
 </select>
 </div>
 <div>
 <label className="block text-xs mb-1">{t('fin.str_1710')}</label>
 <input type="number" className="w-full p-2 border rounded font-bold" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
 </div>
 <div>
 <label className="block text-xs mb-1">{t('fin.str_1711')}</label>
 <input type="number" step="0.01" className="w-full p-2 border rounded text-slate-600" value={form.exchangeRate} onChange={e => setForm({...form, exchangeRate: e.target.value})} />
 </div>
 </div>
 </div>

 <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 col-span-2">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold text-blue-800 mb-1">{t('fin.str_1712')}</label>
 <div className="flex items-center gap-2">
 <input type="number" className="w-full p-2 border rounded border-blue-200" value={form.marginPercent} onChange={e => setForm({...form, marginPercent: e.target.value, marginPaid: calcMargin()})} />
 <span className="text-slate-500 font-bold">%</span>
 </div>
 </div>
 <div>
 <label className="block text-xs font-bold text-blue-800 mb-1">{t('fin.str_1713')}</label>
 <input type="number" className="w-full p-2 border rounded border-blue-200 bg-white" value={form.marginPaid} onChange={e => setForm({...form, marginPaid: e.target.value})} />
 </div>
 <p className="col-span-2 text-xs text-blue-600 flex items-center gap-1 mt-1">
 <Info size={12}/> {t('fin.str_1714')}</p>
 </div>
 </div>
 </div>

 <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
 <button onClick={() => setShowNewLc(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded font-bold">{t('fin.str_206')}</button>
 <button 
 onClick={handleCreateLc} 
 disabled={!form.expiryDate || !form.bankId || !form.supplierId || !form.amount} 
 className="bg-blue-700 text-white px-8 py-2.5 rounded hover:bg-blue-800 disabled:opacity-50 font-bold shadow-md"
 >
 {t('fin.str_1715')}</button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
