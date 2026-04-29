const fs = require('fs');
let c = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// Remove the storage listener that uses setLang(e.newValue as any) - 
// because setLang is the external context function that may not exist
// Replace with setLangLocal instead
c = c.replace(
    'setLang(e.newValue as any);',
    'setLangLocal(e.newValue as Lang);'
);

// Fix the dependency array [setLang] -> []
c = c.replace('}, [setLang]);', '}, []);');

// Remove the broken setLang from destructuring - find the line
c = c.replace(
    /const \{ t, lang(?:, setLang)? \} = useTranslation\(\);/,
    '// lang now managed locally - no useTranslation for sidebar labels'
);

// Remove any remaining setLang references (just in case)
c = c.replace(/\bsetLang\b(?!Local)/g, 'setLangLocal');

fs.writeFileSync('src/components/Sidebar.tsx', c, 'utf8');

// Verify
const c2 = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
const remaining = [...c2.matchAll(/\bsetLang\b(?!Local)/g)];
console.log('Remaining bad setLang references:', remaining.length);
console.log('setLangLocal count:', (c2.match(/setLangLocal/g)||[]).length);
