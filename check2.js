const fs = require('fs');
const c = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
// Find the section header render
const idx = c.indexOf("fontSize: '12px'");
console.log('12px at:', idx);
console.log(c.substring(idx-50, idx+200));
