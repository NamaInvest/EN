const fs = require('fs');

let code = fs.readFileSync('src/app/(dashboard)/sales/page.tsx', 'utf8');

if (!code.includes('SalesReturnModal')) {
    code = code.replace(/import Link from 'next\/link';/, "import Link from 'next/link';\nimport SalesReturnModal from '@/components/pos/SalesReturnModal';");
}

if (!code.includes('showReturnModal')) {
    code = code.replace(/const \[viewInvoice, setViewInvoice\] = useState<any>\(null\);/, "const [viewInvoice, setViewInvoice] = useState<any>(null);\n    const [showReturnModal, setShowReturnModal] = useState(false);");
}

code = code.replace(/<Link href="\/sales-returns"([^>]+)>([\s\S]*?)<\/Link>/, 
    '<button onClick={() => setShowReturnModal(true)} $1>$2</button>');

if (!code.includes('<SalesReturnModal')) {
    code = code.replace(/(<\/[a-z]+>\s*\)\s*;\s*\}\s*)$/m, "            {showReturnModal && <SalesReturnModal onClose={() => setShowReturnModal(false)} />}\n        $1");
}

fs.writeFileSync('src/app/(dashboard)/sales/page.tsx', code);
console.log('Patched Sales page returns.');
