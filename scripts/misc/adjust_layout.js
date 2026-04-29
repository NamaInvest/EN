const fs = require('fs');

let content = fs.readFileSync('src/app/design1/page.tsx', 'utf8');

// Replace max-w-7xl with a wider layout container max-w-[90rem] (1440px)
content = content.replace(/max-w-7xl/g, 'max-w-[90rem]');

// Replace the number color (text-slate-100) with text-[#cbd5e1] (Slate 300) which is darker and visible against white
content = content.replace(/text-slate-100/g, 'text-[#cbd5e1]');

// Widen text containers so they aren't vertically squished
content = content.replace(/max-w-xl/g, 'max-w-3xl');
content = content.replace(/max-w-2xl/g, 'max-w-4xl');

fs.writeFileSync('src/app/design1/page.tsx', content);
console.log('Layout and numbers adjusted.');
