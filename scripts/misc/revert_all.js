const cp = require('child_process');
const files = [
    'src/app/pos/page.tsx',
    'src/app/restaurant-pos/page.tsx',
    'src/app/(dashboard)/sales/page.tsx',
    'src/components/ThemeSwitcher.tsx',
    'src/app/layout.tsx',
    'src/app/(dashboard)/accounting/banks/page.tsx',
    'src/app/(dashboard)/shl/classes/page.tsx',
];

files.forEach(f => {
    try {
        cp.execSync(`git checkout HEAD -- "${f}"`, { stdio: 'inherit' });
        console.log('Reverted', f);
    } catch(e) {
        console.log('Error reverting', f, e.message);
    }
});

console.log('\nAll files reverted to last git commit.');
