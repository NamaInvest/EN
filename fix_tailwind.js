const fs = require('fs');
const path = require('path');

const filesToFix = [
    'src/components/pos/AddCustomerModal.tsx',
    'inject_modals.js',
    'write_light_patch.js',
    'write_premium_patch.js'
];

for (const file of filesToFix) {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) continue;
    
    let content = fs.readFileSync(fullPath, 'utf8');

    // Fix arbitrary values
    content = content.replace(/z-\[9999\]/g, 'z-9999');
    content = content.replace(/z-\[200\]/g, 'z-200');
    content = content.replace(/z-\[100\]/g, 'z-100');
    content = content.replace(/rounded-\[2rem\]/g, 'rounded-4xl');
    content = content.replace(/rounded-\[1\.5rem\]/g, 'rounded-3xl');
    content = content.replace(/aspect-\[4\/3\]/g, 'aspect-4/3');

    // Fix gradients
    content = content.replace(/bg-gradient-to-br/g, 'bg-linear-to-br');
    content = content.replace(/bg-gradient-to-r/g, 'bg-linear-to-r');
    content = content.replace(/bg-gradient-to-t/g, 'bg-linear-to-t');
    content = content.replace(/bg-gradient-to-b/g, 'bg-linear-to-b');

    // Fix duplicates and conflicting classes inside classNames
    // We only want to replace within className="..." strings. This regex replaces duplicates globally though, which is mostly fine for these tailwind strings.
    const duplicateFixes = [
        ['flex flex', 'flex'],
        ['flex-col flex-col', 'flex-col'],
        ['gap-3 gap-3', 'gap-3'],
        ['items-center items-center', 'items-center'],
        ['bg-white bg-white', 'bg-white'],
        ['border-slate-200 border-slate-200', 'border-slate-200'],
        ['shadow-sm shadow-sm', 'shadow-sm'],
        ['font-black font-black', 'font-black'],
        ['font-extrabold font-bold', 'font-extrabold'],
        ['font-bold font-extrabold', 'font-extrabold'],
        ['justify-between justify-center', 'justify-between'],
        ['justify-center justify-between', 'justify-between'],
        ['text-slate-800 text-slate-400', 'text-slate-800'],
        ['text-slate-400 text-slate-800', 'text-slate-800'],
        ['text-sky-500 text-slate-800', 'text-sky-500'],
        ['text-slate-800 text-sky-500', 'text-sky-500'],
        ['text-sky-500 text-slate-400', 'text-sky-500'],
        ['text-slate-400 text-sky-500', 'text-sky-500'],
        ['text-orange-500 text-slate-800', 'text-orange-500'],
        ['text-slate-800 text-orange-500', 'text-orange-500'],
        ['border-slate-100 border-sky-100', 'border-sky-100'],
        ['border-sky-100 border-slate-100', 'border-sky-100'],
        ['h-2 h-5', 'h-5'],
        ['h-5 h-2', 'h-5']
    ];

    for (const [bad, good] of duplicateFixes) {
        // Run multiple times to catch overlapping instances like "flex flex flex"
        let prev = '';
        while (content !== prev) {
            prev = content;
            content = content.split(bad).join(good);
        }
    }

    fs.writeFileSync(fullPath, content);
}
console.log('Fixed Tailwind warnings');
