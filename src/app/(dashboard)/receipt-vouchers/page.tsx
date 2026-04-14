'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import VoucherReceipt from '@/components/VoucherReceipt';
import { useToast } from '@/components/Toast';

interface Invoice {
    id: number;
    invoiceNo: number;
    date: string;
    customer?: { name: string; taxNumber?: string | null; crNo?: string | null; address?: string | null };
    total: number;
    paymentType: string;
}

export default function ReceiptVouchersPage() {
    const { t } = useTranslation();
    const { error: toastError, success: toastSuccess } = useToast();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [showVoucher, setShowVoucher] = useState(false);
    const [selectedVoucherData, setSelectedVoucherData] = useState<any>(null);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/sales');
            const data = await res.json();
            if (data.invoices) {
                // Filter only completed and non-zero total
                setInvoices(data.invoices.filter((inv: any) => inv.total > 0 && inv.status === 'completed'));
            }
        } catch (err: any) { toastError(err?.message || 'حدث خطأ'); } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handlePrintVoucher = (inv: Invoice) => {
        setSelectedVoucherData({
            receiptNumber: `RV-${inv.invoiceNo}`,
            invoiceNumber: String(inv.invoiceNo),
            date: inv.date,
            customerName: inv.customer?.name || t('sys.str_752'),
            customerTaxNo: inv.customer?.taxNumber,
            customerCrNo: inv.customer?.crNo,
            customerAddress: inv.customer?.address,
            amount: inv.total,
            paymentMethod: inv.paymentType,
        });
        setShowVoucher(true);
    };

    const fmt = (num: number) => num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const paymentLabel = (type: string) => {
        const labels: Record<string, string> = {
            cash: 'نقدي', card: 'بطاقة', transfer: 'تحويل', credit: 'آجل', split: 'مقسم'
        };
        return labels[type] || type;
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{t('sidebar.receipt_vouchers')} {t('sys.str_1041')}</h1>
                <button onClick={fetchInvoices} className="btn btn-secondary">
                    {t('dashboard.refresh')}
                </button>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 bg-muted/50 border-b border-border font-semibold">
                    {t('sys.str_1042')}</div>

                {loading ? (
                    <div className="p-12 text-center text-muted-foreground animate-pulse">
                        {t('sys.str_1043')}</div>
                ) : invoices.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        {t('sys.str_1044')}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr>
                                    <th className="text-right p-4">{t('sys.str_1045')}</th>
                                    <th className="text-right p-4">{t('sys.str_510')}</th>
                                    <th className="text-right p-4">{t('sys.str_460')}</th>
                                    <th className="text-right p-4">{t('fin.str_232')}</th>
                                    <th className="text-right p-4">{t('sys.str_1046')}</th>
                                    <th className="text-center p-4">{t('sys.str_463')}</th>
                                    <th className="text-center p-4">{t('sys.str_435')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((inv) => (
                                    <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                                        <td className="p-4 font-mono font-bold text-primary">RV-{inv.invoiceNo}</td>
                                        <td className="p-4">#{inv.invoiceNo}</td>
                                        <td className="p-4">{inv.customer?.name || t('sys.str_752')}</td>
                                        <td className="p-4" dir="ltr">{new Date(inv.date).toLocaleString('en-GB')}</td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 rounded bg-secondary text-secondary-foreground text-sm">
                                                {paymentLabel(inv.paymentType)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center font-bold text-green-600 dark:text-green-400">
                                            {fmt(inv.total)} <span className="text-xs font-normal text-muted-foreground">{t('sys.str_68')}</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => handlePrintVoucher(inv)}
                                                className="btn btn-sm btn-primary"
                                            >
                                                {t('sys.str_1047')}</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Print Modal */}
            {showVoucher && selectedVoucherData && (
                <VoucherReceipt
                    voucherData={selectedVoucherData}
                    onClose={() => setShowVoucher(false)}
                />
            )}
        </div>
    );
}
