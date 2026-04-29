const fs = require('fs');

let content = fs.readFileSync('src/app/design1/page.tsx', 'utf8');

// Color mapping to exact hex values to bypass globals.css conflicts
const mapping = {
  'bg-primary-light': 'bg-[#10b981]',
  'text-primary-light': 'text-[#10b981]',
  'border-primary-light': 'border-[#10b981]',
  'shadow-primary-light': 'shadow-[#10b981]',
  'from-primary-light': 'from-[#10b981]',
  'to-primary-light': 'to-[#10b981]',

  'bg-primary-medium': 'bg-[#064e3b]',
  'text-primary-medium': 'text-[#064e3b]',
  'border-primary-medium': 'border-[#064e3b]',
  'shadow-primary-medium': 'shadow-[#064e3b]',
  'from-primary-medium': 'from-[#064e3b]',
  'via-primary-medium': 'via-[#064e3b]',
  'to-primary-medium': 'to-[#064e3b]',

  'bg-primary': 'bg-[#053d2f]',
  'text-primary': 'text-[#053d2f]',
  'border-primary': 'border-[#053d2f]',
  'shadow-primary': 'shadow-[#053d2f]',
  'from-primary': 'from-[#053d2f]',
  'to-primary': 'to-[#053d2f]',

  'bg-surface-variant': 'bg-[#fcfdfe]',
  'text-surface-variant': 'text-[#fcfdfe]',
  
  'bg-surface': 'bg-[#ffffff]',
  'text-surface': 'text-[#ffffff]',

  'text-on-surface-variant': 'text-[#64748b]',
  'text-on-surface': 'text-[#0f172a]',

  'bg-accent': 'bg-[#f59e0b]',
  'text-accent': 'text-[#f59e0b]'
};

// Replace class names (with boundary checks)
for (const [key, value] of Object.entries(mapping)) {
  // Use regex to match exact class names (e.g. not matching text-primary inside text-primary-light)
  // We handle hover:, focus:, etc.
  const regex = new RegExp(`(?<=[\\s"'\\\`:]|^)(${key})(?=[\\s"'\\\`/]|$)`, 'g');
  content = content.replace(regex, value);
}

// Special cases: shadow-primary/10 -> shadow-[#053d2f]/10
content = content.replace(/shadow-primary\/(\d+)/g, 'shadow-[#053d2f]/$1');
content = content.replace(/bg-primary\/(\d+)/g, 'bg-[#053d2f]/$1');
content = content.replace(/border-primary\/(\d+)/g, 'border-[#053d2f]/$1');

// Navbar Text Replacements
content = content.replace(/>الحلول الذكية</g, '>القطاعات<');
content = content.replace(/>المجموعات البرمجية</g, '>المجموعات<');
content = content.replace(/>التميز المالي</g, '>الـ 104 وحدة<');
content = content.replace(/>الموارد</g, '>التسعير<');

// Navbar Buttons
content = content.replace(/>دخول المستثمرين</g, '>تسجيل الدخول<');
content = content.replace(/>ابدأ الآن</g, '>🚀 سجّل مجاناً<');

// Hero Section Texts
content = content.replace(/>تجربة النظام مجاناً</g, '>ابدأ الفترة التجريبية<');
content = content.replace(/>تحميل البروفايل</g, '>حجز عرض تجريبي<');

// Inject the Trust section (optional, maybe not here, but we fixed the main texts)
fs.writeFileSync('src/app/design1/page.tsx', content);

console.log("Fixed design1 colors and text!");
