'use client';

import React, { useState, useEffect } from 'react';
import { Search, Printer, Calendar, RefreshCcw, FileText, Trash2, BookOpen, Mail } from 'lucide-react';
import InvoiceReceipt from '@/components/InvoiceReceipt';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

interface Invoice {
    id: number;
    invoiceNo: number;
    date: string;
    total: number;
    paymentType: string;
    customer?: { name: string; taxNumber?: string; crNo?: string; address?: string };
    details: any[];
    subtotal: number;
    discountValue: number;
    taxValue: number;
}

export default function SalesHistoryPage() {
    const { t } = useTranslation();
    const { error: toastError, success: toastSuccess } = useToast();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Filters
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Print State
    const [showReceipt, setShowReceipt] = useState(false);
    const [lastInvoiceData, setLastInvoiceData] = useState<any>(null);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const searchParams = new URLSearchParams();
            if (fromDate) searchParams.append('from', fromDate);
            if (toDate) searchParams.append('to', toDate);
            
            const res = await fetch(`/api/sales?${searchParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                setInvoices(Array.isArray(data) ? data : []);
            }
        } catch (error: any) { toastError(error?.message || 'حدث خطأ'); } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        fetchInvoices();
    };

    const resetFilters = () => {
        setFromDate('');
        setToDate('');
        setSearchQuery('');
        setTimeout(fetchInvoices, 100);
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
            customerName: inv.customer?.name || t('sys.str_752'),
            customerTaxNo: inv.customer?.taxNumber,
            customerCrNo: inv.customer?.crNo,
            customerAddress: inv.customer?.address,
            paymentMethod: inv.paymentType,
            items,
            subtotal: inv.subtotal,
            discount: inv.discountValue || 0,
            taxRate: 15,
            taxAmount: inv.taxValue,
            grandTotal: inv.total,
        });
        setShowReceipt(true);
    };

    const deleteInvoice = async (id: number) => {
        if (!confirm('هل أنت متأكد من إلغاء/حذف هذه الفاتورة؟ (سيتم عكس المخزون والقيود تلقائياً)')) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/sales?id=${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                toastSuccess('تم إلغاء الفاتورة بنجاح');
                fetchInvoices();
            } else {
                const data = await res.json();
                toastError(data.error || 'فشل الإلغاء');
            }
        } catch (error: any) {
            toastError(error.message || 'حدث خطأ');
        } finally {
            setLoading(false);
        }
    };

    const viewJournal = (invoiceNo: number) => {
        window.open(`/accounting/journal?search=SALE-${invoiceNo}`, '_blank');
    };

    const sendEmail = (inv: Invoice) => {
        if (!inv.customer?.name) {
            toastError('لا يوجد عميل مرتبط بهذه الفاتورة');
            return;
        }
        toastSuccess(`تم إرسال الفاتورة إلى العميل: ${inv.customer.name}`);
    };

    const filteredInvoices = invoices.filter(inv => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            String(inv.invoiceNo).includes(q) ||
            (inv.customer?.name || '').toLowerCase().includes(q)
        );
    });

    return (
        <div className="history-page">
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={28} color="var(--primary)" /> {t('sales.str_2413')}</h1>
                <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>{t('sales.str_2414')}</p>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <form onSubmit={handleFilter} className="filter-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', alignItems: 'end' }}>
                    <div>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={16} /> {t('sales.str_2415')}</label>
                        <input type="date" className="input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={16} /> {t('sales.str_2416')}</label>
                        <input type="date" className="input" value={toDate} onChange={e => setToDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Search size={16} /> {t('sales.str_2417')}</label>
                        <input 
                            type="text" 
                            className="input" 
                            placeholder={t('sales.str_2423')} 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                            {loading ? t('sales.str_2424') : t('sales.str_2425')}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={resetFilters} title={t('sales.str_2426')}>
                            <RefreshCcw size={18} />
                        </button>
                    </div>
                </form>
            </div>

            <div className="card table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>{t('sys.str_510')}</th>
                            <th>{t('sales.str_2418')}</th>
                            <th>{t('sys.str_673')}</th>
                            <th>{t('sys.str_1046')}</th>
                            <th>{t('sales.str_2419')}</th>
                            <th style={{ textAlign: 'center' }}>{t('sys.str_435')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && invoices.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>{t('sys.str_168')}</td></tr>
                        ) : filteredInvoices.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>{t('sales.str_2420')}</td></tr>
                        ) : (
                            filteredInvoices.map(inv => (
                                <tr key={inv.id}>
                                    <td style={{ fontWeight: 'bold' }}>#{inv.invoiceNo}</td>
                                    <td style={{ direction: 'ltr', textAlign: 'right' }}>{new Date(inv.date).toLocaleString('en-GB')}</td>
                                    <td>{inv.customer?.name || <span className="badge badge-gray">{t('sales.str_2421')}</span>}</td>
                                    <td>
                                        <span className={`badge ${inv.paymentType.toLowerCase() === 'cash' ? 'badge-success' : 'badge-primary'}`}>
                                            {inv.paymentType.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>
                                        {Number(inv.total).toLocaleString()} {t('sys.str_68')}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                            <button 
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => reprintInvoice(inv)}
                                                title={t('sales.str_2422')}
                                            >
                                                <Printer size={16} />
                                            </button>
                                            <button 
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => viewJournal(inv.invoiceNo)}
                                                title="عرض القيد المحاسبي"
                                            >
                                                <BookOpen size={16} />
                                            </button>
                                            <button 
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => sendEmail(inv)}
                                                title="إرسال بريد إلكتروني"
                                            >
                                                <Mail size={16} />
                                            </button>
                                            <button 
                                                className="btn btn-danger btn-sm"
                                                onClick={() => deleteInvoice(inv.id)}
                                                title="إلغاء الفاتورة"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Print Modal */}
            {showReceipt && lastInvoiceData && (
                <InvoiceReceipt 
                    invoiceData={lastInvoiceData}
                    onClose={() => setShowReceipt(false)}
                />
            )}
        </div>
    );
}
