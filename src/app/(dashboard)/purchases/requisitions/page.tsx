'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Search, Plus, ClipboardList, Clock, CheckCircle, XCircle, Trash2,
    Package, RefreshCw, X, AlertCircle, Eye
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';
import { usePagePermission } from '@/lib/usePagePermission';

interface RequisitionDetail {
    id: number;
    productId: number;
    productName: string | null;
    quantity: number;
    notes: string | null;
    product?: {
        name: string;
        imagePath: string | null;
    };
}

interface Requisition {
    id: number;
    reqNo: number;
    date: string;
    department: string | null;
    status: string;
    notes: string | null;
    requester?: {
        fullName: string;
        username: string;
    } | null;
    approver?: {
        fullName: string;
    } | null;
    details: RequisitionDetail[];
}

interface Product {
    id: number;
    name: string;
    barcode: string | null;
}

export default function PurchaseRequisitionsPage() {
    const { t, lang } = useTranslation();
    const allowed = usePagePermission(['purchase_requisitions', 'purchase_reqs', 'purchase_orders']);
    const { error: toastError, success: toastSuccess } = useToast();
    const router = useRouter();

    // Data States
    const [requisitions, setRequisitions] = useState<Requisition[]>([]);
    const [productsList, setProductsList] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [expanded, setExpanded] = useState<number | null>(null);

    // Filters States
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Creation Modal States
    const [showModal, setShowModal] = useState(false);
    const [newDepartment, setNewDepartment] = useState('General');
    const [newNotes, setNewNotes] = useState('');
    const [newItems, setNewItems] = useState<{ productId: string; quantity: number; notes: string }[]>([
        { productId: '', quantity: 1, notes: '' }
    ]);

    // Load Data
    useEffect(() => {
        if (allowed) {
            loadRequisitions();
            loadProducts();
        }
    }, [allowed]);

    async function loadRequisitions() {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/purchases/requisitions', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.status === 401 || res.status === 403) {
                setError('غير مصرح لك بعرض طلبات الشراء');
                setLoading(false);
                return;
            }
            if (res.ok) {
                const data = await res.json();
                setRequisitions(data);
            } else {
                setError('حدث خطأ أثناء تحميل البيانات من الخادم');
            }
        } catch (e: any) {
            setError(e?.message || 'حدث خطأ غير متوقع');
        }
        setLoading(false);
    }

    async function loadProducts() {
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch('/api/products', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProductsList(data);
            }
        } catch (e) {}
    }

    const handleUpdateStatus = async (id: number, newStatus: string) => {
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch(`/api/purchases/requisitions/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                toastSuccess(newStatus === 'approved' ? 'تمت الموافقة على طلب الشراء بنجاح' : 'تم رفض طلب الشراء');
                loadRequisitions();
            } else {
                const err = await res.json();
                toastError(err.error || 'فشل تحديث حالة الطلب');
            }
        } catch (e) {
            toastError('حدث خطأ في الشبكة');
        }
    };

    const handleCreateRequisition = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!newDepartment.trim()) {
            toastError('يرجى تحديد القسم');
            return;
        }

        const validItems = newItems.filter(item => item.productId !== '' && item.quantity > 0);
        if (validItems.length === 0) {
            toastError('يرجى إضافة بند واحد صالح على الأقل بكمية أكبر من صفر');
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem('token') || '';
            const payload = {
                department: newDepartment,
                notes: newNotes,
                items: validItems.map(item => {
                    const selectedProd = productsList.find(p => p.id === parseInt(item.productId, 10));
                    return {
                        productId: parseInt(item.productId, 10),
                        productName: selectedProd?.name || '',
                        quantity: Number(item.quantity) || 1,
                        notes: item.notes || ''
                    };
                })
            };

            const res = await fetch('/api/purchases/requisitions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toastSuccess('تم تقديم طلب الشراء بنجاح');
                setShowModal(false);
                setNewDepartment('General');
                setNewNotes('');
                setNewItems([{ productId: '', quantity: 1, notes: '' }]);
                loadRequisitions();
            } else {
                const err = await res.json();
                toastError(err.error || 'فشل تقديم طلب الشراء');
            }
        } catch (err: any) {
            toastError(err?.message || 'حدث خطأ في الشبكة');
        }
        setSaving(false);
    };

    const addItemRow = () => {
        setNewItems([...newItems, { productId: '', quantity: 1, notes: '' }]);
    };

    const removeItemRow = (idx: number) => {
        if (newItems.length === 1) return;
        setNewItems(newItems.filter((_, i) => i !== idx));
    };

    const updateItemValue = (idx: number, key: string, value: any) => {
        const updated = [...newItems];
        updated[idx] = { ...updated[idx], [key]: value };
        setNewItems(updated);
    };

    // Filters and Searching logic
    const filteredRequisitions = useMemo(() => {
        return requisitions.filter(r => {
            const matchesSearch = searchQuery === '' ||
                r.reqNo.toString().includes(searchQuery) ||
                (r.department || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (r.notes || '').toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = statusFilter === 'all' || r.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [requisitions, searchQuery, statusFilter]);

    // KPI Counts
    const pendingCount = useMemo(() => requisitions.filter(r => r.status === 'pending').length, [requisitions]);
    const approvedCount = useMemo(() => requisitions.filter(r => r.status === 'approved').length, [requisitions]);

    if (allowed === null) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center font-[Fira_Sans]">
                <div className="text-center space-y-4">
                    <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
                    <p className="text-slate-500 font-bold">جاري التحقق من صلاحيات الوصول...</p>
                </div>
            </div>
        );
    }

    if (allowed === false) return null;

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6 font-[Fira_Sans]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                        <ClipboardList className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        {lang === 'ar' ? 'طلبات الشراء' : 'Purchase Requisitions'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {lang === 'ar' ? 'الطلبات الداخلية للسلع والخدمات.' : 'Internal requests for goods and services.'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/purchase-orders">
                        <Button variant="outline" className="bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                            {lang === 'ar' ? 'عرض أوامر الشراء' : 'View POs'}
                        </Button>
                    </Link>
                    <Button
                        onClick={() => setShowModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1"
                    >
                        <Plus className="w-4 h-4" />
                        {lang === 'ar' ? 'طلب جديد' : 'New Request'}
                    </Button>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:to-slate-950 border-indigo-100 dark:border-slate-800 shadow-sm">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                {lang === 'ar' ? 'بانتظار الموافقة' : 'Pending Approvals'}
                            </p>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2 font-[Fira_Code]">{pendingCount}</h3>
                        </div>
                        <Clock className="w-10 h-10 text-indigo-500/30" />
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                {lang === 'ar' ? 'تمت الموافقة (جاهز لأمر الشراء)' : 'Approved (Ready for PO)'}
                            </p>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2 font-[Fira_Code]">{approvedCount}</h3>
                        </div>
                        <CheckCircle className="w-10 h-10 text-green-500/30" />
                    </CardContent>
                </Card>
            </div>

            {/* Data Grid with Filters */}
            <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/40">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-4 bg-white/50 dark:bg-slate-900/80">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={lang === 'ar' ? 'بحث بالقسم أو الملاحظات...' : 'Search PRs, departments, notes...'}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/55 dark:text-white"
                        />
                    </div>
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">{lang === 'ar' ? 'كل الحالات' : 'All Statuses'}</option>
                            <option value="pending">{lang === 'ar' ? 'بانتظار الموافقة' : 'Pending'}</option>
                            <option value="approved">{lang === 'ar' ? 'تمت الموافقة' : 'Approved'}</option>
                            <option value="rejected">{lang === 'ar' ? 'مرفوض' : 'Rejected'}</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center space-y-4">
                        <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
                        <p className="text-slate-500 font-bold">{lang === 'ar' ? 'جاري تحميل البيانات...' : 'Loading data...'}</p>
                    </div>
                ) : error ? (
                    <div className="p-12 text-center space-y-4">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                        <p className="text-red-500 font-bold">{error}</p>
                        <Button onClick={loadRequisitions} variant="outline" className="border-indigo-200 text-indigo-600">
                            {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-650 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                <tr>
                                    <th className="px-5 py-3.5 font-bold text-right">Req #</th>
                                    <th className="px-5 py-3.5 font-bold text-right">{lang === 'ar' ? 'القسم' : 'Department'}</th>
                                    <th className="px-5 py-3.5 font-bold text-right">{lang === 'ar' ? 'مقدم الطلب' : 'Requested By'}</th>
                                    <th className="px-5 py-3.5 font-bold text-right">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                                    <th className="px-5 py-3.5 font-bold text-right">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                                    <th className="px-5 py-3.5 font-bold text-right">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-[#0b1120]/20">
                                {filteredRequisitions.map((req) => (
                                    <React.Fragment key={req.id}>
                                        <tr
                                            className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors cursor-pointer"
                                            onClick={() => setExpanded(expanded === req.id ? null : req.id)}
                                        >
                                            <td className="px-5 py-4 font-bold text-gray-900 dark:text-white text-right font-[Fira_Code]">
                                                PR-{req.reqNo}
                                            </td>
                                            <td className="px-5 py-4 text-gray-700 dark:text-slate-350 text-right font-semibold">
                                                {req.department || 'General'}
                                            </td>
                                            <td className="px-5 py-4 text-gray-750 dark:text-slate-350 text-right">
                                                {req.requester?.fullName || 'Unknown User'}
                                            </td>
                                            <td className="px-5 py-4 text-gray-500 dark:text-slate-400 text-right font-[Fira_Code]">
                                                {format(new Date(req.date), 'yyyy-MM-dd HH:mm')}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                                                    req.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-450 dark:border-green-900/40' :
                                                    req.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-450 dark:border-red-900/40' :
                                                    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/40'
                                                }`}>
                                                    {req.status === 'approved' ? (lang === 'ar' ? 'معتمد' : 'Approved') :
                                                     req.status === 'rejected' ? (lang === 'ar' ? 'مرفوض' : 'Rejected') :
                                                     (lang === 'ar' ? 'بانتظار الموافقة' : 'Pending')}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                {req.status === 'pending' && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-green-600 hover:text-green-700 hover:bg-green-55 dark:hover:bg-green-950/20"
                                                            title={lang === 'ar' ? 'موافقة' : 'Approve'}
                                                            onClick={() => handleUpdateStatus(req.id, 'approved')}
                                                        >
                                                            <CheckCircle className="w-5 h-5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-55 dark:hover:bg-red-950/20"
                                                            title={lang === 'ar' ? 'refuse' : 'Reject'}
                                                            onClick={() => handleUpdateStatus(req.id, 'rejected')}
                                                        >
                                                            <XCircle className="w-5 h-5" />
                                                        </Button>
                                                    </>
                                                )}
                                                {req.status === 'approved' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/20 font-bold"
                                                        onClick={() => router.push(`/purchase-orders?convertPrId=${req.id}`)}
                                                    >
                                                        {lang === 'ar' ? 'تحويل لأمر شراء' : 'Convert to PO'}
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-indigo-650 hover:text-indigo-750 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/20"
                                                    onClick={() => setExpanded(expanded === req.id ? null : req.id)}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>

                                        {/* Expanded details */}
                                        {expanded === req.id && (
                                            <tr className="bg-slate-50/50 dark:bg-slate-900/40">
                                                <td colSpan={6} className="px-8 py-4">
                                                    <div className="space-y-3">
                                                        <div>
                                                            <span className="font-bold text-slate-500 text-xs block mb-1">{lang === 'ar' ? 'ملاحظات الطلب:' : 'Request Notes:'}</span>
                                                            <p className="text-slate-800 dark:text-slate-200 text-sm font-semibold">{req.notes || (lang === 'ar' ? 'لا توجد ملاحظات' : 'No notes')}</p>
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-slate-500 text-xs block mb-2">{lang === 'ar' ? 'الأصناف والمواد المطلوبة:' : 'Requested Items & Quantities:'}</span>
                                                            <div className="border border-slate-200 dark:border-slate-850 rounded-xl overflow-hidden bg-white dark:bg-[#0b1120]/80">
                                                                <table className="w-full text-right text-xs">
                                                                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs border-b dark:border-slate-850">
                                                                        <tr>
                                                                            <th className="px-4 py-2.5 font-bold text-right">{lang === 'ar' ? 'الصنف المطلوب' : 'Item Name'}</th>
                                                                            <th className="px-4 py-2.5 font-bold text-center w-36">{lang === 'ar' ? 'الكمية المطلوبة' : 'Quantity'}</th>
                                                                            <th className="px-4 py-2.5 font-bold text-right">{lang === 'ar' ? 'ملاحظات الصنف' : 'Item Notes'}</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                                                                        {req.details.map((detail) => (
                                                                            <tr key={detail.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                                                                                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white text-right">
                                                                                    {detail.product?.name || detail.productName || 'Unknown Product'}
                                                                                </td>
                                                                                <td className="px-4 py-3 text-center text-slate-800 dark:text-slate-200 font-bold font-[Fira_Code]">
                                                                                    {Number(detail.quantity).toLocaleString()}
                                                                                </td>
                                                                                <td className="px-4 py-3 text-slate-500 text-right">
                                                                                    {detail.notes || '--'}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}

                                {filteredRequisitions.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center">
                                                <ClipboardList className="w-12 h-12 text-gray-300 dark:text-slate-700 mb-3 animate-pulse" />
                                                <p className="text-lg font-medium text-gray-900 dark:text-white">{lang === 'ar' ? 'لا توجد طلبات شراء مطابقة' : 'No matching purchase requisitions'}</p>
                                                <Button
                                                    onClick={() => setShowModal(true)}
                                                    className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center gap-1.5"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    {lang === 'ar' ? 'إنشاء أول طلب' : 'Create First Request'}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Creation Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 transition-all duration-300">
                        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center font-[Fira_Sans]">
                                <ClipboardList className="w-5.5 h-5.5 ml-2 text-indigo-600 dark:text-indigo-400" />
                                {lang === 'ar' ? 'تفاصيل طلب الشراء الجديد' : 'New Purchase Requisition Details'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-650 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateRequisition} className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Department select */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2">{lang === 'ar' ? 'القسم الطالب' : 'Requested Department'}</label>
                                    <select
                                        value={newDepartment}
                                        onChange={(e) => setNewDepartment(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    >
                                        <option value="General">{lang === 'ar' ? 'الإدارة العامة' : 'General Management'}</option>
                                        <option value="IT">{lang === 'ar' ? 'قسم تقنية المعلومات' : 'IT Department'}</option>
                                        <option value="HR">{lang === 'ar' ? 'الموارد البشرية' : 'Human Resources'}</option>
                                        <option value="Sales">{lang === 'ar' ? 'المبيعات' : 'Sales'}</option>
                                        <option value="Marketing">{lang === 'ar' ? 'التسويق' : 'Marketing'}</option>
                                        <option value="Operations">{lang === 'ar' ? 'العمليات والتشغيل' : 'Operations'}</option>
                                        <option value="Accounting">{lang === 'ar' ? 'الحسابات والمالية' : 'Accounting & Finance'}</option>
                                    </select>
                                </div>

                                {/* General Notes */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-2">{lang === 'ar' ? 'ملاحظات ومبررات الطلب' : 'Requisition Notes & Justification'}</label>
                                    <input
                                        type="text"
                                        value={newNotes}
                                        onChange={(e) => setNewNotes(e.target.value)}
                                        placeholder={lang === 'ar' ? 'اكتب تبرير الطلب أو أي ملاحظات هامة...' : 'Write request context or justification...'}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Requisition items table */}
                            <div>
                                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-850 pb-2 mb-4">
                                    {lang === 'ar' ? 'أصناف ومواد الطلب' : 'Requisition Items'}
                                </h3>

                                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/20">
                                    <table className="w-full text-right text-xs">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b dark:border-slate-800">
                                            <tr>
                                                <th className="px-4 py-3 font-bold text-right">{lang === 'ar' ? 'الصنف المطلوب' : 'Product/Item'}</th>
                                                <th className="px-4 py-3 font-bold w-32 text-center">{lang === 'ar' ? 'الكمية' : 'Quantity'}</th>
                                                <th className="px-4 py-3 font-bold text-right">{lang === 'ar' ? 'ملاحظات البند' : 'Line Notes'}</th>
                                                <th className="px-4 py-3 font-bold w-16 text-center"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-[#0b1120]">
                                            {newItems.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-2.5">
                                                        <select
                                                            value={item.productId}
                                                            onChange={(e) => updateItemValue(idx, 'productId', e.target.value)}
                                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-855 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                                                        >
                                                            <option value="">{lang === 'ar' ? 'اختر الصنف المطلوب...' : 'Select product...'}</option>
                                                            {productsList.map(p => (
                                                                <option key={p.id} value={p.id}>{p.name} {p.barcode ? `(${p.barcode})` : ''}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            step="1"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItemValue(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-855 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white font-[Fira_Code]"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <input
                                                            type="text"
                                                            value={item.notes}
                                                            onChange={(e) => updateItemValue(idx, 'notes', e.target.value)}
                                                            placeholder={lang === 'ar' ? 'مواصفات خاصة بالبند...' : 'Line specific specs...'}
                                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-855 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeItemRow(idx)}
                                                            disabled={newItems.length === 1}
                                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/25 rounded-lg transition-colors disabled:opacity-30"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-3 flex justify-start">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addItemRow}
                                        className="border-dashed border-indigo-300 text-indigo-650 hover:bg-indigo-50 dark:border-indigo-850 dark:text-indigo-400 dark:hover:bg-indigo-950/20"
                                    >
                                        <Plus className="w-4 h-4 mr-1.5" />
                                        {lang === 'ar' ? 'إضافة بند آخر' : 'Add Item Line'}
                                    </Button>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-850/50 rounded-xl flex items-center justify-between border border-slate-100 dark:border-slate-800">
                                <span className="text-xs font-bold text-slate-500">{lang === 'ar' ? '* تأكد من إدخال كميات صحيحة لجميع البنود قبل الحفظ' : '* Verify quantities are correct before saving.'}</span>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowModal(false)}
                                        className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-350 border-slate-200 dark:border-slate-700"
                                    >
                                        {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5"
                                    >
                                        {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                                        {lang === 'ar' ? 'إرسال طلب الشراء' : 'Submit Requisition'}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
