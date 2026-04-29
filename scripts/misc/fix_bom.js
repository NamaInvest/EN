const fs = require('fs');
const path = require('path');

const files = [
  'src/app/(dashboard)/barcode/page.tsx',
  'src/app/(dashboard)/price-quotes/page.tsx',
  'src/app/(dashboard)/warehouses/options/page.tsx',
  'src/app/page.tsx',
  'src/app/_module-filter.tsx',
  'src/components/ThemeSwitcher.tsx',
  'src/components/Toast.tsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.startsWith("?")) {
    content = content.substring(1);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ?: ${file}`);
  } else {
    console.log(`⏭️  Already clean: ${file}`);
  }
});
