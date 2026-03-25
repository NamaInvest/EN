'use client';

import React, { useState, useEffect } from 'react';
import { Search, Printer, Calendar, RefreshCcw, FileText } from 'lucide-react';
import InvoiceReceipt from '@/components/InvoiceReceipt';

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
        } catch (error) {
            console.error('Failed to fetch invoices', error);
        } finally {
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
            customerName: inv.customer?.name || 'عميل نقدي',
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
                    <FileText size={28} color="var(--primary)" /> سجل الفواتير السابقة
                </h1>
                <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>استعراض جميع فواتير المبيعات الصادرة، البحث، وإعادة الطباعة الضريبية.</p>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <form onSubmit={handleFilter} className="filter-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', alignItems: 'end' }}>
                    <div>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={16} /> من تاريخ</label>
                        <input type="date" className="input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={16} /> إلى تاريخ</label>
                        <input type="date" className="input" value={toDate} onChange={e => setToDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Search size={16} /> بحث برقم الفاتورة أو العميل</label>
                        <input 
                            type="text" 
                            className="input" 
                            placeholder="ابحث هنا..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                            {loading ? 'جاري التحديث...' : 'تطبيق الفلتر'}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={resetFilters} title="إعادة ضبط">
                            <RefreshCcw size={18} />
                        </button>
                    </div>
                </form>
            </div>

            <div className="card table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>رقم الفاتورة</th>
                            <th>التاريخ والوقت</th>
                            <th>اسم العميل</th>
                            <th>طريقة الدفع</th>
                            <th>الإجمالي (شامل الضريبة)</th>
                            <th style={{ textAlign: 'center' }}>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && invoices.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</td></tr>
                        ) : filteredInvoices.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>لا توجد فواتير مطابقة لخيارات البحث</td></tr>
                        ) : (
                            filteredInvoices.map(inv => (
                                <tr key={inv.id}>
                                    <td style={{ fontWeight: 'bold' }}>#{inv.invoiceNo}</td>
                                    <td style={{ direction: 'ltr', textAlign: 'right' }}>{new Date(inv.date).toLocaleString('ar-SA')}</td>
                                    <td>{inv.customer?.name || <span className="badge badge-gray">عميل نقدي مباشر</span>}</td>
                                    <td>
                                        <span className={`badge ${inv.paymentType.toLowerCase() === 'cash' ? 'badge-success' : 'badge-primary'}`}>
                                            {inv.paymentType.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>
                                        {Number(inv.total).toLocaleString()} ر.س
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button 
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => reprintInvoice(inv)}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                                        >
                                            <Printer size={16} /> إعادة طباعة
                                        </button>
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
