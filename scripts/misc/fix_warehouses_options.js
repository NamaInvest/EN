const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/app/(dashboard)/warehouses/options/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// The replacement character is U+FFFD (represented as \uFFFD)
const fixes = [
  { bad: "✅ تمت \uFFFD\uFFFD\uFFFD\uFFFD\uFFFD \uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD", good: "✅ تمت الإضافة" },
  { bad: "❌ فشل في ال\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD", good: "❌ فشل في الإضافة" },
  { bad: " \uFFFD\uFFFD تريد \uFFFD\uFFFD\uFFFD هذه \uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD؟", good: "هل تريد حذف هذه الوحدة؟" },
  { bad: "✅ تم ال\uFFFD\uFFFD\uFFFD", good: "✅ تم الحذف" },
  { bad: "❌ تعذر ال\uFFFD\uFFFD\uFFFD - ربما تستخدمها \uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFDات", good: "❌ تعذر الحذف - ربما تستخدمها منتجات" },
  { bad: "\uFFFD\uFFFD توجد تغييرات", good: "لا توجد تغييرات" },
  { bad: "✅ تم ال\uFFFD\uFFFD\uFFFD", good: "✅ تم الحفظ" },
  { bad: "❌ فشل في ال\uFFFD\uFFFD\uFFFD", good: "❌ فشل في الحفظ" },
  { bad: "⏳ جارٍ ال\uFFFD\uFFFD\uFFFD...", good: "⏳ جارٍ الحفظ..." },
  { bad: "💾 \uFFFD\uFFFD\uFFFD التغييرات", good: "💾 حفظ التغييرات" },
  { bad: " \uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD الطابعة و\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD", good: "إعدادات الطابعة والباركود" },
  { bad: "حجم ملصق \uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD", good: "حجم ملصق الباركود" },
  { bad: "اختبار \uFFFD\uFFFD\uFFFD\uFFFD\uFFFD \uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD", good: "اختبار طباعة الباركود" },
  { bad: "تُستخدم لتعريف وحدات \uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD المتعددة.", good: "تُستخدم لتعريف وحدات الصنف المتعددة." },
  { bad: "\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD وحدة \uFFFD\uFFFD\uFFFD\uFFFDة", good: "إضافة وحدة جديدة" },
  { bad: "اسم \uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD (مثال", good: "اسم الوحدة (مثال" },
  { bad: "➕ \uFFFD\uFFFD\uFFFD\uFFFD\uFFFD", good: "➕ إضافة" },
  { bad: "\uFFFD\uFFFD توجد وحدات تعبئة. أضف أولى وحداتك أع\uFFFD\uFFFDه.", good: "لا توجد وحدات تعبئة. أضف أولى وحداتك أعلاه." },
  { bad: "title=\"\uFFFD\uFFFD\uFFFD\"", good: "title=\"حذف\"" },
  { bad: "✅ تمت \uFFFD\uFFFD\uFFFD\uFFFD\uFFFD", good: "✅ تمت الإضافة" },
  { bad: " \uFFFD\uFFFD تريد \uFFFD\uFFFD\uFFFD هذه \uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD", good: "هل تريد حذف هذه الوحدة" },
  { bad: " \uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD الطابعة و\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD", good: "إعدادات الطابعة والباركود" },
];

fixes.forEach(fix => {
    // Escape string for regex
    const regex = new RegExp(fix.bad.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
    content = content.replace(regex, fix.good);
});

// For any remaining U+FFFD, just wipe them so they don't break the UI
content = content.replace(/\uFFFD/g, '');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed warehouses options page.');
