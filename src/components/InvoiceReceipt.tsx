'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface ReceiptProps {
    invoiceId?: number;
    invoiceData?: {
        invoiceNumber: string;
        date: string;
        customerName: string;
        paymentMethod: string;
        items: { name: string; quantity: number; price: number; total: number }[];
        subtotal: number;
        discount: number;
        taxRate: number;
        taxAmount: number;
        grandTotal: number;
    };
    autoPrint?: boolean;
    isQuote?: boolean;
    onClose: () => void;
}

export default function InvoiceReceipt({ invoiceId, invoiceData, autoPrint = false, isQuote = false, onClose }: ReceiptProps) {
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [companyName, setCompanyName] = useState('نما انفست');
    const [vatNumber, setVatNumber] = useState('');
    const [loading, setLoading] = useState(true);
    const [printed, setPrinted] = useState(false);
    const [printerType, setPrinterType] = useState('80mm');
    const receiptRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadSettings();
        if (!isQuote) {
            if (invoiceId) {
                generateQR();
            } else if (invoiceData) {
                generatePreviewQR();
            }
        } else {
            setLoading(false);
        }
    }, [invoiceId, invoiceData, isQuote]);

    // Auto-print when loaded (and if not quote, when QR is loaded)
    useEffect(() => {
        if (autoPrint && !loading && !printed) {
            if (!isQuote && !qrDataUrl) return; // Wait for QR if not quote
            const timer = setTimeout(() => {
                handlePrint();
                setPrinted(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [autoPrint, loading, qrDataUrl, printed, isQuote]);

    const loadSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const settings = await res.json();
                const map: Record<string, string> = {};
                settings.forEach((s: { key: string; value: string }) => { map[s.key] = s.value; });
                setCompanyName(map['company_name'] || 'نما انفست');
                setVatNumber(map['tax_number'] || '');
                setPrinterType(map['printer_type'] || '80mm');
            }
        } catch (err) { console.error(err); }
    };

    const generateQR = async () => {
        try {
            const res = await fetch('/api/zatca/qr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invoiceId }),
            });
            if (res.ok) {
                const data = await res.json();
                setQrDataUrl(data.qrDataUrl);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const generatePreviewQR = async () => {
        if (!invoiceData) return;
        try {
            const params = new URLSearchParams({
                seller: companyName || 'نما انفست',
                vat: vatNumber,
                total: invoiceData.grandTotal.toString(),
                tax: invoiceData.taxAmount.toString(),
            });
            const res = await fetch(`/api/zatca/qr?${params}`);
            if (res.ok) {
                const data = await res.json();
                setQrDataUrl(data.qrDataUrl);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    // Paper size configs for each printer type
    const paperSizes: Record<string, { width: string; padding: string; fontSize: string; companySize: string; qrSize: string; windowWidth: number }> = {
        '58mm': { width: '58mm', padding: '2mm', fontSize: '10px', companySize: '14px', qrSize: '90px', windowWidth: 230 },
        '76mm': { width: '76mm', padding: '3mm', fontSize: '11px', companySize: '16px', qrSize: '110px', windowWidth: 290 },
        '80mm': { width: '80mm', padding: '4mm', fontSize: '12px', companySize: '18px', qrSize: '120px', windowWidth: 310 },
        'A4':   { width: '210mm', padding: '15mm', fontSize: '14px', companySize: '24px', qrSize: '150px', windowWidth: 800 },
        'A5':   { width: '148mm', padding: '10mm', fontSize: '13px', companySize: '20px', qrSize: '140px', windowWidth: 580 },
    };

    const handlePrint = useCallback(() => {
        const ps = paperSizes[printerType] || paperSizes['80mm'];
        const printWindow = window.open('', '_blank', `width=${ps.windowWidth},height=600`);
        if (!printWindow || !receiptRef.current) {
            window.print();
            return;
        }

        printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>فاتورة</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Cairo', sans-serif;
            width: ${ps.width};
            padding: ${ps.padding};
            font-size: ${ps.fontSize};
            line-height: 1.4;
            direction: rtl;
            color: #000;
          }
          .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
          .company-name { font-size: ${ps.companySize}; font-weight: 800; }
          .vat-num { font-size: 10px; color: #666; }
          .invoice-type { font-size: 10px; color: #999; margin-top: 2px; }
          .info-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px; }
          .items-table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: ${ps.fontSize}; border: 1px solid #000; }
          .items-table th, .items-table td { border: 1px solid #000 !important; padding: 4px; text-align: center; }
          .items-table th { font-weight: 600; background: #f9f9f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .items-table td:first-child, .items-table th:first-child { text-align: right; }
          .totals { padding-top: 8px; }
          .total-row { display: flex; justify-content: space-between; font-size: ${ps.fontSize}; margin-bottom: 2px; }
          .grand-total { font-size: 16px; font-weight: 800; border-top: 1px solid #000; padding-top: 6px; margin-top: 4px; }
          .discount { color: #e11d48; }
          ${!isQuote ? `
          .qr-section { text-align: center; margin-top: 12px; padding-top: 8px; }
          .qr-section img { width: ${ps.qrSize}; height: ${ps.qrSize}; }
          .qr-label { font-size: 8px; color: #666; margin-top: 2px; }
          ` : ''}
          .footer { text-align: center; margin-top: 8px; font-size: 10px; color: #999; }
          @media print {
            body { width: ${ps.width}; margin: 0; padding: ${ps.padding}; }
            @page { margin: 0; size: ${ps.width} auto; }
            table, th, td { border: 1px solid #000 !important; }
            th { border: 1px solid #000 !important; }
            td { border: 1px solid #000 !important; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${receiptRef.current.innerHTML}
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); window.close(); }, 300);
          };
        </script>
      </body>
      </html>
    `);
        printWindow.document.close();
    }, [printerType]);

    const data = invoiceData;
    if (!data) return null;

    const formatCurrency = (v: number) => new Intl.NumberFormat('ar-SA', {
        minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(v);

    const paymentLabel = (method: string) => {
        const labels: Record<string, string> = { cash: 'نقدي', card: 'بطاقة', transfer: 'تحويل بنكي', credit: 'آجل' };
        return labels[method] || method;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', background: '#fff', color: '#000' }}>
                {/* Receipt content for printing */}
                <div ref={receiptRef} style={{ padding: '20px', fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
                    {/* Header */}
                    <div className="header" style={{ textAlign: 'center', paddingBottom: '12px', marginBottom: '12px' }}>
                        <div style={{ fontSize: '22px', fontWeight: '800', marginBottom: '2px' }}>{companyName}</div>
                        {vatNumber && <div style={{ fontSize: '11px', color: '#666' }}>الرقم الضريبي: {vatNumber}</div>}
                        <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
                            {isQuote ? 'عـــرض سـعــر' : 'فاتورة ضريبية مبسطة'}
                        </div>
                    </div>

                    {/* Invoice Info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                        <span>{isQuote ? 'رقم العرض:' : 'رقم الفاتورة:'} <strong>{data.invoiceNumber}</strong></span>
                        <span>{new Date(data.date).toLocaleDateString('ar-SA')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '8px' }}>
                        <span>العميل: {data.customerName}</span>
                        <span>الدفع: {paymentLabel(data.paymentMethod)}</span>
                    </div>
                    <div style={{ fontSize: '10px', marginBottom: '8px', color: '#666' }}>
                        الوقت: {new Date(data.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>

                    {/* Items */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '8px', border: '1px solid #000', borderWidth: '1px' }}>
                        <thead>
                            <tr style={{ background: '#f9f9f9', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                <th style={{ textAlign: 'right', padding: '4px', fontWeight: '600', border: '1px solid #000', borderWidth: '1px' }}>المنتج</th>
                                <th style={{ textAlign: 'center', padding: '4px', fontWeight: '600', border: '1px solid #000', borderWidth: '1px' }}>الكمية</th>
                                <th style={{ textAlign: 'center', padding: '4px', fontWeight: '600', border: '1px solid #000', borderWidth: '1px' }}>السعر</th>
                                <th style={{ textAlign: 'center', padding: '4px', fontWeight: '600', border: '1px solid #000', borderWidth: '1px' }}>الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.items.map((item, i) => (
                                <tr key={i}>
                                    <td style={{ padding: '4px', border: '1px solid #000', borderWidth: '1px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</td>
                                    <td style={{ textAlign: 'center', padding: '4px', border: '1px solid #000', borderWidth: '1px' }}>{item.quantity}</td>
                                    <td style={{ textAlign: 'center', padding: '4px', border: '1px solid #000', borderWidth: '1px' }}>{formatCurrency(item.price)}</td>
                                    <td style={{ textAlign: 'center', padding: '4px', border: '1px solid #000', borderWidth: '1px' }}>{formatCurrency(item.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div style={{ paddingTop: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                            <span>المجموع الفرعي:</span>
                            <span>{formatCurrency(data.subtotal)} ر.س</span>
                        </div>
                        {data.discount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px', color: '#e11d48' }}>
                                <span>الخصم:</span>
                                <span>-{formatCurrency(data.discount)} ر.س</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                            <span>ضريبة القيمة المضافة ({data.taxRate}%):</span>
                            <span>{formatCurrency(data.taxAmount)} ر.س</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '800', borderTop: '1px solid #000', paddingTop: '6px', marginTop: '4px' }}>
                            <span>الإجمالي:</span>
                            <span>{formatCurrency(data.grandTotal)} ر.س</span>
                        </div>
                    </div>

                    {/* ZATCA QR Code */}
                    {!isQuote && (
                        <div style={{ textAlign: 'center', margin: '16px auto 0', paddingTop: '12px', maxWidth: '140px' }} className="qr-section">
                            {loading ? (
                                <div style={{ padding: '16px', color: '#999', fontSize: '11px' }}>جاري توليد QR...</div>
                            ) : qrDataUrl ? (
                                <>
                                    <img src={qrDataUrl} alt="ZATCA QR Code" style={{ width: '120px', height: '120px', margin: '0 auto', display: 'block' }} />
                                    <div style={{ fontSize: '8px', color: '#666', marginTop: '4px', textAlign: 'center' }}>رمز الاستجابة السريعة - هيئة الزكاة والضريبة والجمارك</div>
                                </>
                            ) : null}
                        </div>
                    )}

                    {/* Footer */}
                    <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '10px', color: '#999', borderTop: '1px dashed #ccc', paddingTop: '8px' }}>
                        شكراً لتعاملكم معنا
                    </div>
                </div>

                {/* Action buttons (screen only) */}
                <div style={{ display: 'flex', gap: '8px', padding: '16px', borderTop: '1px solid #eee' }} className="no-print">
                    <button
                        onClick={handlePrint}
                        style={{
                            flex: 1, padding: '12px', background: '#6C63FF', color: '#fff',
                            border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                            cursor: 'pointer', fontFamily: 'Cairo',
                        }}
                    >
                        🖨️ طباعة مرة أخرى
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '12px 24px', background: '#f1f5f9', color: '#334155',
                            border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                            cursor: 'pointer', fontFamily: 'Cairo',
                        }}
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
}
