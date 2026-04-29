const fs = require('fs');
const iconv = require('iconv-lite');
const path = require('path');

const corruptedFiles = [
  'src/app/(dashboard)/barcode/page.tsx',
  'src/app/(dashboard)/price-quotes/page.tsx',
  'src/app/(dashboard)/warehouses/options/page.tsx',
  'src/app/page.tsx',
  'src/app/_module-filter.tsx',
  'src/components/ThemeSwitcher.tsx',
  'src/components/Toast.tsx'
];

corruptedFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  // Read the corrupted UTF-8 string
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if it's actually corrupted (contains 'ط§ظ„' or similar)
  if (content.includes('\u0638\u02C6\u0637') || content.includes('\u0637\u0627\u0638\u201e') || content.includes('ط§ظ„')) {
    // Reverse the double-encoding
    const originalBytes = iconv.encode(content, 'cp1256');
    const restoredContent = iconv.decode(originalBytes, 'utf8');
    
    // Write it back as proper UTF-8
    fs.writeFileSync(filePath, restoredContent, 'utf8');
    console.log(`✅ Fixed: ${file}`);
  } else {
    console.log(`⏭️  Already clean: ${file}`);
  }
});
