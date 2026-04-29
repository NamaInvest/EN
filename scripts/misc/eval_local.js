const fs = require('fs');
const ts = require('typescript');
const code = fs.readFileSync('src/lib/translations.ts', 'utf8');
const js = ts.transpile(code.replace('export default translations;', 'console.log("POS en:", translations.en ? translations.en["sidebar.item.pos"] : "NO EN"); console.log("POS ar:", translations.ar ? translations.ar["sidebar.item.pos"] : "NO AR");').replace('export type', ';//').replace('export function', ';//'));
eval(js);
