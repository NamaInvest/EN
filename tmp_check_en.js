const fs = require('fs');
const ts = require('typescript');

try {
    const code = fs.readFileSync('d:/namasoft9-3-main/src/lib/i18n.tsx', 'utf8');

    // Simple regex to extract the en object strictly
    const enMatch = code.match(/en:\s*\{([^}]+)\}/);
    if (enMatch) {
        const enBody = enMatch[1];
        console.log("Found en block! Length:", enBody.length);
        console.log("Contains sales_invoices?", enBody.includes('sales_invoices'));
        console.log("Contains copilot?", enBody.includes('sidebar.item.copilot'));
    } else {
        console.log("Failed to match en: {} block!");
    }
} catch(err) {
    console.error(err);
}
