const fs = require('fs');

let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// We need to prevent Server-Side Rendering of the Sidebar entirely
// By doing this, we guarantee that ZERO cached server UI is sent to the browser
if (!code.includes('const [mounted, setMounted] = useState(false);')) {
    // Add mounted state
    code = code.replace(
        /const \[lang, setLangLocal\] = useState<Lang>\('ar'\);/,
        `const [lang, setLangLocal] = useState<Lang>('ar');\n  const [mounted, setMounted] = useState(false);`
    );
    
    // Add setMounted to the end of the existing useEffect that handles storage
    code = code.replace(
        /window\.addEventListener\('storage', onStorage\);\n    return \(\) => \{/g,
        `window.addEventListener('storage', onStorage);\n    setMounted(true);\n    return () => {`
    );
    
    // Skip rendering if not mounted
    code = code.replace(
        /return \(\n    <>\n      <button/g,
        `if (!mounted) return <aside className="sidebar" style={{ width: '250px' }}></aside>;\n\n  return (\n    <>\n      <button`
    );
    
    fs.writeFileSync('src/components/Sidebar.tsx', code, 'utf8');
    console.log('Sidebar.tsx updated for strictly Client-Side Registration!');
} else {
    console.log('Sidebar.tsx already has mounted check!');
}
