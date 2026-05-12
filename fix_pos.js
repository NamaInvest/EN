const fs = require('fs');
let content = fs.readFileSync('src/app/(dashboard)/pos/page.tsx', 'utf8');

// Fix tailwind classes
content = content.replace(/rounded-\[2rem\]/g, 'rounded-4xl');
content = content.replace(/aspect-\[4\/3\]/g, 'aspect-4/3');
content = content.replace(/rounded-\[1\.5rem\]/g, 'rounded-3xl');
content = content.replace(/z-\[100\]/g, 'z-100');

// Fix broken button
content = content.replace(
  /<button onClick=\{\(\) => \{ alert\('تفعيل إضافة عميل جديد'\); \}\} className="w-full py-5 bg-orange-50/g,
  '<button onClick={() => setShowCustomerModal(true)} className="w-full py-5 bg-orange-50'
);

fs.writeFileSync('src/app/(dashboard)/pos/page.tsx', content);

// Do the same for restaurant-pos
let restContent = fs.readFileSync('src/app/(dashboard)/restaurant-pos/page.tsx', 'utf8');
restContent = restContent.replace(/rounded-\[2rem\]/g, 'rounded-4xl');
restContent = restContent.replace(/aspect-\[4\/3\]/g, 'aspect-4/3');
restContent = restContent.replace(/rounded-\[1\.5rem\]/g, 'rounded-3xl');
restContent = restContent.replace(/z-\[100\]/g, 'z-100');

restContent = restContent.replace(
  /<button onClick=\{\(\) => \{ alert\('تفعيل إضافة عميل جديد'\); \}\} className="w-full py-5 bg-orange-50/g,
  '<button onClick={() => setShowCustomerModal(true)} className="w-full py-5 bg-orange-50'
);

fs.writeFileSync('src/app/(dashboard)/restaurant-pos/page.tsx', restContent);
