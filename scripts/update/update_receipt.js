const fs = require('fs');
const file = 'c:/Users/1/Desktop/alfa/src/components/InvoiceReceipt.tsx';

let content = fs.readFileSync(file, 'utf8');

// The block we want to replace starts right after `return (\n        <div className="modal-overlay">` 
// and goes all the way down to `                {/* Action buttons (screen only) */}`

const startMarker = '<div ref={receiptRef} className="print-content"';
const endMarker = '{/* Action buttons (screen only) */}';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
    const newContent = `<div ref={receiptRef} className="print-content" style={{ background: 'white', color: 'black', width: '100%', margin: '0 auto', fontFamily: 'Cairo, sans-serif' }}>
                    
                    {/* Header: Company, Tax Number, Title ONLY */}
                    <div className="header" style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '8px' }}>
                        <div className="company-name" style={{ fontSize: '16px', fontWeight: '800' }}>نظام نما انفست</div>
                        {getSetting('COMPANY_TAX_NUMBER') && (
                            <div className="vat-num" style={{ fontSize: '10px', color: '#666' }}>{t('sys.str_55')} {getSetting('COMPANY_TAX_NUMBER', '311095520700003')}</div>
                        )}
                        <div className="invoice-type" style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>{isQuote ? t('sys.str_827') : t('sys.str_56')}</div>
                    </div>

                    {/* EVERYTHING ELSE IN ONE TABLE */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '8px', border: '1px solid #000' }}>
                        <tbody>
                            {/* Meta Data */}
                            <tr>
                                <td colSpan={2} style={{ padding: '4px', border: '1px solid #000' }}>
                                    <strong>رقم الفاتورة:</strong> {data.invoiceNumber || data.id}
                                </td>
                                <td colSpan={2} style={{ padding: '4px', border: '1px solid #000' }}>
                                    <strong>التاريخ:</strong> {new Date(data.date).toLocaleDateString('ar-SA')}
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={2} style={{ padding: '4px', border: '1px solid #000' }}>
                                    <strong>العميل:</strong> {data.customerName || 'عميل نقدي'}
                                </td>
                                <td colSpan={2} style={{ padding: '4px', border: '1px solid #000' }}>
                                    <strong>الدفع:</strong> {paymentLabel(data.paymentMethod)}
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={4} style={{ padding: '4px', border: '1px solid #000' }}>
                                    <strong>الوقت:</strong> {new Date(data.date).toLocaleTimeString('ar-SA')} | <strong>الكاشير:</strong> {getSetting('USER_NAME', 'Admin')}
                                </td>
                            </tr>
                            {(data.customerTaxNo || data.customerCrNo) && (
                                <tr>
                                    <td colSpan={2} style={{ padding: '4px', border: '1px solid #000' }}>
                                        {data.customerTaxNo && <span><strong>الرقم الضريبي للعميل:</strong> {data.customerTaxNo}</span>}
                                    </td>
                                    <td colSpan={2} style={{ padding: '4px', border: '1px solid #000' }}>
                                        {data.customerCrNo && <span><strong>السجل التجاري:</strong> {data.customerCrNo}</span>}
                                    </td>
                                </tr>
                            )}

                            {/* Separator */}
                            <tr><td colSpan={4} style={{ borderTop: '2px solid #000', height: '2px' }}></td></tr>

                            {/* Items Header */}
                            <tr style={{ background: '#f9f9f9', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                <th style={{ textAlign: 'right', padding: '4px', fontWeight: '600', border: '1px solid #000' }}>{t('sys.str_63')}</th>
                                <th style={{ textAlign: 'center', padding: '4px', fontWeight: '600', border: '1px solid #000' }}>{t('sys.str_64')}</th>
                                <th style={{ textAlign: 'center', padding: '4px', fontWeight: '600', border: '1px solid #000' }}>{t('sys.str_65')}</th>
                                <th style={{ textAlign: 'center', padding: '4px', fontWeight: '600', border: '1px solid #000' }}>{t('sys.str_66')}</th>
                            </tr>

                            {/* Items */}
                            {data.items.map((item, i) => (
                                <tr key={i}>
                                    <td style={{ padding: '4px', border: '1px solid #000', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</td>
                                    <td style={{ textAlign: 'center', padding: '4px', border: '1px solid #000' }}>{item.quantity}</td>
                                    <td style={{ textAlign: 'center', padding: '4px', border: '1px solid #000' }}>{formatCurrency(item.price)}</td>
                                    <td style={{ textAlign: 'center', padding: '4px', border: '1px solid #000' }}>{formatCurrency(item.total)}</td>
                                </tr>
                            ))}

                            {/* Separator for Totals */}
                            <tr><td colSpan={4} style={{ borderTop: '2px solid #000', height: '2px' }}></td></tr>

                            {/* Totals */}
                            <tr>
                                <td colSpan={3} style={{ textAlign: 'left', padding: '4px', border: '1px solid #000', fontWeight: '600' }}>{t('sys.str_67')}</td>
                                <td style={{ textAlign: 'center', padding: '4px', border: '1px solid #000' }}>{formatCurrency(data.subtotal)} {t('sys.str_68')}</td>
                            </tr>
                            {data.discount > 0 && (
                                <tr>
                                    <td colSpan={3} style={{ textAlign: 'left', padding: '4px', border: '1px solid #000', fontWeight: '600', color: '#e11d48' }}>{t('sys.str_69')}</td>
                                    <td style={{ textAlign: 'center', padding: '4px', border: '1px solid #000', color: '#e11d48' }}>-{formatCurrency(data.discount)} {t('sys.str_68')}</td>
                                </tr>
                            )}
                            <tr>
                                <td colSpan={3} style={{ textAlign: 'left', padding: '4px', border: '1px solid #000', fontWeight: '600' }}>{t('sys.str_70')}{data.taxRate}%):</td>
                                <td style={{ textAlign: 'center', padding: '4px', border: '1px solid #000' }}>{formatCurrency(data.taxAmount)} {t('sys.str_68')}</td>
                            </tr>
                            <tr>
                                <td colSpan={3} style={{ textAlign: 'left', padding: '6px 4px', border: '1px solid #000', fontSize: '13px', fontWeight: '800' }}>{t('sys.str_71')}</td>
                                <td style={{ textAlign: 'center', padding: '6px 4px', border: '1px solid #000', fontSize: '13px', fontWeight: '800' }}>{formatCurrency(data.grandTotal)} {t('sys.str_68')}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* ZATCA QR Code & Footer Outside Table */}
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
                    <div className="footer" style={{ textAlign: 'center', marginTop: '12px', fontSize: '10px', color: '#999', borderTop: '1px dashed #000', paddingTop: '8px' }}>
                        {t('sys.str_74')}
                    </div>
                </div>

                `;

    // Also we need to fix html2pdf settings natively to force 80mm format:
    // We can just replace the initialization logic
    const exportBlockFrom = `window.html2pdf().from(element.firstElementChild || element).set({`;
    const exportBlockTo = `window.html2pdf().from(element.firstElementChild || element).set({
                jsPDF: { unit: 'mm', format: isA4 ? (printerType === 'A4' ? 'a4' : 'a5') : [80, 250], orientation: 'portrait' },`;
    
    let result = content.substring(0, startIdx) + newContent + content.substring(endIdx);
    
    // Inject the jsPDF forcing
    if (!result.includes("jsPDF: {")) {
         result = result.replace(exportBlockFrom, exportBlockTo);
    }

    fs.writeFileSync(file, result);
    console.log("Successfully redesigned receipt!");
} else {
    console.error("Tags not found in InvoiceReceipt.tsx");
}
