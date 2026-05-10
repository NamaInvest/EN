// Fix layout.tsx mojibake metadata + batch console.log migration
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function fixFile(rel, replacements) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) { console.log('SKIP:', rel); return; }
  let c = fs.readFileSync(full, 'utf8');
  let n = 0;
  for (const [o, r] of replacements) {
    if (c.includes(o)) { c = c.split(o).join(r); n++; }
  }
  fs.writeFileSync(full, c, 'utf8');
  console.log(`  ✓ ${rel} (${n} fixes)`);
}

function migrateConsole(rel, routeName) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) { console.log('SKIP:', rel); return; }
  let c = fs.readFileSync(full, 'utf8');
  const IMPORT = `import { logger } from '@/lib/logger';`;
  if (!c.includes(IMPORT)) {
    // inject after last import line
    const lines = c.split('\n');
    let lastImport = 0;
    lines.forEach((l, i) => { if (l.startsWith('import ')) lastImport = i; });
    lines.splice(lastImport + 1, 0, `${IMPORT}\nconst log = logger.child({ route: '${routeName}' });`);
    c = lines.join('\n');
  }
  let n = 0;
  for (const [o, r] of [['console.error(', 'log.error('], ['console.warn(', 'log.warn('], ['console.log(', 'log.info(']]) {
    while (c.includes(o)) { c = c.replace(o, r); n++; }
  }
  fs.writeFileSync(full, c, 'utf8');
  console.log(`  ✓ ${rel} (${n} console→log)`);
}

console.log('=== Fixing layout.tsx metadata ===');
fixFile('src/app/layout.tsx', [
  ['ظ†ظ…ط§ ط§ظ†ظپط³طھ (Nama Invest) - ط£ظپط¶ظ„ ظ†ط¸ط§ظ… ERP ظˆظ†ظ‚ط§ط· ط¨ظٹط¹ ظپظٹ ط§ظ„ط³ط¹ظˆط¯ظٹط©',
   'نما انفست (Nama Invest) — أفضل نظام ERP ونقاط بيع في المملكة العربية السعودية'],
  ['ط£ظپط¶ظ„ ظ†ط¸ط§ظ… ظ…ط­ط§ط³ط¨ظٹ ط³ط­ط§ط¨ظٹ ظˆظ†ظ‚ط§ط· ط¨ظٹط¹ (POS) ظ…طھظˆط§ظپظ‚ ظ…ط¹ ظ‡ظٹط¦ط© ط§ظ„ط²ظƒط§ط© ظˆط§ظ„ط¶ط±ظٹط¨ط© ظˆط§ظ„ط¬ظ…ط§ط±ظƒ (ط§ظ„ظ…ط±ط­ظ„ط© ط§ظ„ط«ط§ظ†ظٹط©). ظٹط´ظ…ظ„ 104 ظˆط­ط¯ط© ط¨ط±ظ…ط¬ظٹط©طŒ ط¥ط¯ط§ط±ط© ط§ظ„ظ…ط®ط²ظˆظ†طŒ ط§ظ„ظ…ظˆط§ط±ط¯ ط§ظ„ط¨ط´ط±ظٹط©طŒ ظˆط§ظ„ظ…ط¨ظٹط¹ط§طھ.',
   'أفضل نظام محاسبي سحابي ونقاط بيع (POS) متوافق مع هيئة الزكاة والضريبة والجمارك (المرحلة الثانية). يشمل 104 وحدة برمجية، إدارة المخزون، الموارد البشرية، والمبيعات.'],
  ['"ظ†ط¸ط§ظ… ظ…ط­ط§ط³ط¨ظٹ"','"نظام محاسبي"'],
  ['"ظ†ظ‚ط§ط· ط¨ظٹط¹"','"نقاط بيع"'],
  ['"ظƒط§ط´ظٹط±"','"كاشير"'],
  ['"ط§ظ„ظپط§طھظˆط±ط© ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹط©"','"الفاتورة الإلكترونية"'],
  ['"طھطµط±ظٹط­ ظ‡ظٹط¦ط© ط§ظ„ط²ظƒط§ط©"','"تصريح هيئة الزكاة"'],
  ['"ERP ط³ط¹ظˆط¯ظٹ"','"ERP سعودي"'],
  ['ظ†ظ…ط§ ط§ظ†ظپط³طھ - ط£ظ‚ظˆظ‰ ظ†ط¸ط§ظ… ERP ظˆظ†ظ‚ط§ط· ط¨ظٹط¹ \u2013 104 ظˆط­ط¯ط© ط¨ط±ظ…ط¬ظٹط©',
   'نما انفست — أقوى نظام ERP ونقاط بيع — 104 وحدة برمجية'],
  ['ظ†ط¸ط§ظ… ظ…طھظˆط§ظپظ‚ ظ…ط¹ ط§ظ„ظ…ط±ط­ظ„ط© ط§ظ„ط«ط§ظ†ظٹط© ظ„ظ‡ظٹط¦ط© ط§ظ„ط²ظƒط§ط© ظˆط§ظ„ط¯ط®ظ„طŒ ط£طھظ…طھط© ظƒط§ظ…ظ„ط© ظ„ظ„ظ…ط®ط²ظˆظ† ظˆط§ظ„ظ…ط­ط§ط³ط¨ط©.',
   'نظام متوافق مع المرحلة الثانية لهيئة الزكاة والدخل، أتمتة كاملة للمخزون والمحاسبة.'],
  ['ظ†ط¸ط§ظ… طھط®ط·ظٹط· ظ…ظˆط§ط±ط¯ ط§ظ„ظ…ط¤ط³ط³ط§طھ ط§ظ„ط¹ط§ظ„ظ…ظٹ (Global ERP) ظˆظ†ظ‚ط§ط·',
   'نظام تخطيط موارد المؤسسات العالمي (Global ERP) ونقاط'],
  ['طھط¬ط±ط¨ط© ظ…ط¬ط§', 'تجربة مجا'],
  ['\"ط³ط¹ط± ط§ظ„ط§ط´طھط±ط§ظƒ\"', '"سعر الاشتراك"'],
]);

console.log('\n=== Migrating console.log in API routes ===');
const routesToFix = [
  ['src/app/api/purchases/route.ts',             'purchases'],
  ['src/app/api/products/route.ts',              'products'],
  ['src/app/api/ice/toggle/route.ts',            'ice/toggle'],
  ['src/app/api/admin/nodes/sync/route.ts',      'admin/nodes/sync'],
];

for (const [rel, name] of routesToFix) {
  migrateConsole(rel, name);
}

console.log('\nAll done!');
