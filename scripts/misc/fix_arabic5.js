const fs = require('fs');
let c = fs.readFileSync('src/app/ice/page.tsx', 'utf8');
const lines = c.split('\n');
let count = 0;

// Line 229
lines[228] = "                alert('⚠️ خطأ: ' + (data.error || 'فشل الإجراء'));";
// Line 231 (alert in catch)
for (let i = 230; i < 235; i++) {
  if (lines[i] && lines[i].includes("alert") && lines[i].includes("\u0637\u00ae")) {
    lines[i] = "        } catch { alert('⚠️ خطأ في الاتصال بالخادم'); }";
    break;
  }
}
// Line 251
lines[250] = "                alert('⚠️ خطأ: ' + (data.error || 'فشل تغيير حالة الوحدة'));";
// Line 253 (alert in catch for toggleSection)
for (let i = 252; i < 256; i++) {
  if (lines[i] && lines[i].includes("alert") && lines[i].includes("\u0637\u00ae")) {
    lines[i] = "        } catch { alert('⚠️ خطأ في الاتصال بالخادم'); }";
    break;
  }
}
// Line 291 - refresh button title
lines[290] = lines[290].replace(/title="[^"]*"/, 'title="تحديث"');
// Line 447 - extend button text
lines[446] = lines[446].replace(/[\u0637\u0638][\u00a0-\u02ff\u0178\u0192\u201e\u2020\u2026\u02c6]+(?:\s[\u0637\u0638][\u00a0-\u02ff\u0178\u0192\u201e\u2020\u2026\u02c6]+)*/g, 'تمديد');
// Line 454 - upgrade label
lines[453] = lines[453].replace(/>([^<]+)</, '>ترقية الباقة المدفوعة<');
// Line 467 - activate button text
lines[466] = lines[466].replace(/[\u0637\u0638][\u00a0-\u02ff\u0178\u0192\u201e\u2020\u2026\u02c6]+(?:\s[\u0637\u0638][\u00a0-\u02ff\u0178\u0192\u201e\u2020\u2026\u02c6]+)*/g, 'تفعيل');
// Line 474 - quota label
lines[473] = lines[473].replace(/>([^<]+)</, '>تعديل حصص الموارد يدوياً<');
// Line 477-479 - quota field labels
lines[476] = lines[476].replace(/label: '[^']+'/, "label: 'فواتير'");
lines[477] = lines[477].replace(/label: '[^']+'/, "label: 'أصناف'");
lines[478] = lines[478].replace(/label: '[^']+'/, "label: 'مستخدمين'");
// Line 492 - save quotas button
lines[491] = "                                                {busy === 'set_quota' ? '⏳ جارٍ الحفظ...' : '💾 تطبيق القيود الجديدة'}";
// Line 500 - confirm dialog
lines[499] = "                                                onClick={() => { if (confirm('⚠️ هل أنت متأكد من تعليق الوصول الكامل؟')) doAction('suspend'); }}";
// Line 535 - module sub count
lines[534] = lines[534].replace(/\{sec\.subs\.length\}[^<]*</, '{sec.subs.length} أقسام<');
// Line 512 (سجل وحدات المنصة header)
for (let i = 508; i < 515; i++) {
  if (lines[i] && lines[i].includes('text-lg font-black') && lines[i].includes('ALL_SECTIONS')) {
    lines[i] = lines[i].replace(/>([^<]*)\(/, '>سجل وحدات المنصة (');
    break;
  }
}
// Line 427-428 (إدارة الاشتراك والقيود)
for (let i = 425; i < 432; i++) {
  if (lines[i] && lines[i].includes('text-lg font-black') && /[\u0637\u0638]/.test(lines[i])) {
    lines[i] = lines[i].replace(/>([^<]+)<\/h3>/, '>إدارة الاشتراك والقيود</h3>');
    break;
  }
}
// Line 434 (تمديد الفترة التجريبية label)
for (let i = 432; i < 438; i++) {
  if (lines[i] && lines[i].includes('tracking-widest') && /[\u0637\u0638]/.test(lines[i]) && i < 440) {
    lines[i] = lines[i].replace(/>([^<]+)</, '>تمديد الفترة التجريبية<');
    break;
  }
}

c = lines.join('\n');
fs.writeFileSync('src/app/ice/page.tsx', c, 'utf8');

// Final check
const remaining = (c.match(/[\u0637\u0638][\u00a0-\u00ff]/g) || []).length;
console.log('Remaining garbled pairs:', remaining);
console.log('Done!');
