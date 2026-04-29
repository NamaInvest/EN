const fs = require('fs');

let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// Strip out the bypass logic
code = code.replace(/const sidebarTranslationsEn = \{[\s\S]*?\};\n\nconst sidebarTranslationsAr = \{[\s\S]*?\};\n\nexport default function Sidebar\(\) \{/m, 'export default function Sidebar() {');
code = code.replace(/const translateSidebar = \([\s\S]*?\}?;\n/m, '');
			
code = code.replace(/translateSidebar\(group\.sectionKey\)/g, 't(group.sectionKey)');
code = code.replace(/translateSidebar\(item\.labelKey\)/g, 't(item.labelKey)');
code = code.replace(/\(lang === 'en' \? 'Dashboard' : 'الرئيسية \(Dashboard\)'\)/g, "t('sys.str_101')");

fs.writeFileSync('src/components/Sidebar.tsx', code, 'utf8');
console.log('Sidebar restored to normal translation hook');
