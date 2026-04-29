const fs = require('fs');
const path = require('path');

const salesPath = path.join(__dirname, 'src/app/(dashboard)/sales/page.tsx');
const quotesPath = path.join(__dirname, 'src/app/(dashboard)/price-quotes/page.tsx');

let code = fs.readFileSync(salesPath, 'utf8');

// Replace standard titles
code = code.replace(/فاتورة مبيعات/g, 'عرض سعر');
code = code.replace(/الفاتورة/g, 'عرض السعر');
code = code.replace(/الفواتير/g, 'العروض');
code = code.replace(/فواتير/g, 'عروض أسعار');
code = code.replace(/فاتورة/g, 'عرض سعر');
code = code.replace(/رقم عرض سعر/g, 'رقم العرض'); // fix redundant

// Endpoints and Models
code = code.replace(/\/api\/sales/g, '/api/price-quotes');
code = code.replace(/\.invoiceNo/g, '.quoteNo');

// Make the Receipt explicitly a quote
code = code.replace(/<InvoiceReceipt([^>]+)>/g, (match, props) => {
    if (props.includes('isQuote')) return match;
    return `<InvoiceReceipt${props} isQuote={true} />`;
});

// Rename manualInvoiceNo strings to something else if needed but logic works fine.

// Replace bnpl notes? actually harmless to keep as is.

fs.writeFileSync(quotesPath, code);

console.log('Successfully cloned sales layout to price-quotes and injected quote flags.');
