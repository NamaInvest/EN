const fs = require('fs');

['src/app/pos/page.tsx', 'src/app/restaurant-pos/page.tsx', 'src/app/(dashboard)/sales/page.tsx'].forEach(p => {
    let code = fs.readFileSync(p, 'utf8');

    // 1. Fix corrupted end of file!
    // My previous script did: code.replace(/(<\/[a-z]+>\s*\)\s*;\s*\}\s*)$/m, " {showReturnModal ...} $1")
    // Let's rip out ANY multiple } or corrupted tags at the end of the file and replace it with a clean close.
    // The previous script added {showReturnModal...} somewhere near the end. Let's just remove that string first.
    code = code.replace(/\{showReturnModal && <SalesReturnModal onClose=\{\(\) => setShowReturnModal\(false\)\} \/>\}/g, '');
    
    // Clean trailing junk which might be broken JSX tags from the regex bug
    code = code.replace(/(<\/[A-Za-z0-9]+>\s*\)\s*;\s*\})([\s\S]*?)(\{\s*\}\s*.*)/g, '$1\n');
    code = code.replace(/(\n        <\/div>\s*\n\s*\);\s*\n\})[\s\S]*$/, '$1\n'); // Force end cleanly
    
    // Now safely inject SalesReturnModal BEFORE the last </div>
    const lastDiv = code.lastIndexOf('</div>');
    if (lastDiv !== -1) {
        code = code.substring(0, lastDiv) + '\n            {showReturnModal && <SalesReturnModal onClose={() => setShowReturnModal(false)} />}\n        ' + code.substring(lastDiv);
    }

    // 2. Define the states natively!
    // Find where the states are defined. We can look for `const { t } = useTranslation();`
    const stateText = `
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    useEffect(() => { try { const u = localStorage.getItem('user'); if (u) setCurrentUser(JSON.parse(u)); } catch(e){} }, []);
    `;
    
    // Check if we already injected them somewhere broken
    code = code.replace(/const \[showReturnModal, setShowReturnModal\] = useState\(false\);/g, '');
    code = code.replace(/const \[currentUser, setCurrentUser\] = useState<any>\(null\);/g, '');
    code = code.replace(/useEffect\(\(\) => \{ try \{ const u = localStorage\.getItem\('user'\); if \(u\) setCurrentUser\(JSON\.parse\(u\)\); \} catch\(e\)\{\} \}, \[\]\);/g, '');
    
    // We can inject them right after `const { t } = useTranslation();`
    code = code.replace(/const \{\s*t\s*\} = useTranslation\(\);/, `const { t } = useTranslation();\n${stateText}`);

    fs.writeFileSync(p, code);
});
console.log('Repaired state variables and EOF');
