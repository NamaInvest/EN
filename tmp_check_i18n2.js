const fs = require('fs');

try {
    const code = fs.readFileSync('d:/namasoft9-3-main/src/lib/i18n.tsx', 'utf8');

    // Remove the typescript types and context to just leave the object
    let objStr = code.substring(code.indexOf('const translations'));
    objStr = objStr.substring(0, objStr.indexOf('// ============ CONTEXT ============'));

    // Fix TS types
    objStr = objStr.replace('const translations: Record<Language, Record<string, string>> =', 'const translations =');

    fs.writeFileSync('d:/namasoft9-3-main/tmp_trans.js', objStr + '\nmodule.exports = translations;');
    const translations = require('d:/namasoft9-3-main/tmp_trans.js');

    console.log("Is sales_invoices in en object?", !!translations.en['sidebar.item.sales_invoices']);
    console.log("Is copilot in en object?", !!translations.en['sidebar.item.copilot']);

} catch(err) {
    console.error(err);
}
