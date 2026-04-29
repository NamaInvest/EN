const fs = require('fs');

function processPage(filepath, searchRegex, btnReplacement) {
    if (!fs.existsSync(filepath)) {
        console.log('File not found:', filepath);
        return;
    }
    
    let c = fs.readFileSync(filepath, 'utf8');
    
    // Add import if not present
    if (!c.includes('PosReturnsModal')) {
        c = c.replace(/import \{ useState[^\}]+\} from 'react';/, "$&\nimport PosReturnsModal from '@/components/PosReturnsModal';");
        // Fallback for differently formatted imports
        if (!c.includes('PosReturnsModal')) {
            c = c.replace(/import React, \{ useState[^\}]+\} from 'react';/, "$&\nimport PosReturnsModal from '@/components/PosReturnsModal';");
        }
    }
    
    // Add state if not present
    if (!c.includes('showReturnsModal')) {
        let stateInsert = "    const [showReturnsModal, setShowReturnsModal] = useState(false);\n";
        // insert after setCart 
        c = c.replace(/const \[cart, setCart\] = useState<any\[\]>\(\[\]\);/, "$&\n" + stateInsert);
        // Fallback for simple cart state (pos/page.tsx)
        if (!c.includes('showReturnsModal')) {
             c = c.replace(/const \[cart, setCart\] = useState\(\[\]\);/, "$&\n" + stateInsert);
        }
    }

    // Replace the Link with a Button
    if (c.match(searchRegex)) {
        c = c.replace(searchRegex, btnReplacement);
    }

    // Insert the modal into the return section if not present
    if (!c.includes('<PosReturnsModal')) {
        let modalHtml = "\n            <PosReturnsModal isOpen={showReturnsModal} onClose={() => setShowReturnsModal(false)} />\n";
        // insert right after <> or <div className="page-content...
        c = c.replace(/return \(/, "return (\n        <>" + modalHtml);
    }
    
    fs.writeFileSync(filepath, c, 'utf8');
    console.log('Updated returns modal in', filepath);
}

// 1. pos/page.tsx
let posRegex = /<Link\s+href="\/sales-returns"[^>]+>[\s\S]*?مرتجعات<\/Link>/;
let posRep = `<button onClick={() => setShowReturnsModal(true)} className="btn-back" style={{ color: '#ef4444', textDecoration: 'none', border: 'none', background: 'transparent' }}>\n                              ↩ مرتجعات\n                        </button>`;
processPage('src/app/pos/page.tsx', posRegex, posRep);

// 2. restaurant-pos/page.tsx
let restRegex = /<Link\s+href="\/sales-returns"[^>]+>[\s\S]*?مرتجع<\/Link>/;
let restRep = `<button onClick={() => setShowReturnsModal(true)} style={{ background: 'transparent', color: '#ef4444', border: '1px solid #fca5a5', padding: '0.4rem 0.8rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 600 }}>\n                            <History size={18} />\n                            مرتجع\n                        </button>`;
processPage('src/app/restaurant-pos/page.tsx', restRegex, restRep);

// 3. (dashboard)/sales/page.tsx
let salesRegex = /<Link\s+href="\/sales-returns"[^>]+>[\s\S]*?مرتجعات\s*<\/Link>/;
let salesRep = `<button onClick={() => setShowReturnsModal(true)} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', fontSize: '12px', background: 'transparent', border: 'none' }}>\n                        ↩ {'مرتجعات'}\n                    </button>`;
processPage('src/app/(dashboard)/sales/page.tsx', salesRegex, salesRep);

