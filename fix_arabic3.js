const fs = require('fs');
let c = fs.readFileSync('src/app/ice/page.tsx', 'utf8');

// Fix remaining garbled Arabic - find all garbled strings by looking for the specific byte sequences
// The garbled Arab chars are in CP1256-interpreted-as-UTF8 pattern: \u0637\u00xx or \u0638\u00xx

// Count garbled chars remaining
const garbledCount = (c.match(/[\u0637\u0638][\u00a0-\u00ff]/g) || []).length;
console.log('Remaining garbled character pairs:', garbledCount);

// Build a decoder - the garbled text is UTF-8 bytes read as Windows-1256
// Let's fix the remaining UI strings manually by searching line by line
const lines = c.split('\n');
let fixCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Check if line has garbled Arabic
  if (/[\u0637\u0638][\u00a0-\u00ff]/.test(line)) {
    // Try to fix specific known patterns by line context
    // Subscription management header
    if (line.includes('text-lg font-black') && !line.includes('محرك نما')) {
      lines[i] = line.replace(/>([^<]+)</, '>إدارة الاشتراك والقيود<');
      fixCount++;
    }
    // Module registry header  
    else if (line.includes("text-lg font-black") && line.includes('ALL_SECTIONS')) {
      lines[i] = line.replace(/>([^<]+)\(/, '>سجل وحدات المنصة (');
      fixCount++;
    }
    // Trial extension label
    else if (line.includes('tracking-widest') && line.includes('>') && i > 430 && i < 440) {
      lines[i] = line.replace(/>([^<]+)</, '>تمديد الفترة التجريبية<');
      fixCount++;
    }
    // Extend button
    else if (line.includes('bg-emerald-600') && line.includes('>') && !line.includes('{')) {
      // skip complex lines
    }
    // Search placeholder already fixed
    // Filter tabs already fixed
  }
}

c = lines.join('\n');

// Fix all remaining garbled strings between > and < that contain garbled chars
// These are inline text nodes
const garbledTextPattern = />([\u0637\u0638][\u00a0-\u02ff\u0178\u0192\u201e\u2020\u2026\u02c6\u2122\u0152\u017d\u0153\u017e]+(?:\s[\u0637\u0638][\u00a0-\u02ff\u0178\u0192\u201e\u2020\u2026\u02c6\u2122\u0152\u017d\u0153\u017e]+)*)</g;

// Map of remaining garbled->correct that we can identify by position
// Let's just search for specific garbled sequences and replace them

// Helper to decode garbled UTF-8/CP1256
function fixGarbledArabic(text) {
  try {
    // The text is UTF-8 bytes that were decoded as Windows-1256 then re-encoded as UTF-8
    // We need to reverse this: encode as CP-1256, then decode as UTF-8
    const buf = Buffer.alloc(text.length);
    for (let i = 0; i < text.length; i++) {
      buf[i] = text.charCodeAt(i) & 0xFF;
    }
    return buf.toString('utf8');
  } catch(e) {
    return text;
  }
}

// Try to auto-fix remaining garbled text
c = c.replace(/>((?:[\u0637\u0638][\u00a0-\u00ff])+(?:\s(?:[\u0637\u0638][\u00a0-\u00ff])+)*)</g, (match, garbled) => {
  const fixed = fixGarbledArabic(garbled);
  if (fixed !== garbled && !fixed.includes('\ufffd')) {
    fixCount++;
    return '>' + fixed + '<';
  }
  return match;
});

// Also fix garbled text in quotes
c = c.replace(/'((?:[\u0637\u0638][\u00a0-\u00ff])+(?:\s(?:[\u0637\u0638][\u00a0-\u00ff])+)*)'/g, (match, garbled) => {
  const fixed = fixGarbledArabic(garbled);
  if (fixed !== garbled && !fixed.includes('\ufffd')) {
    fixCount++;
    return "'" + fixed + "'";
  }
  return match;
});

// Fix garbled text in error messages with specific patterns  
c = c.replace(/alert\('[^']*[\u0637\u0638][^']*'\)/g, (match) => {
  if (match.includes('خطأ')) return match; // already fixed
  return match
    .replace(/[\u0637\u0638][\u00a7-\u00ff](?:[\u0637\u0638][\u00a0-\u00ff])*/g, (g) => fixGarbledArabic(g));
});

fs.writeFileSync('src/app/ice/page.tsx', c, 'utf8');

// Final garbled count
const remaining = (c.match(/[\u0637\u0638][\u00a0-\u00ff]/g) || []).length;
console.log(`Fixed ${fixCount} more strings. Remaining garbled pairs: ${remaining}`);
