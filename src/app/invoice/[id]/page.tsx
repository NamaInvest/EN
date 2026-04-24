import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import QRCode from 'qrcode';
import crypto from 'crypto';

// Convert integer to hex byte string padding with 0 if necessary
function toHex(val: number, length: number = 2) {
    return val.toString(16).padStart(length, '0');
}

// ZATCA TLV Encoding natively in the server
function getZatcaTLV(tags: { id: number; value: string }[]) {
    let tlvHex = '';
    for (const tag of tags) {
        const valueBuffer = Buffer.from(tag.value, 'utf8');
        tlvHex += toHex(tag.id) + toHex(valueBuffer.length) + valueBuffer.toString('hex');
    }
    return Buffer.from(tlvHex, 'hex').toString('base64');
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
        // Local translations for server component
    const translations: Record<string, string> = {
        'sys.str_1576': 'فاتورة ضريبية',
        'sys.str_9': 'الرقم',
        'sys.str_1577': 'رقم الفاتورة',
        'sys.str_56': 'المبلغ',
        'sys.str_84': 'المجموع',
        'sys.str_113': 'التاريخ',
        'sys.str_4598': 'الكمية',
        'sys.str_752': 'الوحدة',
        'sys.str_4599': 'سعر الوحدة',
        'stock.str_1485': 'الوصف',
        'sys.str_801': 'ضريبة القيمة المضافة',
        'sys.str_64': 'المنتج',
        'sys.str_947': 'الرقم الضريبي',
        'sys.str_1579': 'المجموع قبل الضريبة',
        'sys.str_68': 'ريال سعودي',
        'sys.str_69': 'ريال سعودي',
        'sys.str_1580': 'ضريبة القيمة المضافة (15%)',
        'sys.str_1581': 'الإجمالي شامل الضريبة',
        'sys.str_1582': 'شكراً لتعاملكم معنا',
    };
    const t = (key: string) => translations[key] ?? key;

    const { id } = await params;
    
    // Validate ID is numeric
    if (!/^\d+$/.test(id)) {
        notFound();
    }

    const invoice = await prisma.salesInvoice.findUnique({
        where: { id: parseInt(id) },
        include: { details: true, customer: true, user: true }
    });

    if (!invoice) {
        notFound();
    }

    // Fetch store info for the receipt header/footer
    const settingsRaw = await prisma.setting.findMany();
    const settings: Record<string, string> = {};
    settingsRaw.forEach(s => settings[s.key] = s.value || '');

    // Generate ZATCA Phase 2 QR Base64
    const seller = settings['company_name'] || 'NamaVest POS';
    const vatNo = settings['tax_number'] || '300000000000003';
    const timestamp = invoice.date.toISOString();
    const totalWithVat = invoice.total.toString();
    const vatTotal = invoice.taxValue.toString();

    const tlvBase64 = getZatcaTLV([
        { id: 1, value: seller },
        { id: 2, value: vatNo },
        { id: 3, value: timestamp },
        { id: 4, value: totalWithVat },
        { id: 5, value: vatTotal },
    ]);

    const qrDataUrl = await QRCode.toDataURL(tlvBase64, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        margin: 1,
        width: 200
    });

    return (
        <div style={{ background: '#f3f4f6', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '20px', fontFamily: 'Noto Sans Arabic, sans-serif' }}>
            <head>
                <title>{t('sys.str_1576')}{invoice.invoiceNo}</title>
            </head>
            
            <div style={{ background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '12px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', borderBottom: '2px dashed #eee', paddingBottom: '16px', marginBottom: '16px' }}>
                    <h2 style={{ margin: '0 0 8px', color: '#111', fontSize: '22px', fontWeight: '800' }}>{settings['receipt_header'] || settings['company_name'] || t('sys.str_9')}</h2>
                    {settings['company_address'] && <p style={{ margin: '4px 0', color: '#666', fontSize: '13px' }}>{settings['company_address']}</p>}
                    {settings['company_phone'] && <p style={{ margin: '4px 0', color: '#666', fontSize: '13px' }}>{t('sys.str_1577')}{settings['company_phone']}</p>}
                    {settings['tax_number'] && <p style={{ margin: '4px 0', color: '#666', fontSize: '13px' }}>{t('sys.str_56')}{settings['tax_number']}</p>}
                </div>

                {/* Metadata */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#444', marginBottom: '16px' }}>
                    <div>
                        <p style={{ margin: '4px 0' }}><strong>{t('sys.str_84')}</strong> #{invoice.invoiceNo}</p>
                        <p style={{ margin: '4px 0' }}><strong>{t('sys.str_113')}</strong> {new Date(invoice.date).toLocaleString('ar-SA')}</p>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <p style={{ margin: '4px 0' }}><strong>{t('sys.str_4598')}</strong> {invoice.customer?.name || t('sys.str_752')}</p>
                        <p style={{ margin: '4px 0' }}><strong>{t('sys.str_4599')}</strong> {invoice.user?.fullName || t('stock.str_1485')}</p>
                    </div>
                </div>

                {/* Items Table */}
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', marginBottom: '16px' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #eee', color: '#666' }}>
                            <th style={{ textAlign: 'right', padding: '8px 0', width: '50%' }}>{t('sys.str_801')}</th>
                            <th style={{ textAlign: 'center', padding: '8px 0' }}>{t('sys.str_64')}</th>
                            <th style={{ textAlign: 'left', padding: '8px 0' }}>{t('sys.str_947')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.details.map((item, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                <td style={{ padding: '8px 0', fontWeight: '500', color: '#222' }}>{item.productName}</td>
                                <td style={{ textAlign: 'center', padding: '8px 0', color: '#555' }}>
                                    {item.quantity} <span style={{ fontSize: '10px', color: '#999' }}>× {item.price.toFixed(2)}</span>
                                </td>
                                <td style={{ textAlign: 'left', padding: '8px 0', fontWeight: '600' }}>{item.total.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Financials */}
                <div style={{ borderTop: '2px dashed #eee', paddingTop: '16px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                        <span>{t('sys.str_1579')}</span>
                        <span>{invoice.subtotal.toFixed(2)} {settings['currency'] || t('sys.str_68')}</span>
                    </div>
                    {invoice.discountValue > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#ef4444', marginBottom: '6px' }}>
                            <span>{t('sys.str_69')}</span>
                            <span>- {invoice.discountValue.toFixed(2)} {settings['currency'] || t('sys.str_68')}</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                        <span>{t('sys.str_1580')}</span>
                        <span>{invoice.taxValue.toFixed(2)} {settings['currency'] || t('sys.str_68')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '800', marginTop: '12px', color: '#000' }}>
                        <span>{t('sys.str_1581')}</span>
                        <span>{invoice.total.toFixed(2)} {settings['currency'] || t('sys.str_68')}</span>
                    </div>
                </div>

                {/* ZATCA QR Code */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '24px' }}>
                    <img src={qrDataUrl} alt="ZATCA QR Code" style={{ width: '140px', height: '140px', border: '1px solid #eee', borderRadius: '8px' }} />
                    <p style={{ marginTop: '12px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
                        {settings['receipt_footer'] || t('sys.str_1582')}
                    </p>
                </div>
                
            </div>
            {/* Minimalist print styling to hide the button when printed directly */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    body { background: white !important; }
                    div { box-shadow: none !important; }
                }
            `}} />
        </div>
    );
}
