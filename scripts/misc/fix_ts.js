const fs = require('fs');

function fixJSX(file) {
    let code = fs.readFileSync(file, 'utf8');
    // Remove inline `: any` and `:any` from map arrow functions in JSX
    code = code.replace(/map\(\(order:\s*any\)\s*=>/g, 'map((order) =>');
    code = code.replace(/map\(\(i:\s*any\)\s*=>/g, 'map((i) =>');
    code = code.replace(/map\(\(d:\s*any\)\s*=>/g, 'map((d) =>');
    fs.writeFileSync(file, code);
}

fixJSX('src/app/restaurant-pos/page.tsx');
fixJSX('src/app/pos/page.tsx');
console.log('Fixed inline TS in JSX');
