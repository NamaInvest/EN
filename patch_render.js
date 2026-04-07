const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// Fix 1: Replace useTranslation import and usage with direct localStorage read
// Remove the i18n import
code = code.replace("import { useTranslation } from '@/lib/i18n';\n", '');
code = code.replace("import { useTranslation } from '@/lib/i18n';\r\n", '');

// Fix 2: Replace the useTranslation hook call in Sidebar function
// The function body currently has: const { t, lang } = useTranslation();
code = code.replace(
    /const \{ t, lang(?:, setLang)? \} = useTranslation\(\);/,
    `const [lang, setLangLocal] = useState<Lang>('ar');

    // Read lang from localStorage after mount (client-only, avoids SSR mismatch)
    useEffect(() => {
        const saved = (localStorage.getItem('app_lang') || 'ar') as Lang;
        setLangLocal(saved);
        const handler = (e: StorageEvent) => {
            if (e.key === 'app_lang' && e.newValue) setLangLocal(e.newValue as Lang);
        };
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, []);

    // Also listen for same-tab language changes via custom event
    useEffect(() => {
        const handler = () => {
            const saved = (localStorage.getItem('app_lang') || 'ar') as Lang;
            setLangLocal(saved);
        };
        window.addEventListener('langchange', handler);
        return () => window.removeEventListener('langchange', handler);
    }, []);

    const t = (key: string) => key; // fallback - not used for sidebar labels`
);

// Fix 3: Replace sectionKey references with sk
code = code.replace(/group\.sectionKey/g, 'group.sk');
code = code.replace(/item\.labelKey/g, 'item.lk');

// Fix 4: Replace t(group.sk) with getLabel(lang, group.sk)
code = code.replace(/\{t\(group\.sk\)\}/g, '{getLabel(lang, group.sk)}');
code = code.replace(/t\(group\.sk\)/g, 'getLabel(lang, group.sk)');
code = code.replace(/\{t\(item\.lk\)\}/g, '{getLabel(lang, item.lk)}');
code = code.replace(/t\(item\.lk\)/g, 'getLabel(lang, item.lk)');

// Fix 5: Replace logout button text
code = code.replace(/{t\('sidebar\.logout'\)}/g, "{getLabel(lang, 'logout')}");
code = code.replace(/{t\('logout'\)}/g, "{getLabel(lang, 'logout')}");
code = code.replace(/t\('sidebar\.logout'\)/g, "getLabel(lang, 'logout')");

// Fix 6: Fix isDashboard comparison
code = code.replace(
    /const isDashboard = group\.sk === t\(['"]\S+['"]\);/,
    "const isDashboard = group.sk === 's.dashboard';"
);
code = code.replace(
    /const isDashboard = group\.sectionKey === t\(['"]\S+['"]\);/,
    "const isDashboard = group.sk === 's.dashboard';"
);

// Fix 7: Fix the textAlign lang check if it uses 'ar'  
// It should already reference lang directly

// Fix 8: Direction - make dir depend on lang
code = code.replace(
    /lang === 'ar' \? 'right' : 'left'/g,
    "(lang === 'ar' || lang === 'ur') ? 'right' : 'left'"
);

fs.writeFileSync('src/components/Sidebar.tsx', code, 'utf8');
console.log('Sidebar render logic patched to use getLabel and local lang state!');
