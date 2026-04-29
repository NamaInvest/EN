const fs = require('fs');
let c = fs.readFileSync('src/app/ice/page.tsx', 'utf8');

// The Arabic text is garbled (double-encoded). We need to replace it with correct Arabic.
// Strategy: find each label: '...' pattern and replace the content

const labelFixes = [
  // ALL_SECTIONS main labels (in order of appearance)
  [/label: '[^']*المبيعات[^']*'/g, null], // skip if already fixed
  
  // Main section labels - match by key since labels are garbled
  [/(key: 'Sales',\s+icon:[^,]+,\s+label: )('[^']+')/, "$1'المبيعات'"],
  [/(key: 'Sales\.Invoices', label: )('[^']+')/, "$1'فواتير المبيعات'"],
  [/(key: 'Sales\.Quotes', label: )('[^']+')/, "$1'عروض الأسعار'"],
  [/(key: 'Sales\.Returns', label: )('[^']+')/, "$1'المرتجعات'"],
  
  [/(key: 'POS',\s+icon:[^,]+,\s+label: )('[^']+')/, "$1'نقطة البيع'"],
  [/(key: 'POS\.Main', label: )('[^']+')/, "$1'شاشة البيع'"],
  [/(key: 'POS\.Restaurants', label: )('[^']+')/, "$1'المطاعم'"],
  [/(key: 'POS\.Shifts', label: )('[^']+')/, "$1'الورديات'"],
  
  [/(key: 'Purchases',\s+icon:[^,]+,\s+label: )('[^']+')/, "$1'المشتريات'"],
  [/(key: 'Purchases\.Invoices', label: )('[^']+')/, "$1'فواتير المشتريات'"],
  [/(key: 'Purchases\.Orders', label: )('[^']+')/, "$1'أوامر الشراء'"],
  [/(key: 'Purchases\.Returns', label: )('[^']+')/, "$1'مرتجعات المشتريات'"],
  
  [/(key: 'Inventory',\s+icon:[^,]+,\s+label: )('[^']+')/, "$1'المخزون والمستودعات'"],
  [/(key: 'Inventory\.Products', label: )('[^']+')/, "$1'الأصناف'"],
  [/(key: 'Inventory\.Warehouses', label: )('[^']+')/, "$1'المستودعات'"],
  [/(key: 'Inventory\.Stocktaking', label: )('[^']+')/, "$1'الجرد'"],
  [/(key: 'Inventory\.Barcode', label: )('[^']+')/, "$1'الباركود'"],
  
  [/(key: 'Finance',\s+icon:[^,]+,\s+label: )('[^']+')/, "$1'المالية والحسابات'"],
  [/(key: 'Finance\.Accounting', label: )('[^']+')/, "$1'دفتر الأستاذ'"],
  [/(key: 'Finance\.Treasury', label: )('[^']+')/, "$1'الخزينة'"],
  [/(key: 'Finance\.Assets', label: )('[^']+')/, "$1'الأصول الثابتة'"],
  
  [/(key: 'HR',\s+icon:[^,]+,\s+label: )('[^']+')/, "$1'الموارد البشرية'"],
  [/(key: 'HR\.Employees', label: )('[^']+')/, "$1'الموظفون'"],
  [/(key: 'HR\.Payroll', label: )('[^']+')/, "$1'الرواتب'"],
  [/(key: 'HR\.Attendance', label: )('[^']+')/, "$1'الحضور والانصراف'"],
  [/(key: 'HR\.Leaves', label: )('[^']+')/, "$1'الإجازات'"],
  
  [/(key: 'Manufacturing',\s+icon:[^,]+,\s+label: )('[^']+')/, "$1'التصنيع والإنتاج'"],
  [/(key: 'Manufacturing\.BOM', label: )('[^']+')/, "$1'قائمة المواد (BOM)'"],
  [/(key: 'Manufacturing\.MRP', label: )('[^']+')/, "$1'تخطيط الإنتاج (MRP)'"],
  [/(key: 'Manufacturing\.Quality', label: )('[^']+')/, "$1'ضبط الجودة'"],
  
  [/(key: 'CRM',\s+icon:[^,]+,\s+label: )('[^']+')/, "$1'العملاء والتسويق'"],
  [/(key: 'CRM\.Customers', label: )('[^']+')/, "$1'إدارة العملاء'"],
  [/(key: 'CRM\.Loyalty', label: )('[^']+')/, "$1'برنامج الولاء'"],
  [/(key: 'CRM\.Coupons', label: )('[^']+')/, "$1'الكوبونات'"],
  [/(key: 'CRM\.Bookings', label: )('[^']+')/, "$1'الحجوزات'"],
  
  [/(key: 'Enterprise',\s+icon:[^,]+,\s+label: )('[^']+')/, "$1'الأنظمة المتخصصة'"],
  [/(key: 'Enterprise\.Projects', label: )('[^']+')/, "$1'إدارة المشاريع'"],
  [/(key: 'Enterprise\.RealEstate', label: )('[^']+')/, "$1'العقارات'"],
  [/(key: 'Enterprise\.Fleet', label: )('[^']+')/, "$1'الأسطول'"],
  [/(key: 'Enterprise\.Schools', label: )('[^']+')/, "$1'المدارس'"],
  
  [/(key: 'AI',\s+icon:[^,]+,\s+label: )('[^']+')/, "$1'الذكاء الاصطناعي'"],
  [/(key: 'AI\.CFO', label: )('[^']+')/, "$1'CFO الذكي'"],
  [/(key: 'AI\.SCM', label: )('[^']+')/, "$1'سلسلة التوريد الذكية'"],
  
  [/(key: 'Reports',\s+icon:[^,]+,\s+label: )('[^']+')/, "$1'التقارير'"],
  [/(key: 'Reports\.Sales', label: )('[^']+')/, "$1'تقارير المبيعات'"],
  [/(key: 'Reports\.Finance', label: )('[^']+')/, "$1'التقارير المالية'"],
  [/(key: 'Reports\.Inventory', label: )('[^']+')/, "$1'تقارير المخزون'"],
  
  [/(key: 'Settings',\s+icon:[^,]+,\s+label: )('[^']+')/, "$1'الإعدادات'"],
  [/(key: 'Settings\.Branches', label: )('[^']+')/, "$1'الفروع'"],
  [/(key: 'Settings\.Currencies', label: )('[^']+')/, "$1'العملات'"],
  [/(key: 'Settings\.Approvals', label: )('[^']+')/, "$1'الموافقات'"],
  [/(key: 'Settings\.WhatsApp', label: )('[^']+')/, "$1'تكامل واتساب'"],
  
  // Plans
  [/(value: 'basic',\s+label: )('[^']+')/, "$1'أساسي'"],
  [/(value: 'professional', label: )('[^']+')/, "$1'احترافي'"],
  [/(value: 'enterprise',\s+label: )('[^']+')/, "$1'مؤسسات'"],
];

let count = 0;
for (const [pattern, replacement] of labelFixes) {
  if (!replacement) continue;
  const before = c;
  c = c.replace(pattern, replacement);
  if (c !== before) count++;
}

// Fix remaining UI strings by searching for known garbled sequences
const uiPairs = [
  ['محرك نما إنفست', 'محرك نما إنفست'], // header - may already be correct
];

// Fix the inline text strings using broader approach
// Replace all remaining garbled Arabic between quotes
// Find strings like 'xxxx' where xxxx contains specific garbled chars
const garbledToArabic = {
  // These are from lines 277-500+ in the file
};

fs.writeFileSync('src/app/ice/page.tsx', c, 'utf8');
console.log(`Fixed ${count} Arabic labels in ice/page.tsx`);

// Verify
const verify = fs.readFileSync('src/app/ice/page.tsx', 'utf8');
const salesMatch = verify.match(/key: 'Sales',\s+icon:[^,]+,\s+label: '([^']+)'/);
console.log('Sales label now:', salesMatch ? salesMatch[1] : 'NOT FOUND');
const posMatch = verify.match(/key: 'POS',\s+icon:[^,]+,\s+label: '([^']+)'/);
console.log('POS label now:', posMatch ? posMatch[1] : 'NOT FOUND');
