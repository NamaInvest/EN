const fs = require('fs');
let c = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// Fix the actual renders - the section title and item label
c = c.replace('{group.sk}', '{getLabel(lang, group.sk)}');
c = c.replace('{item.lk}', '{getLabel(lang, item.lk)}');

// Also fix item key to use href instead of lk (which may not exist in key prop)
// No, the key={item.href} should be fine already

fs.writeFileSync('src/components/Sidebar.tsx', c, 'utf8');
console.log('Fixed group.sk and item.lk render!');

// Verify
const c2 = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
console.log('getLabel section:', c2.includes('getLabel(lang, group.sk)'));
console.log('getLabel item:', c2.includes('getLabel(lang, item.lk)'));
