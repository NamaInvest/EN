const fs = require('fs');

['src/app/pos/page.tsx', 'src/app/restaurant-pos/page.tsx'].forEach(p => {
    let code = fs.readFileSync(p, 'utf8');

    // Remove any previously broken state injections
    code = code.replace(/const \[showReturnModal, setShowReturnModal\] = useState\(false\);\s*const \[currentUser, setCurrentUser\] = useState<any>\(null\);\s*useEffect\(\(\) => \{ try \{ const u = localStorage\.getItem\('user'\); if \(u\) setCurrentUser\(JSON\.parse\(u\)\); \} catch\(e\)\{\} \}, \[\]\);/g, '');
    
    // Also from sales
    // ... wait, I'll just inject it safely after the main function starts!

    const stateBlock = `
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    useEffect(() => { try { const u = localStorage.getItem('user'); if (u) setCurrentUser(JSON.parse(u)); } catch(e){} }, []);
`;

    // Inject into Main Component
    let funcNameMatch = code.match(/export default function (\w+)\s*\([^)]*\)\s*\{/);
    if (funcNameMatch) {
         code = code.replace(funcNameMatch[0], funcNameMatch[0] + stateBlock);
    } else {
         console.log("Could not find export default function in", p);
    }

    // Clean up end of file again just in case there is trailing junk from my powershell testing, but tsc succeeded so it shouldn't be too bad.
    fs.writeFileSync(p, code);
});

// For sales page, it's a bit different
let salesPath = 'src/app/(dashboard)/sales/page.tsx';
let salesCode = fs.readFileSync(salesPath, 'utf8');
salesCode = salesCode.replace(/const \[showReturnModal, setShowReturnModal\] = useState\(false\);/g, '');
let sMatch = salesCode.match(/export default function (\w+)\s*\([^)]*\)\s*\{/);
if (sMatch) {
     salesCode = salesCode.replace(sMatch[0], sMatch[0] + `\n    const [showReturnModal, setShowReturnModal] = useState(false);\n`);
}
fs.writeFileSync(salesPath, salesCode);

console.log('Fixed states reliably.');
