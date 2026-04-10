const fs = require('fs');
const file = 'd:/namasoft9-3-main/src/components/InvoiceReceipt.tsx';
let c = fs.readFileSync(file, 'utf8');

const startMarker = 'const handleExportPDF = useCallback(() => {';
const endMarker = '    const handlePrint = useCallback(() => {';

const startIdx = c.indexOf(startMarker);
const endIdx = c.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
    const newFn = `    const handleExportPDF = useCallback(() => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => {
            const ps = paperSizes[printerType] || paperSizes['80mm'];
            const content = receiptRef.current?.innerHTML || '';
            const htmlString = \`
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
                        /* We apply a wrapper to mimic the thermal width but centered nicely on A4 */
                        .receipt-wrapper {
                            width: 400px;
                            margin: 0 auto;
                            padding: 10px;
                        }
                    </style>
                </head>
                <body>
                    <div class="receipt-wrapper">
                        \${content}
                    </div>
                </body>
                </html>
            \`;

            // @ts-ignore
            window.html2pdf().from(htmlString).set({
                margin: 10,
                filename: \`Invoice_\${invoiceData?.invoiceNumber || invoiceId || Date.now()}.pdf\`,
                image: { type: 'jpeg', quality: 1 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            }).save();
        };
        document.body.appendChild(script);
    }, [printerType, invoiceData, invoiceId, isQuote, companyName, vatNumber, t]);

`;

    c = c.substring(0, startIdx) + newFn + c.substring(endIdx);
    fs.writeFileSync(file, c);
    console.log("Successfully replaced handleExportPDF");
} else {
    console.error("Could not find boundaries for handleExportPDF");
}
