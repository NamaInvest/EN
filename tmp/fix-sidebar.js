const fs = require('fs');
let c = fs.readFileSync('src/components/Sidebar.tsx','utf8');
const newAr = {
  'i.succession_planning': 'التعاقب الوظيفي',
  'i.bad_debt': 'الديون المعدومة',
  'i.vendor_onboarding': 'تأهيل الموردين',
  'i.rfx_auction': 'المزادات والمناقصات',
  'i.deferred_tax': 'الضريبة المؤجلة',
  'i.impairment': 'اضمحلال الأصول',
  'i.transfer_pricing': 'التسعير التحويلي',
  'i.roles': 'الصلاحيات والأدوار'
};
let arBlock = c.match(/ar: \{([\s\S]*?)\},\n\s*en:/);
if (arBlock) {
  let inner = arBlock[1];
  for (let k in newAr) {
    if (!inner.includes(k)) {
      inner += `    '${k}': '${newAr[k]}',\n`;
    }
  }
  c = c.replace(arBlock[1], inner);
  fs.writeFileSync('src/components/Sidebar.tsx', c);
  console.log('Fixed Sidebar.tsx AR');
}
