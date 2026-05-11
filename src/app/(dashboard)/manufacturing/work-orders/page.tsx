"use client";

import React, { useState, useEffect } from 'react';
import { Cog, Plus, PlayCircle, CheckCircle2, Factory, Search, AlertCircle, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function WorkOrdersPage() {
 const { success, info } = useToast();

 const [orders, setOrders] = useState<any[]>([]);
 const [recipes, setRecipes] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [notification, setNotification] = useState<{type: 'success'|'error', message: string} | null>(null);
 const [searchQuery, setSearchQuery] = useState('');

 // Form
 const [isFormOpen, setIsFormOpen] = useState(false);
 const [recipeId, setRecipeId] = useState('');
 const [quantity, setQuantity] = useState('1');
 const [startDate, setStartDate] = useState('');

 // Completion Modal
 const [completionModal, setCompletionModal] = useState(false);
 const [selectedOrder, setSelectedOrder] = useState<any>(null);
 const [completionData, setCompletionData] = useState({
 yieldQty: 0,
 yieldWeight: 0,
 wastageWeight: 0,
 reason: '',
 wastagePhotoUrl: '',
 serialOrBatchNumber: ''
 });

 useEffect(() => {
 fetchOrders();
 fetchRecipes();
 }, []);

 const fetchOrders = async () => {
 try {
 const res = await fetch('/api/manufacturing/work-orders');
 if (res.ok) setOrders(await res.json());
 } catch (error) {
 console.error(error);
 } finally {
 setLoading(false);
 }
 };

 const fetchRecipes = async () => {
 try {
 const res = await fetch('/api/manufacturing/bom');
 if (res.ok) setRecipes(await res.json());
 } catch (error) {
 console.error(error);
 }
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 try {
 const res = await fetch('/api/manufacturing/work-orders', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 recipeId,
 quantityToProduce: quantity,
 startDate: startDate || new Date().toISOString()
 })
 });
 const data = await res.json();
 if (res.ok) {
 setNotification({ type: 'success', message: data.message });
 setIsFormOpen(false);
 fetchOrders();
 } else {
 setNotification({ type: 'error', message: data.error });
 }
 } catch (error) {
 setNotification({ type: 'error', message: 'Network error' });
 } finally {
 setLoading(false);
 }
 };

 const updateStatus = async (id: number, status: string) => {
 if (!confirm('هل أنت متأكد من تغيير حالة أمر التشغيل؟ (هذا سيؤثر على المخزون وتكاليف WIP)')) return;
 setLoading(true);
 try {
 const res = await fetch('/api/manufacturing/work-orders', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ id, status })
 });
 if (res.ok) {
 setNotification({ type: 'success', message: 'تم تحديث أمر التشغيل وجدولة التكاليف بنجاح' });
 fetchOrders();
 } else {
 setNotification({ type: 'error', message: 'فشل التحديث' });
 }
 } catch (error) {
 setNotification({ type: 'error', message: 'Network error' });
 } finally {
 setLoading(false);
 }
 };

 const openCompletionModal = (order: any) => {
 setSelectedOrder(order);
 setCompletionData({
 yieldQty: order.quantityToProduce,
 yieldWeight: 0,
 wastageWeight: 0,
 reason: '',
 wastagePhotoUrl: '',
 serialOrBatchNumber: ''
 });
 setCompletionModal(true);
 };

 const submitCompletion = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 try {
 const res = await fetch('/api/manufacturing/work-orders', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ 
 id: selectedOrder.id, 
 status: 'completed',
 completionData 
 })
 });
 if (res.ok) {
 setNotification({ type: 'success', message: 'تم إقفال الأمر واستلام المخرجات بنجاح' });
 setCompletionModal(false);
 fetchOrders();
 } else {
 setNotification({ type: 'error', message: 'فشل التحديث' });
 }
 } catch (error) {
 setNotification({ type: 'error', message: 'Network error' });
 } finally {
 setLoading(false);
 }
 };

 const getStatusColor = (status: string) => {
 switch(status) {
 case 'in_progress': return 'text-amber-700 bg-amber-50 border border-amber-200';
 case 'completed': return 'text-emerald-700 bg-emerald-50 border border-emerald-200';
 default: return 'text-slate-600 bg-slate-100 border border-slate-200';
 }
 };

 const getStatusLabel = (status: string) => {
 switch(status) {
 case 'in_progress': return 'قيد الإنتاج (WIP)';
 case 'completed': return 'مكتمل (تام)';
 default: return 'مسودة (مجدول)';
 }
 };

 return (
 <div className="p-6 lg:p-10 font-sans animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="max-w-7xl mx-auto space-y-8">
 
 {/* Header Section */}
 <div className="flex items-center justify-between card p-6">
 <div className="flex items-center space-x-4 space-x-reverse">
 <div className="p-4 bg-orange-50 rounded-2xl">
 <Factory className="w-8 h-8 text-orange-600" />
 </div>
 <div>
 <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">أوامر التشغيل (Work Orders)</h1>
 <p className="text-slate-500 mt-1 font-medium">جدولة الإنتاج، سحب الخامات وحسابات WIP</p>
 </div>
 </div>
 <button onClick={() => setIsFormOpen(!isFormOpen)} className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-600/20">
 {isFormOpen ? 'إلغاء' : <><Plus className="w-5 h-5 ml-2" /> أمر تشغيل جديد</>}
 </button>
 </div>

 {notification && (
 <div className={`p-4 rounded-xl flex items-center space-x-3 space-x-reverse ${notification.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
 {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
 <span className="font-medium">{notification.message}</span>
 </div>
 )}

 {/* Create Form */}
 {isFormOpen && (
 <form onSubmit={handleSubmit} className="card p-8 animate-in fade-in slide-in-from-top-4">
 <h2 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">إصدار أمر إنتاج جديد</h2>
 
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
 <div>
 <label className="block text-sm font-bold text-slate-600 mb-2">اختر الوصفة (BOM)</label>
 <select required value={recipeId} onChange={e => setRecipeId(e.target.value)} className="input">
 <option value="">اختر الوصفة...</option>
 {recipes.map(r => <option key={r.id} value={r.id}>{r.name} - لإنتاج ({r.finishedProduct?.name})</option>)}
 </select>
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-600 mb-2">الكمية المستهدفة</label>
 <input required type="number" min="1" step="0.1" value={quantity} onChange={e => setQuantity(e.target.value)} className="input" />
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-600 mb-2">تاريخ البدء المجدول</label>
 <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input" />
 </div>
 </div>

 <div className="flex justify-end pt-4 border-t border-slate-100">
 <button disabled={loading} type="submit" className="flex items-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-600/20 disabled:opacity-50">
 {loading ? 'جاري الجدولة...' : <><Cog className="w-5 h-5 ml-2" /> اعتماد أوامر التشغيل</>}
 </button>
 </div>
 </form>
 )}

 {/* Completion Modal */}
 {completionModal && selectedOrder && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
 <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl border border-slate-200 overflow-hidden">
 <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
 <h3 className="text-xl font-extrabold text-slate-900 flex items-center">
 <CheckCircle2 className="w-6 h-6 ml-2 text-emerald-600" />
 إقفال أمر التشغيل واستلام المخرجات
 </h3>
 </div>
 
 <form onSubmit={submitCompletion} className="p-6 space-y-6">
 <div className="grid grid-cols-2 gap-6">
 <div className="space-y-4">
 <h4 className="text-emerald-700 font-bold border-b border-slate-100 pb-2">المخرجات (المنتج التام)</h4>
 <div>
 <label className="block text-sm font-bold text-slate-600 mb-1">الكمية الفعلية (Yield Qty)</label>
 <input type="number" step="0.01" required value={completionData.yieldQty} onChange={e => setCompletionData({...completionData, yieldQty: parseFloat(e.target.value) || 0})} className="input" />
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-600 mb-1">الوزن الفعلي (Yield Weight)</label>
 <input type="number" step="0.01" value={completionData.yieldWeight} onChange={e => setCompletionData({...completionData, yieldWeight: parseFloat(e.target.value) || 0})} className="input" />
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-600 mb-1">رقم الدفعة / السيريال (Batch)</label>
 <input type="text" value={completionData.serialOrBatchNumber} onChange={e => setCompletionData({...completionData, serialOrBatchNumber: e.target.value})} className="input" />
 </div>
 </div>
 
 <div className="space-y-4 border-r border-slate-100 pr-6">
 <h4 className="text-red-600 font-bold border-b border-slate-100 pb-2">الهالك (Wastage)</h4>
 <div>
 <label className="block text-sm font-bold text-slate-600 mb-1">وزن الهالك</label>
 <input type="number" step="0.01" value={completionData.wastageWeight} onChange={e => setCompletionData({...completionData, wastageWeight: parseFloat(e.target.value) || 0})} className="input" />
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-600 mb-1">سبب الهالك</label>
 <input type="text" value={completionData.reason} onChange={e => setCompletionData({...completionData, reason: e.target.value})} className="input" />
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-600 mb-1">صورة إثبات الهالك (URL/Path)</label>
 <input type="text" placeholder="https://..." value={completionData.wastagePhotoUrl} onChange={e => setCompletionData({...completionData, wastagePhotoUrl: e.target.value})} className="input" />
 <p className="text-xs font-medium text-slate-500 mt-1">أرفق رابط صورة توثيق وزن الهالك إن لزم</p>
 </div>
 </div>
 </div>
 
 <div className="flex justify-end space-x-3 space-x-reverse pt-4 border-t border-slate-100">
 <button type="button" onClick={() => setCompletionModal(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">إلغاء</button>
 <button disabled={loading} type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center">
 {loading ? 'جاري المعالجة...' : 'اعتماد وإنشاء القيود'}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* Orders List */}
 <div className="table-container shadow-sm">
 <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
 <h2 className="text-xl font-extrabold text-slate-900 flex items-center">
 سجل أوامر التشغيل
 </h2>
 <div className="relative">
 <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
 <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث برقم الأمر أو المنتج..." className="input pl-4 pr-10 py-2 w-64" />
 </div>
 </div>
 
 <div className="overflow-x-auto bg-white">
 <table className="table">
 <thead>
 <tr>
 <th>رقم الأمر</th>
 <th>المنتج النهائي</th>
 <th>الكمية</th>
 <th>تاريخ البدء</th>
 <th>الحالة</th>
 <th>تكلفة WIP المبدئية</th>
 <th>إجراءات (Actions)</th>
 </tr>
 </thead>
 <tbody>
 {loading && orders.length === 0 ? (
 <tr><td colSpan={7} className="text-center py-10 text-slate-500 font-medium">جاري تحميل البيانات...</td></tr>
 ) : (
 orders.filter(o => 
   !searchQuery || 
   o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || 
   (o.recipe?.finishedProduct?.name || o.recipe?.name)?.toLowerCase().includes(searchQuery.toLowerCase())
 ).map((order) => (
 <tr key={order.id}>
 <td className="font-mono text-blue-600 font-extrabold">{order.orderNumber}</td>
 <td className="font-bold text-slate-900">{order.recipe?.finishedProduct?.name || order.recipe?.name}</td>
 <td className="font-mono font-bold">{order.quantityToProduce}</td>
 <td className="font-mono font-bold text-slate-600">{new Date(order.startDate).toLocaleDateString('en-GB')}</td>
 <td>
 <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
 {getStatusLabel(order.status)}
 </span>
 </td>
 <td className="font-mono text-slate-900 font-extrabold">{order.totalCost.toFixed(2)} SAR</td>
 <td>
 <div className="flex space-x-2 space-x-reverse">
 {order.status === 'draft' && (
 <button onClick={() => updateStatus(order.id, 'in_progress')} className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold transition-colors">
 <PlayCircle className="w-4 h-4 ml-1" /> بدء التصنيع
 </button>
 )}
 {order.status === 'in_progress' && (
 <button onClick={() => openCompletionModal(order)} className="flex items-center px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-colors">
 <CheckCircle2 className="w-4 h-4 ml-1" /> إقفال واستلام
 </button>
 )}
 </div>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </div>
 );
}
