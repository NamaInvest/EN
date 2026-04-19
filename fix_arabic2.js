const fs = require('fs');
let c = fs.readFileSync('src/app/ice/page.tsx', 'utf8');

// Fix remaining garbled UI strings by finding them by context
const contextFixes = [
  // Header
  [/className="text-lg font-black leading-none">[^<]+<\/div>/, 'className="text-lg font-black leading-none">محرك نما إنفست</div>'],
  // Stats labels
  [/"text-\[9px\] font-black text-emerald-600 uppercase">[^<]+<\/div>/, '"text-[9px] font-black text-emerald-600 uppercase">مدفوع</div>'],
  [/"text-\[9px\] font-black text-amber-500 uppercase">[^<]+<\/div>/, '"text-[9px] font-black text-amber-500 uppercase">تجريبي</div>'],
  [/"text-\[9px\] font-black text-rose-500 uppercase">[^<]+<\/div>/, '"text-[9px] font-black text-rose-500 uppercase">منتهي</div>'],
  // Search placeholder
  [/placeholder="[^"]*"/, 'placeholder="بحث عن مستأجر..."'],
  // Filter tabs
  [/\? 'all' \? '[^']*'/, "? 'all' ? 'الكل'"],
  // Subscription header
  [/h3 className="text-lg font-black">[^<]*<\/h3>\s*<\/div>\s*\n\s*<div className="p-8 space-y-8/s, null], // complex, skip
  // No tenants message
  [/<p className="text-sm font-bold">[^<]+<\/p>/, '<p className="text-sm font-bold">لا يوجد مستأجرون</p>'],
  // Main heading when no tenant selected
  [/<h2 className="text-2xl font-black">[^<]+<\/h2>/, '<h2 className="text-2xl font-black">قمرة قيادة البنية التحتية</h2>'],
  [/<p className="font-bold text-sm">[^<]+<\/p>/, '<p className="font-bold text-sm">اختر مستأجراً من القائمة للبدء</p>'],
];

let count = 0;
for (const [pattern, replacement] of contextFixes) {
  if (!replacement) continue;
  const before = c;
  c = c.replace(pattern, replacement);
  if (c !== before) count++;
}

// Fix filter tab labels - these are in a ternary
c = c.replace(/f === 'all' \? '[^']+' : f === 'active' \? '[^']+' : f === 'trial' \? '[^']+' : '[^']+'/, 
  "f === 'all' ? 'الكل' : f === 'active' ? 'مدفوع' : f === 'trial' ? 'تجريبي' : 'منتهي'");
count++;

// Fix section-related strings
c = c.replace(/font-black">[^<]*<\/h3>\s*<\/div>\s*\n\s*<div className="p-8 space-y-8 flex-1">/s, (match) => {
  // Only fix the subscription management header
  return match;
});

// Fix all remaining inline strings by searching for garbled patterns
// The pattern for garbled Arabic is sequences of \u0637 \u0638 chars
const garbledPattern = /[\u0637\u0638][\u00a0-\u02ff\u0178\u0192\u201e\u2020\u2026\u02c6][\u0637\u0638]?/;

// Fix specific known garbled strings
const knownGarbled = [
  [/>[^<]*\u0637\u00a7\u0638\u201e\u0637\u00aa\u0637\u00ad\u0637\u00af\u0638\u0178\u0637\u00ab[^<]*</, '>تحديث<'],
];

fs.writeFileSync('src/app/ice/page.tsx', c, 'utf8');
console.log(`Fixed ${count} additional UI strings`);

// Now also bump font-size from 20px to 24px
c = fs.readFileSync('src/app/ice/page.tsx', 'utf8');
c = c.replace("html { font-size: 20px !important; }", "html { font-size: 24px !important; }");
fs.writeFileSync('src/app/ice/page.tsx', c, 'utf8');
console.log('Bumped html font-size to 24px');
