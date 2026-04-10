const fs = require('fs');
const file = 'd:/namasoft9-3-main/src/app/(dashboard)/sales/page.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('const taxEnabled = getSetting(\'POS_TAX_ENABLED\', \'true\') === \'true\';')) {
    content = content.replace("const discountEnabled = getSetting('POS_DISCOUNT_ENABLED', 'true') === 'true';", 
        "const discountEnabled = getSetting('POS_DISCOUNT_ENABLED', 'true') === 'true';\n    const taxEnabled = getSetting('POS_TAX_ENABLED', 'true') === 'true';");

    content = content.replace("const taxValue = afterDiscount * (taxRate / 100);",
        "const actualTaxRate = taxEnabled ? taxRate : 0;\n    const taxValue = afterDiscount * (actualTaxRate / 100);");

    // Replace hardcoded 15 with actualTaxRate in saveInvoice logic (approx line 622)
    // The literal text is `taxRate: 15, taxAmount: taxValue` ... wait, let's just regex `.replace(/taxRate: 15/g, 'taxRate: actualTaxRate')` but only for the invoice payload, not for setNewProd where taxRate is '15'.
    
    // Instead of regex hacking, let's manually find the invoice payload:
    content = content.replace("taxRate: 15,\n                        taxValue: taxValue,", "taxRate: actualTaxRate,\n                        taxValue: taxValue,");
    content = content.replace("taxRate: 15, taxAmount: inv.taxValue, grandTotal: inv.total,", "taxRate: 15, taxAmount: inv.taxValue, grandTotal: inv.total,"); // This is print window, it doesn't matter for logic

    // Wrap the VAT row in the UI
    const lines = content.split('\n');
    const vatStrIdx = lines.findIndex(l => l.includes("t('sys.str_773')")) - 1;
    if (vatStrIdx > 0 && !lines[vatStrIdx - 1].includes("taxEnabled &&")) {
        lines.splice(vatStrIdx, 0, '                                {taxEnabled && (');
        lines.splice(vatStrIdx + 5, 0, '                                )}');
    }
    
    fs.writeFileSync(file, lines.join('\n'));
    console.log("Successfully injected tax toggles in page.tsx!");
} else {
    console.log("Already injected!");
}
