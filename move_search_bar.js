const fs = require('fs');

const file = 'd:/namasoft9-3-main/src/app/(dashboard)/sales/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const searchHeaderIndex = content.indexOf('{/* Invoice Header */}');
const searchStartIndex = content.indexOf('{/* Smart Unified Search Bar */}');
const searchEndIndex = content.indexOf('{/* Cart Table */}');

if (searchHeaderIndex === -1 || searchStartIndex === -1 || searchEndIndex === -1) {
    console.error('Could not find markers');
    process.exit(1);
}

// Extract the search block
let searchBlock = content.substring(searchStartIndex, searchEndIndex);

// Remove the search block from its original position
content = content.substring(0, searchStartIndex) + content.substring(searchEndIndex);

// Enhance the search block styles
searchBlock = searchBlock.replace(
    /padding: '12px', background: 'var\(--bg-card\)', borderBottom: '1px solid var\(--border\)', zIndex: 10/,
    "padding: '16px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', zIndex: 20, marginBottom: '8px', borderRadius: '8px'"
);

searchBlock = searchBlock.replace(
    /width: '100%', fontSize: '16px', padding: '12px 16px', fontWeight: 'bold'/,
    "width: '100%', fontSize: '18px', padding: '16px 24px', fontWeight: 'bold', borderRadius: '12px', border: '2px solid var(--primary)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'"
);

// Insert it BEFORE the Invoice Header
const targetIndex = content.indexOf('{/* Invoice Header */}');
content = content.substring(0, targetIndex) + searchBlock + "\n                        " + content.substring(targetIndex);

fs.writeFileSync(file, content);
console.log('Successfully moved and enhanced the search bar!');
