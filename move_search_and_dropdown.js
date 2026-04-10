const fs = require('fs');

const file = 'd:/namasoft9-3-main/src/app/(dashboard)/sales/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const searchStartIndex = content.indexOf('{/* Smart Unified Search Bar */}');
const searchEndIndex = content.indexOf('                        {/* Invoice Header */}');

if (searchStartIndex === -1 || searchEndIndex === -1) {
    console.error('Could not find markers');
    process.exit(1);
}

// Extract the search block
let searchBlock = content.substring(searchStartIndex, searchEndIndex).trimEnd();

// Remove the search block from its original position
content = content.substring(0, searchStartIndex) + content.substring(searchEndIndex);

// Enhance the search block styles to fit next to the dropdowns
searchBlock = searchBlock.replace(
    /padding: '16px', background: 'var\(--bg-card\)', borderBottom: '1px solid var\(--border\)', zIndex: 20, marginBottom: '8px', borderRadius: '8px'/,
    "position: 'relative', zIndex: 20, flex: '1 1 300px'"
);

searchBlock = searchBlock.replace(
    /width: '100%', fontSize: '18px', padding: '16px 24px', fontWeight: 'bold', borderRadius: '12px', border: '2px solid var\(--primary\)', boxShadow: '0 4px 12px rgba\(0,0,0,0.05\)'/,
    "width: '100%', fontSize: '15px', padding: '10px 16px', fontWeight: 'bold', borderRadius: '8px', border: '2px solid var(--primary)'"
);

// FIX DROPDOWN DIRECTION
searchBlock = searchBlock.replace(
    /bottom: '100%',\s*left: 0,\s*right: 0,\s*marginBottom: '8px',/s,
    "top: '100%',\n                                        left: 0,\n                                        right: 0,\n                                        marginTop: '4px',"
);

searchBlock = searchBlock.replace(
    /boxShadow: '0 -4px 12px rgba\(0,0,0,0.1\)',/,
    "boxShadow: '0 4px 12px rgba(0,0,0,0.1)',"
);


// Insert it INSIDE the Invoice Header, right after <div className="pos-invoice-header" ...>
const headerDivRegex = /<div className="pos-invoice-header" style={{[^}]+}}>/;
const match = content.match(headerDivRegex);
if (!match) {
    console.error('Could not find pos-invoice-header div');
    process.exit(1);
}

const insertIndex = match.index + match[0].length;
content = content.substring(0, insertIndex) + "\n                            " + searchBlock + content.substring(insertIndex);

fs.writeFileSync(file, content);
console.log('Successfully moved search bar and inverted dropdown direction!');
