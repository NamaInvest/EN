const fs = require('fs');
const iconv = require('iconv-lite');

const file = 'src/app/(dashboard)/warehouses/options/page.tsx';
const content = fs.readFileSync(file, 'utf8');

// The content is a JS string containing the mojibake.
// Encode it to CP1256 bytes to get the original UTF-8 bytes back.
const originalBytes = iconv.encode(content, 'cp1256');

// Decode the original UTF-8 bytes back to a JS string.
const restoredContent = iconv.decode(originalBytes, 'utf8');

console.log('Restored sample:', restoredContent.substring(500, 1000));
