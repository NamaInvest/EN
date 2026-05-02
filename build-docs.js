const fs = require('fs');
const showdown = require('showdown');
const converter = new showdown.Converter();
const md = fs.readFileSync('NAMA_ERP_DOCUMENTATION.md', 'utf8');
const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Nama ERP Docs</title><style>body{font-family:sans-serif;line-height:1.6;padding:2rem;max-width:900px;margin:auto;} h1,h2,h3{color:#333;}</style></head><body>' + converter.makeHtml(md) + '</body></html>';
fs.writeFileSync('NAMA_ERP_DOCUMENTATION.html', html);
console.log('Documentation HTML generated successfully.');
