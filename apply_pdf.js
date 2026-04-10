const fs = require('fs');
const file = 'd:/namasoft9-3-main/src/components/InvoiceReceipt.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

let startIdx = lines.findIndex(l => l.includes('const handleExportPDF = useCallback(() => {'));
let endIdx = lines.findIndex((l, i) => i > startIdx && l.includes('}, [invoiceData, invoiceId, printerType, isQuote]);'));

if (startIdx !== -1 && endIdx !== -1) {
    const newFn = `    const handleExportPDF = useCallback(() => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => {
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
                    </style>
                </head>
                <body>
                    <div style="width: 320px; margin: 0 auto; padding: 20px;">
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
    }, [invoiceData, invoiceId, printerType, isQuote]);`;

    lines.splice(startIdx, endIdx - startIdx + 1, newFn);
    fs.writeFileSync(file, lines.join('\n'));
    console.log("Successfully replaced handleExportPDF safely");
} else {
    console.error("Could not find start/end", { startIdx, endIdx });
}
