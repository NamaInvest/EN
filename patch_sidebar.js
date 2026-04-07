const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// Fix 1: Add setLang to destructured values
code = code.replace(
    `    const { t, lang } = useTranslation();`,
    `    const { t, lang, setLang } = useTranslation();`
);

// Fix 2: Add storage event listener after the useTranslation line
const insertAfter = `    const companyName = getSetting('company_name', 'NamaaSoft ERP');`;
const insertCode = `

    // Re-render when lang changes (cross-tab or same-tab via storage event)
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'app_lang' && e.newValue) {
                setLang(e.newValue as any);
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [setLang]);`;

code = code.replace(insertAfter, insertAfter + insertCode);

fs.writeFileSync('src/components/Sidebar.tsx', code, 'utf8');
console.log('Sidebar patched with storage listener and setLang!');
