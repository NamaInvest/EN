'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from "@/lib/i18n";

interface VoucherProps {
    voucherData: {
        receiptNumber: string;
        invoiceNumber: string;
        date: string;
        customerName: string;
        customerTaxNo?: string | null;
        customerCrNo?: string | null;
        customerAddress?: string | null;
        amount: number;
        paymentMethod: string;
    };
    autoPrint?: boolean;
    onClose: () => void;
}

export default function VoucherReceipt({ voucherData, autoPrint = false, onClose }: VoucherProps) {
    const { t } = useTranslation();
    const [companyName, setCompanyName] = useState('');
    const [printerType, setPrinterType] = useState('80mm');
    const [printed, setPrinted] = useState(false);
    const receiptRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    // Auto-print when loaded
    useEffect(() => {
        if (autoPrint && !printed) {
            const timer = setTimeout(() => {
                handlePrint();
                setPrinted(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [autoPrint, printed]);

    const loadSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const settings = await res.json();
                const map: Record<string, string> = {};
                settings.forEach((s: { key: string; value: string }) => { map[s.key] = s.value; });
                setCompanyName(map['company_name'] || t('sys.str_78'));
                setPrinterType(map['printer_type'] || '80mm');
            }
        } catch (err) { console.error(err); }
    };

    // Paper size configs for each printer type
    const paperSizes: Record<string, { width: string; padding: string; fontSize: string; companySize: string; windowWidth: number }> = {
        '58mm': { width: '58mm', padding: '2mm', fontSize: '10px', companySize: '14px', windowWidth: 230 },
        '76mm': { width: '76mm', padding: '3mm', fontSize: '11px', companySize: '16px', windowWidth: 290 },
        '80mm': { width: '80mm', padding: '4mm', fontSize: '12px', companySize: '18px', windowWidth: 310 },
        'A4':   { width: '210mm', padding: '15mm', fontSize: '16px', companySize: '24px', windowWidth: 800 },
        'A5':   { width: '148mm', padding: '10mm', fontSize: '14px', companySize: '20px', windowWidth: 580 },
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
        <title>ط³ظ†ط¯ ظ‚ط¨ط¶</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto Sans Arabic:wght@400;600;800&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Noto Sans Arabic', sans-serif;
            width: ${ps.width};
            padding: ${ps.padding};
            font-size: ${ps.fontSize};
            line-height: 1.6;
            direction: rtl;
            color: #000;
          }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
          .company-name { font-size: ${ps.companySize}; font-weight: 800; }
          .voucher-title { font-size: 14px; font-weight: 700; margin-top: 4px; border: 1px solid #000; display: inline-block; padding: 2px 8px; border-radius: 4px; }
          .info-row { display: flex; justify-content: space-between; font-size: ${ps.fontSize}; margin-bottom: 6px; }
          .content-box { border: 1px solid #000; padding: 8px; margin-top: 12px; border-radius: 4px; }
          .content-text { font-size: ${ps.fontSize}; margin-bottom: 8px; text-align: justify; }
          .signature-section { display: flex; justify-content: space-between; margin-top: 24px; text-align: center; font-size: ${ps.fontSize}; }
          .signature-box { border-top: 1px dashed #000; padding-top: 4px; width: 40%; }
          .footer { text-align: center; margin-top: 16px; font-size: 10px; color: #666; }
          @media print {
            body { width: ${ps.width}; margin: 0; padding: ${ps.padding}; }
            @page { margin: 0; size: ${ps.width} auto; }
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

    const formatCurrency = (v: number) => new Intl.NumberFormat('ar-SA', {
        minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(v);

    const paymentLabel = (method: string) => {
        const labels: Record<string, string> = { cash: 'نقداً', card: 'بطاقة مدى/ائتمان', transfer: 'تحويل بنكي', split: 'مقسم (نقد/بطاقة)' };
        return labels[method] || method;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', background: '#fff', color: '#000' }}>
                <div ref={receiptRef} style={{ padding: '20px', fontFamily: 'Noto Sans Arabic, sans-serif', direction: 'rtl' }}>
                    
                    {/* Header */}
                    <div className="header" style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '16px' }}>
                        <div style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>{companyName}</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', border: '1px solid #000', display: 'inline-block', padding: '2px 12px', borderRadius: '4px' }}>
                            {t('sys.str_111')}</div>
                    </div>

                    {/* Metadata */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                        <span><strong>{t('sys.str_112')}</strong> {voucherData.receiptNumber}</span>
                        <span><strong>{t('sys.str_113')}</strong> {new Date(voucherData.date).toLocaleDateString('en-GB')}</span>
                    </div>

                    {/* Content Box */}
                    <div style={{ border: '1px solid #000', padding: '12px', borderRadius: '6px', margin: '16px 0', background: '#fafafa', fontSize: '14px', lineHeight: '1.8' }}>
                        <div><strong>{t('sys.str_114')}</strong> {voucherData.customerName}</div>
                        {(voucherData.customerTaxNo || voucherData.customerCrNo || voucherData.customerAddress) && (
                            <div style={{ fontSize: '12px', color: '#444', marginBottom: '8px', borderBottom: '1px dashed #ccc', paddingBottom: '4px' }}>
                                {voucherData.customerTaxNo && <span style={{ marginLeft: '12px' }}><strong>{t('sys.str_56')}</strong> {voucherData.customerTaxNo}</span>}
                                {voucherData.customerCrNo && <span style={{ marginLeft: '12px' }}><strong>{t('sys.str_115')}</strong> {voucherData.customerCrNo}</span>}
                                {voucherData.customerAddress && <span><strong>{t('sys.str_61')}</strong> {voucherData.customerAddress}</span>}
                            </div>
                        )}
                        <div><strong>{t('sys.str_116')}</strong> {formatCurrency(voucherData.amount)} {t('sys.str_117')}</div>
                        <div><strong>{t('sys.str_118')}</strong> {t('sys.str_119')}{voucherData.invoiceNumber}</div>
                        <div><strong>{t('sys.str_120')}</strong> {paymentLabel(voucherData.paymentMethod)}</div>
                    </div>

                    {/* Signatures */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', textAlign: 'center', fontSize: '13px' }}>
                        <div style={{ width: '45%' }}>
                            <div style={{ paddingBottom: '24px' }}>{t('sys.str_121')}</div>
                            <div style={{ borderTop: '1px dashed #000', paddingTop: '4px' }}>{t('sys.str_122')}</div>
                        </div>
                        <div style={{ width: '45%' }}>
                            <div style={{ paddingBottom: '24px' }}>{t('sys.str_123')}</div>
                            <div style={{ borderTop: '1px dashed #000', paddingTop: '4px' }}>{t('sys.str_122')}</div>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '11px', color: '#666' }}>
                        {t('sys.str_124')}</div>
                </div>

                <div style={{ display: 'flex', gap: '8px', padding: '16px', borderTop: '1px solid #eee' }} className="no-print">
                    <button onClick={handlePrint} style={{ flex: 1, padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Noto Sans Arabic' }}>
                        {t('sys.str_125')}</button>
                    <button onClick={onClose} style={{ padding: '12px 24px', background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Noto Sans Arabic' }}>
                        {t('sys.str_77')}</button>
                </div>
            </div>
        </div>
    );
}

