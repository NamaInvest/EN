const fs = require('fs');

const code = fs.readFileSync('src/lib/i18n.tsx', 'utf8');

// We want to extract the translations object and evaluate it
let transStr = code.substring(code.indexOf('const translations'));
transStr = transStr.substring(0, transStr.indexOf('export function'));
transStr = transStr.replace('const translations: Record<Language, Record<string, string>> = ', 'const translations = ');

fs.writeFileSync('tmp_trans.js', transStr + '\nmodule.exports = translations;');
const translations = require('./tmp_trans.js');

console.log('EN keys length:', Object.keys(translations.en || {}).length);
console.log('AR keys length:', Object.keys(translations.ar || {}).length);

console.log('AR sidebar_dashboard:', translations.ar['sidebar.section.dashboard']);
console.log('EN sidebar_dashboard:', translations.en['sidebar.section.dashboard']);
console.log('EN sales_invoices:', translations.en['sidebar.item.sales_invoices']);

