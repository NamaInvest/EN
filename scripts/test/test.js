const ts = require('typescript');
const fs = require('fs');

const code = fs.readFileSync('src/lib/translations.ts', 'utf8');
const jsCode = ts.transpile(code.replace('export default translations;', 'module.exports = translations;').replace(/export /g, ''));
fs.writeFileSync('temp.js', jsCode);
const trans = require('./temp.js');
console.log('AR keys:', Object.keys(trans.ar).length);
console.log('EN keys:', Object.keys(trans.en).length);
console.log('EN sidebar dashboard:', trans.en['sidebar.section.dashboard']);
