'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from "@/lib/i18n";
import { RiyalLogo } from '@/components/RiyalLogo';

interface ReceiptProps {
    invoiceId?: number;
    invoiceData?: {
        invoiceNumber: string;
        date: string;
        customerName: string;
        customerTaxNo?: string | null;
        customerCrNo?: string | null;
        customerAddress?: string | null;
        paymentMethod: string;
        items: { name: string; quantity: number; price: number; total: number }[];
        subtotal: number;
        discount: number;
        taxRate: number;
        taxAmount: number;
        grandTotal: number;
        docType?: string;
        originalReference?: string;
    };
    autoPrint?: boolean;
    isQuote?: boolean;
    docType?: string;
    onClose: () => void;
}

export default function InvoiceReceipt({ invoiceId, invoiceData, autoPrint = false, isQuote = false, docType, onClose }: ReceiptProps) {
    const { t } = useTranslation();
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [vatNumber, setVatNumber] = useState('');
    const [cashierName, setCashierName] = useState('الكاشير');
    const [companyCity, setCompanyCity] = useState('');
    const [crNumber, setCrNumber] = useState('');
    const [companyAddress, setCompanyAddress] = useState('');
    const [loading, setLoading] = useState(true);
    const [printed, setPrinted] = useState(false);
    const [printerType, setPrinterType] = useState('80mm');
    const receiptRef = useRef<HTMLDivElement>(null);

    const getDocumentTitle = useCallback(() => {
        const type = docType || invoiceData?.docType;
        if (type === 'simplified_debit') return 'إشعار مدين مبسط / Simplified Debit Note';
        if (type === 'simplified_credit') return 'إشعار دائن مبسط / Simplified Credit Note';
        if (type === 'standard_debit') return 'إشعار مدين / Standard Debit Note';
        if (type === 'standard_credit') return 'إشعار دائن / Standard Credit Note';
        if (type === 'standard_invoice') return 'فاتورة ضريبية / Tax Invoice';
        if (type === 'simplified_invoice') return 'فاتورة ضريبية مبسطة / Simplified Tax Invoice';
        
        if (isQuote) return t('sys.str_79') || 'عرض سعر / Quotation';
        return ['A4', 'A5'].includes(printerType) ? (t('sys.str_80') || 'فاتورة ضريبية / Tax Invoice') : (t('sys.str_81') || 'فاتورة ضريبية مبسطة / Simplified Tax Invoice');
    }, [docType, invoiceData?.docType, isQuote, printerType, t]);

    useEffect(() => {
        const init = async () => {
            const settings = await loadSettings();

            // Secure Cashier Fetch
            const tk = window.localStorage.getItem('token');
            if (tk) {
                try {
                    const r = await fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + tk } });
                    const s = await r.json();
                    if(s?.user?.fullName || s?.user?.username) {
                        setCashierName(s.user.fullName || s.user.username);
                    }
                } catch(e) {}
            }

            if (!isQuote) {
                if (invoiceId) {
                    await generateQR(settings?.companyName, settings?.vatNumber);
                } else if (invoiceData) {
                    await generatePreviewQR(settings?.companyName, settings?.vatNumber);
                }
            } else {
                setLoading(false);
            }
        };
        init();
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
                const cName = map['company_name'] || map['company_name_ar'] || t('sys.str_78');
                const vNum = map['tax_number'] || '';
                setCompanyName(cName);
                setVatNumber(vNum);
                
                const type = docType || invoiceData?.docType;
                const isStandard = type === 'standard_invoice' || type === 'standard_credit' || type === 'standard_debit';
                setPrinterType(isStandard ? 'A4' : (map['printer_type'] || '80mm'));
                
                setCompanyCity(map['zatca_city'] || map['company_city'] || '');
                setCrNumber(map['zatca_crn'] || map['cr_number'] || '');
                setCompanyAddress(map['company_address'] || map['company_address_ar'] || '');
                return { companyName: cName, vatNumber: vNum };
            }
        } catch (err) { console.error(err); }
        return null;
    };

    const generateQR = async (cName?: string, vNum?: string) => {
        try {
            const res = await fetch('/api/zatca/qr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invoiceId, companyName: cName, taxNumber: vNum }),
            });
            if (res.ok) {
                const data = await res.json();
                setQrDataUrl(data.qrDataUrl);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const generatePreviewQR = async (cName?: string, vNum?: string) => {
        if (!invoiceData) return;
        try {
            const res = await fetch('/api/zatca/qr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    companyName: cName,
                    taxNumber: vNum,
                    total: invoiceData.grandTotal,
                    tax: invoiceData.taxAmount,
                    date: invoiceData.date || new Date().toISOString()
                }),
            });
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

    const handlePrint = useCallback((forceSystemDialog: boolean = false) => {
        const ps = paperSizes[printerType] || paperSizes['80mm'];
        const windowTitle = getDocumentTitle();
        if (!receiptRef.current) return;
        
        const data = invoiceData;
        if (!data) return;

        let htmlContent = '';
        if (printerType === 'A4' || printerType === 'A5') {
            const formatCurrency = (v: number) => new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
            
            const custTaxNoAr = data.customerTaxNo ? `<div><strong>الرقم الضريبي للعميل:</strong> <span dir="ltr">${data.customerTaxNo}</span></div>` : '';
            const custCrNoAr = data.customerCrNo ? `<div><strong>سجل العميل:</strong> <span dir="ltr">${data.customerCrNo}</span></div>` : '';
            const custAddressAr = data.customerAddress ? `<div><strong>عنوان العميل:</strong> ${data.customerAddress}</div>` : '';
            const origRefAr = data.originalReference ? `<div><strong>الفاتورة الأصلية:</strong> <span dir="ltr">${data.originalReference}</span></div>` : '';

            const custTaxNoEn = data.customerTaxNo ? `<div><strong>Customer VAT:</strong> ${data.customerTaxNo}</div>` : '';
            const custCrNoEn = data.customerCrNo ? `<div><strong>Customer CR:</strong> ${data.customerCrNo}</div>` : '';
            const custAddressEn = data.customerAddress ? `<div><strong>Customer Address:</strong> ${data.customerAddress}</div>` : '';
            const origRefEn = data.originalReference ? `<div><strong>Original Ref:</strong> ${data.originalReference}</div>` : '';

            const itemsRows = data.items.map((i: any) => `
                <tr>
                    <td>${i.name}</td>
                    <td>${i.quantity}</td>
                    <td>${formatCurrency(i.price)}</td>
                    <td>${formatCurrency(i.total)}</td>
                </tr>
            `).join('');

            const discountRow = data.discount > 0 ? `
                <tr>
                    <td class="label">الخصم / Discount</td>
                    <td class="value">-${formatCurrency(data.discount)}</td>
                </tr>
            ` : '';

            const qrSection = (!isQuote && qrDataUrl) ? `
                <div style="text-align: center; margin-top: 40px;">
                    <img src="${qrDataUrl}" style="width: 150px; height: 150px; border: 1px solid #ddd; padding: 5px;" />
                </div>
            ` : '';

            htmlContent = `
                <html dir="rtl" lang="ar">
                <head>
                    <title>${windowTitle}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Noto Sans Arabic:wght@400;600;800&display=swap');
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body {
                            font-family: 'Noto Sans Arabic', sans-serif;
                            line-height: 1.4;
                            direction: rtl;
                            color: #000;
                            background: white;
                            width: 100%;
                        }
                        .a4-container { width: 100%; padding: 20px; }
                        .a4-header { text-align: center; margin-bottom: 15px; }
                        .a4-header h1 { font-size: 24px; font-weight: 800; margin-bottom: 4px; color: #000; }
                        .a4-header h2 { font-size: 15px; font-weight: 600; margin-bottom: 4px; color: #333; }
                        .a4-header h3 { font-size: 16px; color: #000; font-weight: bold; border: 2px solid #000; display: inline-block; padding: 3px 10px; margin-top: 6px; }
                        
                        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                        .info-table td { border: 1px solid #000; padding: 8px; vertical-align: top; width: 50%; }
                        .info-table .ar-cell { text-align: right; }
                        .info-table .en-cell { text-align: left; direction: ltr; }
                        .info-table strong { font-weight: 800; color: #000; }
                        .info-table div { margin-bottom: 4px; font-size: 13px; }
                        .info-table table { margin-bottom: 4px !important; }
                        
                        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
                        .items-table th, .items-table td { border: 1px solid #000; padding: 6px; text-align: center; font-size: 13px; }
                        .items-table th { background-color: #f1f5f9 !important; font-weight: 800; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        
                        .summary-container { display: flex; justify-content: flex-end; margin-top: -1px; }
                        .summary-table { width: 50%; border-collapse: collapse; }
                        .summary-table td { border: 1px solid #000; padding: 6px; font-size: 14px; }
                        .summary-table .label { font-weight: 800; background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .summary-table .value { text-align: center; font-weight: 600; }
                        .summary-table .grand-row { background-color: #e2e8f0 !important; font-weight: 900; font-size: 16px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        
                        .footer { margin-top: 25px; text-align: center; border-top: 2px solid #000; padding-top: 15px; }
                        @media print {
                            body { width: 210mm; margin: 0; padding: 0; }
                            @page { margin: 0; size: A4 portrait; }
                            .a4-container { padding: 10mm; }
                            table, th, td { border: 1px solid #000 !important; }
                            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        }
                    </style>
                </head>
                <body>
                    <div class="a4-container">
                        <div class="a4-header">
                            <h1>${companyName}</h1>
                            <h2>الرقم الضريبي : <span dir="ltr">${vatNumber}</span></h2>
                            <h3>${getDocumentTitle()}</h3>
                        </div>
                        
                        <table class="info-table">
                            <tbody>
                                <tr>
                                    <td class="ar-cell">
                                        <div><strong>المدينة:</strong> ${companyCity}</div>
                                        <div><strong>العنوان:</strong> ${companyAddress}</div>
                                        <div><strong>رقم السجل التجاري:</strong> <span dir="ltr">${crNumber}</span></div>
                                    </td>
                                    <td class="en-cell">
                                        <div><strong>City:</strong> ${companyCity}</div>
                                        <div><strong>Address:</strong> ${companyAddress}</div>
                                        <div><strong>CR Number:</strong> ${crNumber}</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="ar-cell">
                                        <table style="width: 100%; border: none; margin-bottom: 6px;">
                                            <tr>
                                                <td style="border: none; padding: 0; width: 50%;"><strong>الكاشير:</strong> ${cashierName === 'الكاشير' ? 'الرئيسي' : cashierName}</td>
                                                <td style="border: none; padding: 0; width: 50%;"><strong>رقم الفاتورة:</strong> <span dir="ltr">${data.invoiceNumber}</span></td>
                                            </tr>
                                        </table>
                                        <table style="width: 100%; border: none; margin-bottom: 6px;">
                                            <tr>
                                                <td style="border: none; padding: 0; width: 50%;"><strong>العميل:</strong> ${data.customerName || 'عميل نقدي'}</td>
                                                <td style="border: none; padding: 0; width: 50%;"><strong>تاريخ الإصدار:</strong> <span dir="ltr">${new Date(data.date).toLocaleString('en-GB')}</span></td>
                                            </tr>
                                        </table>
                                        ${custTaxNoAr}
                                        ${custCrNoAr}
                                        ${custAddressAr}
                                        ${origRefAr}
                                    </td>
                                    <td class="en-cell">
                                        <table style="width: 100%; border: none; margin-bottom: 6px;">
                                            <tr>
                                                <td style="border: none; padding: 0; width: 50%;"><strong>Invoice No:</strong> ${data.invoiceNumber}</td>
                                                <td style="border: none; padding: 0; width: 50%;"><strong>Cashier:</strong> ${cashierName === 'الكاشير' ? 'Main' : cashierName}</td>
                                            </tr>
                                        </table>
                                        <table style="width: 100%; border: none; margin-bottom: 6px;">
                                            <tr>
                                                <td style="border: none; padding: 0; width: 50%;"><strong>Issue Date:</strong> ${new Date(data.date).toLocaleString('en-GB')}</td>
                                                <td style="border: none; padding: 0; width: 50%;"><strong>Customer:</strong> ${data.customerName || 'Cash Customer'}</td>
                                            </tr>
                                        </table>
                                        ${custTaxNoEn}
                                        ${custCrNoEn}
                                        ${custAddressEn}
                                        ${origRefEn}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <table class="items-table">
                            <thead>
                                <tr>
                                    <th>المنتج<br><span dir="ltr">Product</span></th>
                                    <th>الكمية<br><span dir="ltr">Qty</span></th>
                                    <th>السعر<br><span dir="ltr">Price</span></th>
                                    <th>المجموع<br><span dir="ltr">Total</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsRows}
                            </tbody>
                        </table>

                        <div class="summary-container">
                            <table class="summary-table">
                                <tbody>
                                    <tr>
                                        <td class="label">الإجمالي الفرعي / Subtotal</td>
                                        <td class="value">${formatCurrency(data.subtotal)}</td>
                                    </tr>
                                    ${discountRow}
                                    <tr>
                                        <td class="label">ضريبة القيمة المضافة / VAT (${data.taxRate}%)</td>
                                        <td class="value">${formatCurrency(data.taxAmount)}</td>
                                    </tr>
                                    <tr class="grand-row">
                                        <td class="label">الإجمالي الكلي / Grand Total</td>
                                        <td class="value">${formatCurrency(data.grandTotal)} ر.س</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        ${qrSection}

                        <div class="footer">
                            <p>شكرًا لتعاملكم معنا - Thank you for your business</p>
                            <p style="margin-top: 5px; color: #666; font-size: 12px;">مُصدرة إلكترونياً من نظام نما إنفست - ZATCA Compliant</p>
                        </div>
                    </div>
                </body>
                </html>
            `;
        } else {
            htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${windowTitle}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto Sans Arabic:wght@400;600;800&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Noto Sans Arabic', sans-serif;
            width: ${ps.width};
            padding: ${ps.padding};
            font-size: ${ps.fontSize};
            line-height: 1.4;
            direction: rtl;
            color: #000;
          }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 8px; }
          .company-name { font-size: ${ps.companySize}; font-weight: 800; }
          .vat-num { font-size: 10px; color: #333; }
          .invoice-type { font-size: 14px; font-weight: bold; color: #000; margin-top: 4px; border: 1px solid #000; padding: 2px; display: inline-block; }
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
          .footer { text-align: center; margin-top: 8px; font-size: 10px; color: #999; border-top: 1px solid #000; padding-top: 8px; }
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
      </body>
      </html>
            `;
        }

        if (forceSystemDialog === true) {
            const printWindow = window.open('', '_blank', `width=${ps.windowWidth},height=600`);
            if (!printWindow) {
                window.print();
                return;
            }
            printWindow.document.write(htmlContent);
            printWindow.document.write(`
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); window.close(); }, 300);
          };
        </script>
            `);
            printWindow.document.close();
        } else {
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed'; iframe.style.right = '-9999px'; iframe.style.bottom = '-9999px';
            iframe.style.width = ps.windowWidth + 'px'; iframe.style.height = '600px';
            document.body.appendChild(iframe);
            const doc = iframe.contentWindow?.document;
            if (doc) { doc.open(); doc.write(htmlContent); doc.close(); }
            setTimeout(() => {
                if (iframe.contentWindow) { iframe.contentWindow.focus(); iframe.contentWindow.print(); }
                setTimeout(() => { try { document.body.removeChild(iframe); } catch(e){} }, 5000);
            }, 800);
        }
    }, [printerType, getDocumentTitle, t, paperSizes]);

    const handleExportPDF = useCallback(() => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => {
            const formatCurrency = (v: number) => new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
            const data = invoiceData;
            if (!data) return;

            const htmlString = `
                <html dir="rtl" lang="ar">
                <head>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Noto Sans Arabic:wght@400;600;800&display=swap');
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body {
                            font-family: 'Noto Sans Arabic', sans-serif;
                            line-height: 1.4;
                            direction: rtl;
                            color: #000;
                            background: white;
                            width: 100%;
                        }
                        .a4-container { width: 100%; padding: 40px; }
                        .a4-header { text-align: center; margin-bottom: 20px; }
                        .a4-header h1 { font-size: 26px; font-weight: 800; margin-bottom: 5px; color: #000; }
                        .a4-header h2 { font-size: 16px; font-weight: 600; margin-bottom: 5px; color: #333; }
                        .a4-header h3 { font-size: 18px; color: #000; font-weight: bold; border: 2px solid #000; display: inline-block; padding: 4px 12px; margin-top: 8px; }
                        
                        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; border: 2px solid #000; }
                        .info-table td { border: 1px solid #000; padding: 8px; vertical-align: top; }
                        .info-table .ar-cell { text-align: right; width: 50%; }
                        .info-table .en-cell { text-align: left; direction: ltr; width: 50%; }
                        .info-table strong { display: inline-block; width: 120px; }
                        .info-table .en-cell strong { width: 100px; }

                        .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; border: 1px solid #000; }
                        .items-table th, .items-table td { border: 1px solid #000 !important; padding: 8px; text-align: center; }
                        .items-table th { font-weight: 600; background: #f9f9f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .items-table td:first-child, .items-table th:first-child { text-align: right; }
                        
                        .split-total { display: flex; justify-content: space-between; align-items: center; width: 100%; }
                        .split-total .en-text { font-size: 10px; color: #555; }
                    </style>
                </head>
                <body>
                    <div class="a4-container">
                        <div class="a4-header">
                            <h1>${companyName}</h1>
                            <h2>الرقم الضريبي : <span dir="ltr">${vatNumber}</span></h2>
                            <h3>${getDocumentTitle()}</h3>
                        </div>
                        
                        <table class="info-table">
                            <tbody>
                                <tr>
                                    <td class="ar-cell">
                                        <div><strong>المدينة:</strong> ${companyCity}</div>
                                        <div><strong>العنوان:</strong> ${companyAddress}</div>
                                        <div><strong>رقم السجل التجاري:</strong> <span dir="ltr">${crNumber}</span></div>
                                    </td>
                                    <td class="en-cell">
                                        <div><strong>City:</strong> ${companyCity}</div>
                                        <div><strong>Address:</strong> ${companyAddress}</div>
                                        <div><strong>CR Number:</strong> ${crNumber}</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="ar-cell">
                                        <div><strong>الكاشير:</strong> ${cashierName}</div>
                                        <div><strong>العميل:</strong> ${data.customerName || 'عميل نقدي'}</div>
                                        ${data.customerTaxNo ? `<div><strong>الرقم الضريبي للعميل:</strong> <span dir="ltr">${data.customerTaxNo}</span></div>` : ''}
                                        ${data.customerCrNo ? `<div><strong>سجل العميل:</strong> <span dir="ltr">${data.customerCrNo}</span></div>` : ''}
                                        ${data.customerAddress ? `<div><strong>عنوان العميل:</strong> ${data.customerAddress}</div>` : ''}
                                        <div><strong>رقم الفاتورة:</strong> <span dir="ltr">${data.invoiceNumber}</span></div>
                                        <div><strong>تاريخ الإصدار:</strong> <span dir="ltr">${new Date(data.date).toLocaleString('en-GB')}</span></div>
                                        ${data.originalReference ? `<div><strong>الفاتورة الأصلية:</strong> <span dir="ltr">${data.originalReference}</span></div>` : ''}
                                    </td>
                                    <td class="en-cell">
                                        <div><strong>Cashier:</strong> ${cashierName}</div>
                                        <div><strong>Customer:</strong> ${data.customerName || 'Cash Customer'}</div>
                                        ${data.customerTaxNo ? `<div><strong>Customer VAT:</strong> ${data.customerTaxNo}</div>` : ''}
                                        ${data.customerCrNo ? `<div><strong>Customer CR:</strong> ${data.customerCrNo}</div>` : ''}
                                        ${data.customerAddress ? `<div><strong>Customer Address:</strong> ${data.customerAddress}</div>` : ''}
                                        <div><strong>Invoice No:</strong> ${data.invoiceNumber}</div>
                                        <div><strong>Issue Date:</strong> ${new Date(data.date).toLocaleString('en-GB')}</div>
                                        ${data.originalReference ? `<div><strong>Original Ref:</strong> ${data.originalReference}</div>` : ''}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <table class="items-table">
                            <thead>
                                <tr>
                                    <th style="text-align: right;">المنتج<br/><span style="font-size:10px;font-weight:normal">Product</span></th>
                                    <th>الكمية<br/><span style="font-size:10px;font-weight:normal">Qty</span></th>
                                    <th>سعر الوحدة<br/><span style="font-size:10px;font-weight:normal">Unit Price</span></th>
                                    <th>الإجمالي<br/><span style="font-size:10px;font-weight:normal">Total</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.items.map(item => `
                                    <tr>
                                        <td style="text-align: right;">${item.name}</td>
                                        <td>${item.quantity}</td>
                                        <td>${formatCurrency(item.price)}</td>
                                        <td>${formatCurrency(item.total)}</td>
                                    </tr>
                                `).join('')}
                                
                                <tr>
                                    <td colSpan="3" style="text-align: left; font-weight: 600;">
                                        <div class="split-total">
                                            <span>الإجمالي الفرعي</span>
                                            <span class="en-text">Subtotal</span>
                                        </div>
                                    </td>
                                    <td style="font-weight: 600;">${formatCurrency(data.subtotal)}</td>
                                </tr>
                                ${data.discount > 0 ? `
                                <tr>
                                    <td colSpan="3" style="text-align: left; font-weight: 600; color: #e11d48;">
                                        <div class="split-total">
                                            <span>الخصم</span>
                                            <span class="en-text">Discount</span>
                                        </div>
                                    </td>
                                    <td style="font-weight: 600; color: #e11d48;">-${formatCurrency(data.discount)}</td>
                                </tr>
                                ` : ''}
                                <tr>
                                    <td colSpan="3" style="text-align: left; font-weight: 600;">
                                        <div class="split-total">
                                            <span>ضريبة القيمة المضافة (${data.taxRate}%)</span>
                                            <span class="en-text">VAT (${data.taxRate}%)</span>
                                        </div>
                                    </td>
                                    <td style="font-weight: 600;">${formatCurrency(data.taxAmount)}</td>
                                </tr>
                                <tr>
                                    <td colSpan="3" style="text-align: left; font-size: 16px; font-weight: 900;">
                                        <div class="split-total">
                                            <span>الإجمالي الكلي</span>
                                            <span class="en-text">Grand Total</span>
                                        </div>
                                    </td>
                                    <td style="font-size: 16px; font-weight: 900;">${formatCurrency(data.grandTotal)} <svg width="12" height="12" viewBox="0 0 100 100" fill="#000" style="display:inline-block;vertical-align:middle;margin-right:2px"><path d="M42.5 10 L42.5 50 L20 55 L20 40 L30 37.5 L30 10 Z"></path><path d="M42.5 58 L42.5 75 C 42.5 85, 30 90, 15 90 L 15 78 C 25 78, 30 75, 30 65 L 30 60 L 20 62 L 20 48 Z"></path><path d="M57.5 10 L57.5 60 L80 55 L80 40 L67.5 42.5 L67.5 10 Z"></path><path d="M57.5 68 L57.5 90 L85 85 L85 75 L67.5 78 L67.5 68 Z"></path></svg></td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <div style="margin-top: 40px; display: flex; justify-content: center; align-items: center; width: 100%;">
                            ${!isQuote && qrDataUrl ? `<img src="${qrDataUrl}" style="width: 150px; height: 150px;" />` : ''}
                        </div>
                    </div>
                </body>
                </html>
            `;

            // @ts-ignore
            window.html2pdf().from(htmlString).set({
                margin: 0,
                filename: `Invoice_${invoiceData?.invoiceNumber || invoiceId || Date.now()}.pdf`,
                image: { type: 'jpeg', quality: 1 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            }).save();
        };
        document.body.appendChild(script);
    }, [invoiceData, invoiceId, printerType, getDocumentTitle, companyName, companyCity, companyAddress, crNumber, vatNumber, cashierName, qrDataUrl]);

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
                <div ref={receiptRef} style={{ padding: '20px', fontFamily: 'Noto Sans Arabic, sans-serif', direction: 'rtl' }}>
                    {/* Header */}
                    <div className="header" style={{ textAlign: 'center', paddingBottom: '12px', marginBottom: '12px' }}>
                        <div style={{ fontSize: '22px', fontWeight: '800', marginBottom: '2px', color: '#000' }}>{companyName}</div>
                        {vatNumber && <div style={{ fontSize: '11px', color: '#333' }}>{t('sys.str_56')}{vatNumber}</div>}
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#000', marginTop: '6px', border: '1px solid #000', padding: '4px', display: 'inline-block' }}>
                            {getDocumentTitle()}
                        </div>
                    </div>

                    {/* Unified Invoice Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '8px', border: '1px solid #000', borderWidth: '1px' }}>
                        <tbody>
                            {/* Invoice Info Rows */}
                            <tr>
                                <td colSpan={2} style={{ padding: '6px', border: '1px solid #000', borderWidth: '1px' }}>
                                    <strong>{t('sys.str_84')}:</strong> <span dir="ltr">{data.invoiceNumber}</span>
                                    {data.originalReference && <div style={{marginTop: '4px'}}><strong>الفاتورة الأصلية:</strong> <span dir="ltr">{data.originalReference}</span></div>}
                                </td>
                                <td colSpan={2} style={{ padding: '6px', border: '1px solid #000', borderWidth: '1px' }}>
                                    <strong>التاريخ:</strong> <span dir="ltr">{new Date(data.date).toLocaleString('en-GB')}</span>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={2} style={{ padding: '6px', border: '1px solid #000', borderWidth: '1px' }}>
                                    <strong>الكاشير:</strong> {cashierName}
                                </td>
                                <td colSpan={2} style={{ padding: '6px', border: '1px solid #000', borderWidth: '1px' }}>
                                    <strong>العميل:</strong> {data.customerName || 'عميل نقدي'}
                                </td>
                            </tr>

                            {/* Additional Customer Info (ZATCA B2B requirements) */}
                            {(data.customerTaxNo || data.customerCrNo || data.customerAddress) && (
                                <tr>
                                    <td colSpan={4} style={{ padding: '6px', border: '1px solid #000', borderWidth: '1px', background: '#fafafa' }}>
                                        {data.customerTaxNo && <div><strong>{t('sys.str_59')}</strong> {data.customerTaxNo}</div>}
                                        {data.customerCrNo && <div><strong>{t('sys.str_60')}</strong> {data.customerCrNo}</div>}
                                        {data.customerAddress && <div><strong>{t('sys.str_61')}</strong> {data.customerAddress}</div>}
                                    </td>
                                </tr>
                            )}

                            {/* Items Header */}
                            <tr style={{ background: '#f0f0f0', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                <th style={{ textAlign: 'right', padding: '6px', fontWeight: '800', border: '1px solid #000', borderWidth: '1px' }}>{t('sys.str_63')}</th>
                                <th style={{ textAlign: 'center', padding: '6px', fontWeight: '800', border: '1px solid #000', borderWidth: '1px', width: '40px' }}>{t('sys.str_64')}</th>
                                <th style={{ textAlign: 'center', padding: '6px', fontWeight: '800', border: '1px solid #000', borderWidth: '1px', width: '60px' }}>{t('sys.str_65')}</th>
                                <th style={{ textAlign: 'center', padding: '6px', fontWeight: '800', border: '1px solid #000', borderWidth: '1px', width: '70px' }}>{t('sys.str_66')}</th>
                            </tr>

                            {/* Items List */}
                            {data.items.map((item, i) => (
                                <tr key={i}>
                                    <td style={{ padding: '4px 6px', border: '1px solid #000', borderWidth: '1px' }}>{item.name}</td>
                                    <td style={{ textAlign: 'center', padding: '4px', border: '1px solid #000', borderWidth: '1px' }}>{item.quantity}</td>
                                    <td style={{ textAlign: 'center', padding: '4px', border: '1px solid #000', borderWidth: '1px' }}>{formatCurrency(item.price)}</td>
                                    <td style={{ textAlign: 'center', padding: '4px', border: '1px solid #000', borderWidth: '1px' }}>{formatCurrency(item.total)}</td>
                                </tr>
                            ))}

                            {/* Totals */}
                            <tr>
                                <td colSpan={3} style={{ padding: '6px', textAlign: 'left', fontWeight: '600', border: '1px solid #000', borderWidth: '1px' }}>
                                    {t('sys.str_67')}
                                </td>
                                <td style={{ padding: '6px', textAlign: 'center', fontWeight: '600', border: '1px solid #000', borderWidth: '1px' }}>
                                    {formatCurrency(data.subtotal)}
                                </td>
                            </tr>
                            {data.discount > 0 && (
                                <tr>
                                    <td colSpan={3} style={{ padding: '6px', textAlign: 'left', fontWeight: '600', color: '#e11d48', border: '1px solid #000', borderWidth: '1px' }}>
                                        {t('sys.str_69')}
                                    </td>
                                    <td style={{ padding: '6px', textAlign: 'center', fontWeight: '600', color: '#e11d48', border: '1px solid #000', borderWidth: '1px' }}>
                                        -{formatCurrency(data.discount)}
                                    </td>
                                </tr>
                            )}
                            <tr>
                                <td colSpan={3} style={{ padding: '6px', textAlign: 'left', fontWeight: '600', border: '1px solid #000', borderWidth: '1px' }}>
                                    {t('sys.str_70')}{data.taxRate}%):
                                </td>
                                <td style={{ padding: '6px', textAlign: 'center', fontWeight: '600', border: '1px solid #000', borderWidth: '1px' }}>
                                    {formatCurrency(data.taxAmount)}
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={3} style={{ padding: '8px', textAlign: 'left', fontSize: '14px', fontWeight: '900', border: '1px solid #000', borderWidth: '1px', background: '#f9f9f9', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                    {t('sys.str_71')}
                                </td>
                                <td style={{ padding: '8px', textAlign: 'center', fontSize: '14px', fontWeight: '900', border: '1px solid #000', borderWidth: '1px', background: '#f9f9f9', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>{formatCurrency(data.grandTotal)} <RiyalLogo width={12} height={12} color="#000" /></td>
                            </tr>
                        </tbody>
                    </table>

                    {/* ZATCA QR Code */}
                    {!isQuote && (
                        <div style={{ textAlign: 'center', margin: '16px auto 0', paddingTop: '12px', maxWidth: '140px' }} className="qr-section">
                            {loading ? (
                                <div style={{ padding: '16px', color: '#999', fontSize: '11px' }}>{t('sys.str_72')}</div>
                            ) : qrDataUrl ? (
                                <>
                                    <img src={qrDataUrl} alt="ZATCA QR Code" style={{ width: '120px', height: '120px', margin: '0 auto', display: 'block' }} />
                                    <div style={{ fontSize: '8px', color: '#666', marginTop: '4px', textAlign: 'center' }}>{t('sys.str_73')}</div>
                                </>
                            ) : null}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="footer" style={{ textAlign: 'center', marginTop: '12px', fontSize: '10px', color: '#999', borderTop: '1px solid #000', paddingTop: '8px' }}>
                        {t('sys.str_74')}</div>
                </div>

                {/* Action buttons (screen only) */}
                <div style={{ display: 'flex', gap: '8px', padding: '16px', borderTop: '1px solid #eee', flexWrap: 'wrap' }} className="no-print">
                    <button
                        onClick={() => handlePrint(false)}
                        style={{
                            flex: 1, padding: '12px', background: '#6C63FF', color: '#fff',
                            border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                            cursor: 'pointer', fontFamily: 'Noto Sans Arabic',
                        }}
                    >
                        طباعة فورية</button>
                    <button
                        onClick={() => handlePrint(true)}
                        style={{
                            flex: 1, padding: '12px', background: '#3b82f6', color: '#fff',
                            border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                            cursor: 'pointer', fontFamily: 'Noto Sans Arabic',
                        }}
                    >
                        خيارات الطباعة</button>
                    <button
                        onClick={handleExportPDF}
                        style={{
                            flex: 1, padding: '12px', background: '#ef4444', color: '#fff',
                            border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                            cursor: 'pointer', fontFamily: 'Noto Sans Arabic',
                        }}
                    >
                        {t('sys.str_76')}</button>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '12px 24px', background: '#f1f5f9', color: '#334155',
                            border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                            cursor: 'pointer', fontFamily: 'Noto Sans Arabic',
                        }}
                    >
                        {t('sys.str_77')}</button>
                </div>
            </div>
        </div>
    );
}

