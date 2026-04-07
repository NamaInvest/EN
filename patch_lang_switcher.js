const fs = require('fs');
let code = fs.readFileSync('src/components/LanguageSwitcher.tsx', 'utf8');

// Inject langchange dispatch after setLang is called
code = code.replace(
    /const \{ lang, setLang \} = useTranslation\(\);/,
    `const { lang, setLang } = useTranslation();
    
    const handleSetLang = (code: any) => {
        setLang(code);
        // Dispatch custom event so Sidebar can react without relying on Context
        window.dispatchEvent(new Event('langchange'));
    };`
);

// Replace all onClick calls to setLang to use handleSetLang
code = code.replace(/onClick=\{[^}]*setLang\([^)]+\)[^}]*\}/g, (m) => {
    // Extract the language code from the original onClick
    const match = m.match(/setLang\(([^)]+)\)/);
    if (match) {
        return `onClick={() => handleSetLang(${match[1]})}`;
    }
    return m;
});

fs.writeFileSync('src/components/LanguageSwitcher.tsx', code, 'utf8');
console.log('LanguageSwitcher patched to dispatch langchange event!');
