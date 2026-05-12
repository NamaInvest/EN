'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, Printer, Calendar, RefreshCcw, FileText, Trash2, BookOpen, Mail, Plus, Download, Upload, MoreVertical, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import InvoiceReceipt from '@/components/InvoiceReceipt';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

interface Invoice {
    id: number;
    invoiceNo: number;
    date: string;
    total: number;
    paymentType: string;
    customerName: string;
    customerTaxNo?: string;
    details: any[];
    subtotal: number;
    discountValue: number;
    taxValue: number;
    status: 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED';
}

interface Props {
    initialInvoices: Invoice[];
    totalCount: number;
    currentPage: number;
    pageSize: number;
}

export default function InvoiceClient({ initialInvoices, totalCount, currentPage, pageSize }: Props) {
    const { t } = useTranslation();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { error: toastError, success: toastSuccess } = useToast();

    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
    const [isPrinting, setIsPrinting] = useState(false);
    
    // Receipt Modal State
    const [showReceipt, setShowReceipt] = useState(false);
    const [lastInvoiceData, setLastInvoiceData] = useState<any>(null);

    // Filters state
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
    const [dateFilter, setDateFilter] = useState(searchParams.get('date') || '');

    const totalPages = Math.ceil(totalCount / pageSize);

    const updateFilters = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value) params.set(key, value);
        else params.delete(key);
        params.set('page', '1'); // Reset to page 1 on filter change
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        updateFilters('q', searchQuery);
    };

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('');
        setDateFilter('');
        router.push(pathname);
    };

    const toggleRow = (id: number) => {
        const newSet = new Set(selectedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedRows(newSet);
    };

    const toggleAll = () => {
        if (selectedRows.size === initialInvoices.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(initialInvoices.map(inv => inv.id)));
        }
    };

    const deleteInvoice = async (id: number) => {
        if (!confirm('هل أنت متأكد من إلغاء/حذف هذه الفاتورة؟ سيتم عكس المخزون والقيود المحاسبية.')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/sales?id=${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                toastSuccess('تم إلغاء الفاتورة بنجاح');
                router.refresh(); // Refresh server component data
            } else {
                toastError('فشل الإلغاء');
            }
        } catch (error: any) {
            toastError(error.message || 'حدث خطأ');
        }
    };

    const reprintInvoice = (inv: Invoice) => {
        const items = (inv.details || []).map((d: any) => ({
            name: d.productName,
            quantity: d.quantity,
            price: d.price,
            total: d.quantity * d.price * (1 - (d.discountRate || 0) / 100),
        }));

        setLastInvoiceData({
            invoiceId: inv.id,
            invoiceNumber: String(inv.invoiceNo),
            date: inv.date,
            customerName: inv.customerName || t('sys.str_752'),
            customerTaxNo: inv.customerTaxNo,
            paymentMethod: inv.paymentType,
            items,
            subtotal: inv.subtotal,
            discount: inv.discountValue || 0,
            taxRate: 15,
            taxAmount: inv.taxValue,
            grandTotal: inv.total,
            docType: inv.customerTaxNo ? 'standard_invoice' : 'simplified_invoice'
        });
        setShowReceipt(true);
    };

    const renderStatusBadge = (status: string, paymentType: string) => {
        // Simplified status logic for demo based on payment type if actual status is missing
        const isPaid = paymentType.toLowerCase() === 'cash' || paymentType.toLowerCase() === 'card';
        if (isPaid || status === 'PAID') return <span className="badge badge-success" style={{display: 'flex', alignItems: 'center', gap: '4px'}}><CheckCircle size={14}/> مدفوع</span>;
        if (status === 'OVERDUE') return <span className="badge badge-danger" style={{display: 'flex', alignItems: 'center', gap: '4px'}}><AlertCircle size={14}/> متأخر</span>;
        return <span className="badge badge-warning" style={{display: 'flex', alignItems: 'center', gap: '4px'}}><Clock size={14}/> مستحق</span>;
    };

    return (
        <div className="invoice-data-grid">
            {/* Header Actions */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                        <FileText size={28} color="var(--primary)" /> فواتير المبيعات
                    </h1>
                    <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>إدارة الفواتير، التحصيلات، والمستحقات المفتوحة</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-secondary" title="استيراد"><Upload size={18} /> استيراد</button>
                    <button className="btn btn-secondary" title="تصدير Excel"><Download size={18} /> تصدير</button>
                    <button className="btn btn-primary" onClick={() => router.push('/sales')}><Plus size={18} /> فاتورة جديدة</button>
                </div>
            </div>

            {/* Filter Engine */}
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
                <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', alignItems: 'end' }}>
                    <div>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Search size={16} /> بحث عام</label>
                        <input type="text" className="input" placeholder="رقم الفاتورة، اسم العميل..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    <div>
                        <label className="form-label">الحالة</label>
                        <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="">الكل</option>
                            <option value="PAID">مدفوع 🟢</option>
                            <option value="PENDING">مستحق 🟠</option>
                            <option value="OVERDUE">متأخر 🔴</option>
                        </select>
                    </div>
                    <div>
                        <label className="form-label"><Calendar size={16} style={{display:'inline', marginRight:'4px'}}/> التاريخ</label>
                        <input type="date" className="input" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={clearFilters} title="مسح الفلاتر"><RefreshCcw size={18} /> مسح</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>تطبيق</button>
                    </div>
                </form>
            </div>

            {/* Bulk Actions Bar */}
            {selectedRows.size > 0 && (
                <div className="bulk-actions-bar" style={{ background: 'var(--primary-light)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--primary)' }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--primary-dark)' }}>محدد: {selectedRows.size} فواتير</span>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn btn-secondary btn-sm"><Printer size={16} /> طباعة مجمعة</button>
                        <button className="btn btn-secondary btn-sm"><Mail size={16} /> إرسال للعملاء</button>
                        <button className="btn btn-danger btn-sm"><Trash2 size={16} /> إلغاء المحدد</button>
                    </div>
                </div>
            )}

            {/* Data Table */}
            <div className="card table-container" style={{ overflow: 'visible' }}>
                <table className="table">
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}>
                                <input type="checkbox" checked={selectedRows.size === initialInvoices.length && initialInvoices.length > 0} onChange={toggleAll} />
                            </th>
                            <th>الرقم</th>
                            <th>التاريخ</th>
                            <th>العميل</th>
                            <th>الإجمالي</th>
                            <th>الحالة</th>
                            <th style={{ textAlign: 'center' }}>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {initialInvoices.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>لا توجد فواتير مطابقة</td></tr>
                        ) : (
                            initialInvoices.map(inv => (
                                <tr key={inv.id} className={selectedRows.has(inv.id) ? 'selected-row' : ''} style={{ background: selectedRows.has(inv.id) ? 'var(--bg-hover)' : 'inherit' }}>
                                    <td>
                                        <input type="checkbox" checked={selectedRows.has(inv.id)} onChange={() => toggleRow(inv.id)} />
                                    </td>
                                    <td style={{ fontWeight: 'bold' }}>INV-{inv.invoiceNo}</td>
                                    <td style={{ direction: 'ltr', textAlign: 'right' }}>{new Date(inv.date).toLocaleDateString('en-GB')}</td>
                                    <td>{inv.customerName || <span className="badge badge-gray">عميل نقدي</span>}</td>
                                    <td style={{ fontWeight: 'bold' }}>{Number(inv.total).toLocaleString('en-US', {minimumFractionDigits:2})} ر.س</td>
                                    <td>{renderStatusBadge(inv.status, inv.paymentType)}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => reprintInvoice(inv)} title="طباعة"><Printer size={16} /></button>
                                            <button className="btn btn-danger btn-sm" onClick={() => deleteInvoice(inv.id)} title="إلغاء"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Server-Side Pagination Controls */}
            {totalPages > 1 && (
                <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                    <div style={{ color: 'var(--text-muted)' }}>
                        عرض {(currentPage - 1) * pageSize + 1} إلى {Math.min(currentPage * pageSize, totalCount)} من أصل {totalCount} فاتورة
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button 
                            className="btn btn-secondary btn-sm" 
                            disabled={currentPage === 1}
                            onClick={() => updateFilters('page', String(currentPage - 1))}
                        >
                            السابق
                        </button>
                        <span style={{ fontWeight: 'bold', padding: '0 1rem' }}>صفحة {currentPage} من {totalPages}</span>
                        <button 
                            className="btn btn-secondary btn-sm" 
                            disabled={currentPage === totalPages}
                            onClick={() => updateFilters('page', String(currentPage + 1))}
                        >
                            التالي
                        </button>
                    </div>
                </div>
            )}

            {showReceipt && lastInvoiceData && (
                <InvoiceReceipt invoiceData={lastInvoiceData} onClose={() => setShowReceipt(false)} />
            )}
        </div>
    );
}
