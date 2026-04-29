const fs = require('fs');
const file = 'c:/Users/1/Desktop/alfa/src/components/InvoiceReceipt.tsx';
let c = fs.readFileSync(file, 'utf8');

if (!c.includes('const [companyCity')) {
    c = c.replace("const [vatNumber, setVatNumber] = useState('');", 
`const [vatNumber, setVatNumber] = useState('');
    const [companyCity, setCompanyCity] = useState('');
    const [crNumber, setCrNumber] = useState('');
    const [companyAddress, setCompanyAddress] = useState('');`
    );
}

const badFetch = "fetch('/api/auth/me').then(r=>r.json()).then(s => { if(s?.user?.fullName || s?.user?.username) setCashierName(s.user.fullName || s.user.username); }).catch(()=>{});";
const goodFetch = "const tk = window.localStorage.getItem('token'); if(tk) { fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + tk } }).then(r=>r.json()).then(s => { if(s?.user?.fullName || s?.user?.username) setCashierName(s.user.fullName || s.user.username); }).catch(()=>{}); }";
if (c.includes(badFetch)) {
    c = c.replace(badFetch, goodFetch);
}

const oldSetSettings = "setPrinterType(map['printer_type'] || '80mm');";
const newSetSettings = "setPrinterType(map['printer_type'] || '80mm');\\n                setCompanyCity(map['company_city'] || '');\\n                setCrNumber(map['cr_number'] || '');\\n                setCompanyAddress(map['company_address'] || map['company_address_ar'] || '');";
if (c.includes(oldSetSettings) && !c.includes('setCompanyCity(map')) {
    c = c.replace(oldSetSettings, newSetSettings);
}

const startMarker = 'const handleExportPDF = useCallback(() => {';
const searchLines = c.split('\\n');
const startIdx = searchLines.findIndex(l => l.includes(startMarker));
let endIdx = -1;
for(let i = startIdx; i < searchLines.length; i++) {
   if(searchLines[i].includes('}, [invoiceData, invoiceId')) {
       endIdx = i;
       break;
   }
}

