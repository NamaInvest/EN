'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import Link from 'next/link';

interface Supplier { id: number; name: string; }
interface PurchaseInvoice { id: number; invoiceNo: number; date: string; total: number; subtotal: number; taxValue: number; paid: number; remaining: number; status: string; paymentType: string; isManual: boolean; supplier?: { name: string } | null; }

export default function ManualPurchasesReport() {
    const { t } = useTranslation();
    const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    useEffect(() => {
        fetchReport();
    }, [from, to]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            let url = '/api/purchases?';
            if (from) url += `from=\${from}&`;
            if (to) url += `to=\${to}&`;
            const res = await fetch(url, { headers: { Authorization: \`Bearer \${token}\` } });
            if (res.ok) {
                const data = await res.json();
                // Filter only manual invoices
                setInvoices((data || []).filter((inv: PurchaseInvoice) => inv.isManual === true));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fmt = (v: number) => Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const totals = {
        subtotal: invoices.reduce((s, i) => s + (i.subtotal || 0), 0),
        tax: invoices.reduce((s, i) => s + (i.taxValue || 0), 0),
        total: invoices.reduce((s, i) => s + (i.total || 0), 0),
        paid: invoices.reduce((s, i) => s + (i.paid || 0), 0),
        remaining: invoices.reduce((s, i) => s + (i.remaining || 0), 0)
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', gap: '8px' }}>
                        <Link href="/reports" style={{ color: 'var(--primary)', textDecoration: 'none' }}>{t('sys.str_48')}</Link>
                        <span>/</span>
                        <span>فواتير المشتريات اليدوية</span>
                    </div>
                    <h1 className="page-title">تقرير فواتير المشتريات (الإدخال اليدوي)</h1>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>من تاريخ</label>
                        <input className="input" type="date" value={from} onChange={e => setFrom(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>إلى تاريخ</label>
                        <input className="input" type="date" value={to} onChange={e => setTo(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button className="btn btn-ghost" onClick={() => { setFrom(''); setTo(''); }}>تفريغ</button>
                    </div>
                </div>
            </div>

            <div className="page-content">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    <div className="stat-card" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>إجمالي الفواتير</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{invoices.length}</div>
                    </div>
                    <div className="stat-card" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>الإجمالي الصافي</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{fmt(totals.subtotal)}</div>
                    </div>
                    <div className="stat-card" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>الضريبة</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--warning)' }}>{fmt(totals.tax)}</div>
                    </div>
                    <div className="stat-card" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>الإجمالي الكلي</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>{fmt(totals.total)}</div>
                    </div>
                </div>

                <div className="card" style={{ overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>رقم الفاتورة</th>
                                    <th>التاريخ</th>
                                    <th>المورد</th>
                                    <th>طريقة الدفع</th>
                                    <th>المبلغ الصافي</th>
                                    <th>الضريبة</th>
                                    <th>الإجمالي القاطع</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>جاري التحميل...</td></tr>
                                ) : invoices.length === 0 ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>لا توجد فواتير يدوية مطابقة للبحث</td></tr>
                                ) : (
                                    invoices.map(inv => (
                                        <tr key={inv.id}>
                                            <td style={{ fontWeight: 'bold' }}>#{inv.invoiceNo}</td>
                                            <td>{new Date(inv.date).toLocaleDateString('ar-SA')}</td>
                                            <td>{inv.supplier?.name || '-'}</td>
                                            <td>{inv.paymentType === 'cash' ? 'نقدي' : inv.paymentType === 'credit' ? 'آجل' : inv.paymentType === 'transfer' ? 'تحويل' : 'شبكة'}</td>
                                            <td>{fmt(inv.subtotal)} ر.س</td>
                                            <td style={{ color: 'var(--warning)' }}>{fmt(inv.taxValue)} ر.س</td>
                                            <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{fmt(inv.total)} ر.س</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
