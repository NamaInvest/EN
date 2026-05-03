const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

async function generateTLVBase64(seller, vat, timestamp, amount, tax) {
    const toHex = (val) => {
        const hex = val.toString(16);
        return hex.length % 2 === 0 ? hex : '0' + hex;
    };
    
    const encodeTLV = (tag, value) => {
        const valueBuffer = Buffer.from(value, 'utf8');
        return Buffer.concat([
            Buffer.from([tag]),
            Buffer.from([valueBuffer.length]),
            valueBuffer
        ]);
    };
    
    const tags = [
        encodeTLV(1, seller),
        encodeTLV(2, vat),
        encodeTLV(3, timestamp),
        encodeTLV(4, amount.toString()),
        encodeTLV(5, tax.toString())
    ];
    
    return Buffer.concat(tags).toString('base64');
}

async function createPDF(title, type, docType, filename, isStandard, hasOriginalRef) {
    const tlv = await generateTLVBase64('Nama Investment', '310000000000003', new Date().toISOString(), '115.00', '15.00');
    const qrCodeDataURL = await QRCode.toDataURL(tlv);

    const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;800&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: 'Noto Sans Arabic', sans-serif;
                line-height: 1.4;
                direction: rtl;
                color: #000;
                background: white;
                width: 100%;
                padding: 40px;
            }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { font-size: 26px; font-weight: 800; margin-bottom: 5px; }
            .header h2 { font-size: 16px; font-weight: 600; margin-bottom: 5px; }
            .header h3 { font-size: 14px; color: #666; font-weight: bold; }
            
            .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; border: 2px solid #000; }
            .info-table td { border: 1px solid #000; padding: 8px; vertical-align: top; }
            .info-table .ar-cell { text-align: right; width: 50%; }
            .info-table .en-cell { text-align: left; direction: ltr; width: 50%; }
            
            .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; border: 1px solid #000; }
            .items-table th, .items-table td { border: 1px solid #000 !important; padding: 8px; text-align: center; }
            .items-table th { font-weight: 600; background: #f9f9f9; }
            .items-table td:first-child, .items-table th:first-child { text-align: right; }
            
            .split-total { display: flex; justify-content: space-between; align-items: center; width: 100%; }
            .split-total .en-text { font-size: 10px; color: #555; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Nama Investment</h1>
            <h2>الرقم الضريبي : <span dir="ltr">310000000000003</span></h2>
            <h3>${title} / ${docType}</h3>
        </div>
        
        <table class="info-table">
            <tbody>
                <tr>
                    <td class="ar-cell">
                        <div><strong>المورد:</strong> Nama Investment</div>
                        <div><strong>العنوان:</strong> الرياض، العليا</div>
                        <div><strong>رقم السجل التجاري:</strong> <span dir="ltr">1010123456</span></div>
                    </td>
                    <td class="en-cell">
                        <div><strong>Supplier:</strong> Nama Investment</div>
                        <div><strong>Address:</strong> Riyadh, Olaya</div>
                        <div><strong>CR Number:</strong> 1010123456</div>
                    </td>
                </tr>
                <tr>
                    <td class="ar-cell">
                        <div><strong>العميل:</strong> ${isStandard ? 'شركة العميل التقنية' : 'عميل نقدي'}</div>
                        ${isStandard ? '<div><strong>الرقم الضريبي للعميل:</strong> <span dir="ltr">311111111111113</span></div>' : ''}
                        ${isStandard ? '<div><strong>عنوان العميل:</strong> الرياض، الملز</div>' : ''}
                        <div><strong>رقم الوثيقة:</strong> <span dir="ltr">INV-2023-001</span></div>
                        <div><strong>تاريخ الإصدار:</strong> <span dir="ltr">${new Date().toLocaleString('en-GB')}</span></div>
                        ${hasOriginalRef ? '<div><strong>رقم الفاتورة الأصلية:</strong> <span dir="ltr">INV-2023-000</span></div>' : ''}
                    </td>
                    <td class="en-cell">
                        <div><strong>Customer:</strong> ${isStandard ? 'Tech Client Co.' : 'Cash Customer'}</div>
                        ${isStandard ? '<div><strong>Customer VAT:</strong> 311111111111113</div>' : ''}
                        ${isStandard ? '<div><strong>Customer Address:</strong> Riyadh, Malaz</div>' : ''}
                        <div><strong>Document No:</strong> INV-2023-001</div>
                        <div><strong>Issue Date:</strong> ${new Date().toLocaleString('en-GB')}</div>
                        ${hasOriginalRef ? '<div><strong>Original Invoice Ref:</strong> INV-2023-000</div>' : ''}
                    </td>
                </tr>
            </tbody>
        </table>

        <table class="items-table">
            <thead>
                <tr>
                    <th>المنتج<br/><span style="font-size:10px;font-weight:normal">Product</span></th>
                    <th>الكمية<br/><span style="font-size:10px;font-weight:normal">Qty</span></th>
                    <th>سعر الوحدة<br/><span style="font-size:10px;font-weight:normal">Unit Price</span></th>
                    <th>الضريبة<br/><span style="font-size:10px;font-weight:normal">VAT (15%)</span></th>
                    <th>الإجمالي<br/><span style="font-size:10px;font-weight:normal">Total</span></th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>خدمات استشارية / Consulting Services</td>
                    <td>1</td>
                    <td>100.00</td>
                    <td>15.00</td>
                    <td>115.00</td>
                </tr>
                <tr>
                    <td colSpan="4" style="text-align: left; font-weight: 600;">
                        <div class="split-total">
                            <span>الإجمالي الفرعي</span>
                            <span class="en-text">Subtotal</span>
                        </div>
                    </td>
                    <td style="font-weight: 600;">100.00</td>
                </tr>
                <tr>
                    <td colSpan="4" style="text-align: left; font-weight: 600;">
                        <div class="split-total">
                            <span>ضريبة القيمة المضافة (15%)</span>
                            <span class="en-text">VAT (15%)</span>
                        </div>
                    </td>
                    <td style="font-weight: 600;">15.00</td>
                </tr>
                <tr>
                    <td colSpan="4" style="text-align: left; font-size: 16px; font-weight: 900;">
                        <div class="split-total">
                            <span>الإجمالي الكلي</span>
                            <span class="en-text">Grand Total</span>
                        </div>
                    </td>
                    <td style="font-size: 16px; font-weight: 900;">115.00 ر.س</td>
                </tr>
            </tbody>
        </table>
        
        <div style="margin-top: 40px; display: flex; justify-content: center; align-items: center; width: 100%;">
            <img src="${qrCodeDataURL}" style="width: 150px; height: 150px;" />
        </div>
    </body>
    </html>
    `;

    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({ path: path.join(__dirname, 'samples', filename), format: 'A4', printBackground: true });
    await browser.close();
    console.log(`Generated ${filename}`);
}

async function main() {
    const outDir = path.join(__dirname, 'samples');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir);
    }
    await createPDF('فاتورة ضريبية مبسطة', 'Simplified Tax Invoice', 'Simplified Tax Invoice', 'simplified_tax_invoice.pdf', false, false);
    await createPDF('إشعار مدين مبسط', 'Simplified Debit Note', 'Simplified Debit Note', 'simplified_debit_note.pdf', false, true);
    await createPDF('إشعار دائن مبسط', 'Simplified Credit Note', 'Simplified Credit Note', 'simplified_credit_note.pdf', false, true);
    await createPDF('فاتورة ضريبية قياسية', 'Standard Tax Invoice', 'Standard Tax Invoice', 'standard_tax_invoice.pdf', true, false);
    await createPDF('إشعار مدين قياسي', 'Standard Debit Note', 'Standard Debit Note', 'standard_debit_note.pdf', true, true);
    await createPDF('إشعار دائن قياسي', 'Standard Credit Note', 'Standard Credit Note', 'standard_credit_note.pdf', true, true);
}

main().catch(console.error);
