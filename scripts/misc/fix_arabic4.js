const fs = require('fs');
let c = fs.readFileSync('src/app/ice/page.tsx', 'utf8');

// Comprehensive fix: replace ALL garbled Arabic sequences  
// The garbled text pattern: chars in range U+0637-U+0638 followed by chars like U+00A7, U+00B1, etc.
// This is double-encoded Arabic UTF-8

// Find ALL garbled sequences (can span multiple words with spaces)
const garbledRegex = /([\u0637\u0638][\u00a0-\u02ff\u0178\u0192\u201e\u2020\u2026\u02c6]+(?:[\s\(\)]?[\u0637\u0638][\u00a0-\u02ff\u0178\u0192\u201e\u2020\u2026\u02c6]+)*)/g;

function tryDecodeGarbled(garbled) {
  // Build a byte array from the char codes
  const bytes = [];
  for (let i = 0; i < garbled.length; i++) {
    const code = garbled.charCodeAt(i);
    if (code <= 0xFF) {
      bytes.push(code);
    } else if (code <= 0xFFFF) {
      // Multi-byte: split into UTF-8 style bytes
      if (code <= 0x7FF) {
        bytes.push(0xC0 | (code >> 6));
        bytes.push(0x80 | (code & 0x3F));
      } else {
        bytes.push(0xE0 | (code >> 12));
        bytes.push(0x80 | ((code >> 6) & 0x3F));
        bytes.push(0x80 | (code & 0x3F));
      }
    }
  }
  
  try {
    const buf = Buffer.from(bytes);
    const decoded = buf.toString('utf8');
    // Verify it's valid Arabic
    if (/[\u0600-\u06FF]/.test(decoded) && !/\ufffd/.test(decoded)) {
      return decoded;
    }
  } catch(e) {}
  
  return null;
}

let fixCount = 0;
c = c.replace(garbledRegex, (match) => {
  const decoded = tryDecodeGarbled(match);
  if (decoded) {
    fixCount++;
    return decoded;
  }
  return match;
});

fs.writeFileSync('src/app/ice/page.tsx', c, 'utf8');

// Check remaining
const remaining = (c.match(/[\u0637\u0638][\u00a0-\u00ff]/g) || []).length;
console.log(`Decoded ${fixCount} garbled sequences. Remaining pairs: ${remaining}`);

// Show a sample of the fixed content
const lines = c.split('\n');
for (let i = 26; i < 32; i++) {
  console.log(`Line ${i+1}: ${lines[i].substring(0, 120)}`);
}