if (startIdx !== -1 && endIdx !== -1) {
    const newHandleExportPDF = \`    const handleExportPDF = useCallback(() => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => {
            const data = invoiceData;
            if (!data) return;

            const formatCurrency = (v) => new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

            const htmlString = \\\`
                <html dir="rtl" lang="ar">
                <head>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800&display=swap');
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body {
                            font-family: 'Cairo', sans-serif;
                            line-height: 1.4;
                            direction: rtl;
                            color: #000;
                            background: white;
                            width: 100%;
                            padding: 20px;
                        }
                        .a4-container { width: 100%; padding: 20px 40px; }
                        .a4-header { text-align: center; margin-bottom: 20px; }
                        .a4-header h1 { font-size: 26px; font-weight: 800; margin-bottom: 5px; }
                        .a4-header h2 { font-size: 16px; font-weight: 600; margin-bottom: 5px; }
                        .a4-header h3 { font-size: 14px; color: #666; }
                        .bilingual-header { display: flex; justify-content: space-between; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 15px 0; margin-bottom: 20px; font-size: 14px; }
                        .bilingual-header > div { width: 48%; }
                        .bilingual-header .ar-side { text-align: right; }
                        .bilingual-header .en-side { text-align: left; direction: ltr; }
                        .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; border: 1px solid #000; }
                        .items-table th, .items-table td { border: 1px solid #000 !important; padding: 8px; text-align: center; }
                        .items-table th { font-weight: 600; background: #f9f9f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .items-table td:first-child, .items-table th:first-child { text-align: right; }
                    </style>
                </head>
                <body>
                    <div class="a4-container">
                        <div class="a4-header">
                            <h1>\\\${companyName}</h1>
                            <h2>الرقم الضريبي : <span dir="ltr">\\\${vatNumber}</span></h2>
                            <h3>\\\${isQuote ? 'عرض سعر / Quotation' : 'فاتورة ضريبية / Tax Invoice'}</h3>
                        </div>
                        
                        <div class="bilingual-header">
                            <div class="ar-side">
                                <p><strong>المدينة:</strong> \\\${companyCity}</p>
                                <p><strong>العنوان:</strong> \\\${companyAddress}</p>
                                <p><strong>رقم السجل التجاري:</strong> \\\${crNumber}</p><br/>
                                <p><strong>العميل:</strong> \\\${data.customerName || 'عميل نقدي'}</p>
                                <p><strong>رقم الفاتورة:</strong> <span dir="ltr">\\\${data.invoiceNumber}</span></p>
                                <p><strong>تاريخ الإصدار:</strong> <span dir="ltr">\\\${new Date(data.date).toLocaleString('en-GB')}</span></p>
                            </div>
                            <div class="en-side">
                                <p><strong>City:</strong> \\\${companyCity}</p>
                                <p><strong>Address:</strong> \\\${companyAddress}</p>
                                <p><strong>CR Number:</strong> \\\${crNumber}</p><br/>
                                <p><strong>Customer:</strong> \\\${data.customerName || 'Cash Customer'}</p>
                                <p><strong>Invoice No:</strong> \\\${data.invoiceNumber}</p>
                                <p><strong>Issue Date:</strong> \\\${new Date(data.date).toLocaleString('en-GB')}</p>
                            </div>
                        </div>

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
                                \\\${data.items.map(item => \\\`
                                    <tr>
                                        <td style="text-align: right;">\\\${item.name}</td>
                                        <td>\\\${item.quantity}</td>
                                        <td>\\\${formatCurrency(item.price)}</td>
                                        <td>\\\${formatCurrency(item.total)}</td>
                                    </tr>
                                \\\`).join('')}
                                
                                <tr>
                                    <td colSpan="3" style="text-align: left; font-weight: 600;">الإجمالي الفرعي / Subtotal:</td>
                                    <td style="font-weight: 600;">\\\${formatCurrency(data.subtotal)}</td>
                                </tr>
                                \\\${data.discount > 0 ? \\\`
                                <tr>
                                    <td colSpan="3" style="text-align: left; font-weight: 600; color: #e11d48;">الخصم / Discount:</td>
                                    <td style="font-weight: 600; color: #e11d48;">-\\\${formatCurrency(data.discount)}</td>
                                </tr>
                                \\\` : ''}
                                <tr>
                                    <td colSpan="3" style="text-align: left; font-weight: 600;">ضريبة القيمة المضافة / VAT (\\\${data.taxRate}%):</td>
                                    <td style="font-weight: 600;">\\\${formatCurrency(data.taxAmount)}</td>
                                </tr>
                                <tr>
                                    <td colSpan="3" style="text-align: left; font-size: 16px; font-weight: 900;">الإجمالي الكلي / Grand Total:</td>
                                    <td style="font-size: 16px; font-weight: 900;">\\\${formatCurrency(data.grandTotal)}</td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <div style="margin-top: 40px; text-align: center;">
                            \\\${!isQuote && qrDataUrl ? \\\`<img src="\\\${qrDataUrl}" style="width: 150px; height: 150px;" />\\\` : ''}
                        </div>
                    </div>
                </body>
                </html>
            \\\`;

            // @ts-ignore
            window.html2pdf().from(htmlString).set({
                margin: 0,
                filename: \\\`Invoice_\\\${invoiceData?.invoiceNumber || invoiceId || Date.now()}.pdf\\\`,
                image: { type: 'jpeg', quality: 1 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            }).save();
        };
        document.body.appendChild(script);
    }, [invoiceData, invoiceId, printerType, isQuote, companyName, companyCity, companyAddress, crNumber, vatNumber, qrDataUrl]);\`;

    searchLines.splice(startIdx, endIdx - startIdx + 1, newHandleExportPDF);
    c = searchLines.join('\\n');
    console.log("Successfully rebuilt A4 PDF Logic!");
} else {
    console.log("Did not find indices", startIdx, endIdx);
}

fs.writeFileSync(file, c);
