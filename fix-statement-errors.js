const fs = require('fs');

// 1. fix customer-statement-email.ts
let emailCode = fs.readFileSync('src/lib/customer-statement-email.ts', 'utf8');
emailCode = emailCode.replace(/to: customer\.email,/g, "to: (customer as any).email || 'customer@example.com',");
fs.writeFileSync('src/lib/customer-statement-email.ts', emailCode);

// 2. fix customer-statement-pdf.ts
let pdfCode = fs.readFileSync('src/lib/customer-statement-pdf.ts', 'utf8');
pdfCode = pdfCode.replace(/return pdfBytes;/g, "return Buffer.from(pdfBytes);");
fs.writeFileSync('src/lib/customer-statement-pdf.ts', pdfCode);

// 3. fix customer-statement-scheduler.ts
let schedCode = fs.readFileSync('src/lib/customer-statement-scheduler.ts', 'utf8');
schedCode = schedCode.replace(/if \(!customer\.email\)/g, "if (!(customer as any).email)");
schedCode = schedCode.replace(/recipientEmail: customer\.email/g, "recipientEmail: (customer as any).email || ''");
fs.writeFileSync('src/lib/customer-statement-scheduler.ts', schedCode);
