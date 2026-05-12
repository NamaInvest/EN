const fs = require('fs');
const code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

let links = 0;
let mainCategories = 0;

const menuRegex = /\{[^}]*title:[^}]*\}/g;
const items = code.match(menuRegex) || [];

for (const item of items) {
    if (item.includes('href:') || item.includes('subItems:')) {
        mainCategories++;
    }
}

const hrefs = code.match(/href:\s*['"`]/g) || [];
links = hrefs.length;

console.log(`Total Main Categories/Sections: ${items.length}`);
console.log(`Total Sub-categories (Links): ${links}`);
