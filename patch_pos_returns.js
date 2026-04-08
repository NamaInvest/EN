const fs = require('fs');

['src/app/pos/page.tsx', 'src/app/restaurant-pos/page.tsx'].forEach(p => {
    let code = fs.readFileSync(p, 'utf8');

    // Add import if not exists
    if (!code.includes('SalesReturnModal')) {
        code = code.replace(/import Link from 'next\/link';/, "import Link from 'next/link';\nimport SalesReturnModal from '@/components/pos/SalesReturnModal';");
    }

    // Add states
    if (!code.includes('showReturnModal')) {
        code = code.replace(/const \[showReceipt, setShowReceipt\] = useState\(false\);/, "const [showReceipt, setShowReceipt] = useState(false);\n    const [showReturnModal, setShowReturnModal] = useState(false);\n    const [currentUser, setCurrentUser] = useState<any>(null);\n    useEffect(() => { try { const u = localStorage.getItem('user'); if (u) setCurrentUser(JSON.parse(u)); } catch(e){} }, []);");
    }

    // Display username in the panel (search for <h2 className="text-xl font-bold"> or similar)
    // Actually, let's put it right above total price
    if (!code.includes('الكاشير:')) {
        code = code.replace(/<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>\s*<span style={{ color: 'var\(--text-muted\)' }}>/, 
            "<div style={{ marginBottom: '8px', color: 'var(--primary)', fontWeight: 'bold' }}>الكاشير: {currentUser?.name || ''}</div>\n                        $&");
    }

    // Change Link to button
    code = code.replace(/<Link href="\/sales-returns"([^>]+)>([\s\S]*?)<\/Link>/, 
        '<button onClick={() => setShowReturnModal(true)} $1>$2</button>');

    // Add modal component at the end of the file before last </div>
    if (!code.includes('<SalesReturnModal')) {
        code = code.replace(/(<\/[a-z]+>\s*\)\s*;\s*\}\s*)$/m, "            {showReturnModal && <SalesReturnModal onClose={() => setShowReturnModal(false)} />}\n        $1");
    }

    fs.writeFileSync(p, code);
});
console.log('Patched POS returns and user badge.');
