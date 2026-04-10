const fs = require('fs');
const file = 'd:/namasoft9-3-main/src/components/InvoiceReceipt.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Force the jsPDF format to [72, 297]
content = content.replace(
    "jsPDF: { unit: 'mm', format: format, orientation: 'portrait' }",
    "jsPDF: { unit: 'mm', format: [76, 297], orientation: 'portrait', putOnlyUsedFonts: true }"
);

// 2. Redesign the HTML
const startMarker = '{/* Invoice Info */}';
const endMarker = '{/* ZATCA QR Code */}';
const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
    const newUI = `{/* ENTIRE RECEIPT IN A TABLE EXCEPT HEADER AND QR */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '8px', border: '1px solid #000', borderWidth: '1px' }}>
                        <tbody>
                            {/* Meta Data */}
                            <tr>
                                <td colSpan={2} style={{ padding: '4px', border: '1px solid #000' }}>
                                    <strong>{isQuote ? t('sys.str_83') : t('sys.str_84')}</strong> {data.invoiceNumber || data.id}
                                </td>
                                <td colSpan={2} style={{ padding: '4px', border: '1px solid #000' }}>
                                    <strong>التاريخ:</strong> {new Date(data.date).toLocaleDateString('ar-SA')}
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={2} style={{ padding: '4px', border: '1px solid #000' }}>
                                    <strong>{t('sys.str_57')}</strong> {data.customerName || 'عميل نقدي'}
                                </td>
                                <td colSpan={2} style={{ padding: '4px', border: '1px solid #000' }}>
                                    <strong>{t('sys.str_58')}</strong> {paymentLabel(data.paymentMethod)}
                                </td>
                            </tr>
                            {(data.customerTaxNo || data.customerCrNo) && (
                                <tr>
                                    <td colSpan={2} style={{ padding: '4px', border: '1px solid #000' }}>
                                        {data.customerTaxNo && <span style={{fontSize:'10px'}}><strong>{t('sys.str_59')}</strong> {data.customerTaxNo}</span>}
                                    </td>
                                    <td colSpan={2} style={{ padding: '4px', border: '1px solid #000' }}>
                                        {data.customerCrNo && <span style={{fontSize:'10px'}}><strong>{t('sys.str_60')}</strong> {data.customerCrNo}</span>}
                                    </td>
                                </tr>
                            )}
                            <tr>
                                <td colSpan={4} style={{ padding: '4px', border: '1px solid #000' }}>
                                    <strong>{t('sys.str_62')}</strong> {new Date(data.date).toLocaleTimeString('ar-SA')}
                                </td>
                            </tr>

                            {/* Separator */}
                            <tr><td colSpan={4} style={{ borderTop: '2px solid #000', height: '2px', background: '#000' }}></td></tr>

                            {/* Items Header */}
                            <tr style={{ background: '#f9f9f9', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                <th style={{ textAlign: 'right', padding: '4px', fontWeight: '600', border: '1px solid #000', borderWidth: '1px' }}>{t('sys.str_63')}</th>
                                <th style={{ textAlign: 'center', padding: '4px', fontWeight: '600', border: '1px solid #000', borderWidth: '1px' }}>{t('sys.str_64')}</th>
                                <th style={{ textAlign: 'center', padding: '4px', fontWeight: '600', border: '1px solid #000', borderWidth: '1px' }}>{t('sys.str_65')}</th>
                                <th style={{ textAlign: 'center', padding: '4px', fontWeight: '600', border: '1px solid #000', borderWidth: '1px' }}>{t('sys.str_66')}</th>
                            </tr>

                            {/* Items */}
                            {data.items.map((item, i) => (
                                <tr key={i}>
                                    <td style={{ padding: '4px', border: '1px solid #000', borderWidth: '1px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</td>
                                    <td style={{ textAlign: 'center', padding: '4px', border: '1px solid #000', borderWidth: '1px' }}>{item.quantity}</td>
                                    <td style={{ textAlign: 'center', padding: '4px', border: '1px solid #000', borderWidth: '1px' }}>{formatCurrency(item.price)}</td>
                                    <td style={{ textAlign: 'center', padding: '4px', border: '1px solid #000', borderWidth: '1px' }}>{formatCurrency(item.total)}</td>
                                </tr>
                            ))}

                            {/* Separator for Totals */}
                            <tr><td colSpan={4} style={{ borderTop: '2px solid #000', height: '2px', background: '#000' }}></td></tr>

                            {/* Totals */}
                            <tr>
                                <td colSpan={3} style={{ textAlign: 'left', padding: '4px', border: '1px solid #000', borderWidth: '1px', fontWeight: '600' }}>{t('sys.str_67')}</td>
                                <td style={{ textAlign: 'center', padding: '4px', border: '1px solid #000', borderWidth: '1px', fontWeight: '600' }}>{formatCurrency(data.subtotal)} {t('sys.str_68')}</td>
                            </tr>
                            {data.discount > 0 && (
                                <tr>
                                    <td colSpan={3} style={{ textAlign: 'left', padding: '4px', border: '1px solid #000', borderWidth: '1px', fontWeight: '600', color: '#e11d48' }}>{t('sys.str_69')}</td>
                                    <td style={{ textAlign: 'center', padding: '4px', border: '1px solid #000', borderWidth: '1px', fontWeight: '600', color: '#e11d48' }}>-{formatCurrency(data.discount)} {t('sys.str_68')}</td>
                                </tr>
                            )}
                            <tr>
                                <td colSpan={3} style={{ textAlign: 'left', padding: '4px', border: '1px solid #000', borderWidth: '1px', fontWeight: '600' }}>{t('sys.str_70')}{data.taxRate}%):</td>
                                <td style={{ textAlign: 'center', padding: '4px', border: '1px solid #000', borderWidth: '1px', fontWeight: '600' }}>{formatCurrency(data.taxAmount)} {t('sys.str_68')}</td>
                            </tr>
                            <tr>
                                <td colSpan={3} style={{ textAlign: 'left', padding: '6px 4px', border: '1px solid #000', borderWidth: '1px', fontSize: '13px', fontWeight: '900' }}>{t('sys.str_71')}</td>
                                <td style={{ textAlign: 'center', padding: '6px 4px', border: '1px solid #000', borderWidth: '1px', fontSize: '13px', fontWeight: '900' }}>{formatCurrency(data.grandTotal)} {t('sys.str_68')}</td>
                            </tr>
                        </tbody>
                    </table>

                    `;

    content = content.substring(0, startIdx) + newUI + content.substring(endIdx);
    fs.writeFileSync(file, content);
    console.log("Successfully redesigned Receipt HTML DOM.");
} else {
    console.error("Tags not found");
}
