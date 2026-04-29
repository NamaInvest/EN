const fs = require('fs');
const { execSync } = require('child_process');

try {
    console.log('Restoring both files to git state to clear previous edits...');
    try { execSync('git checkout src/app/restaurant-pos/page.tsx'); } catch(e){}
    try { execSync('git checkout src/app/pos/page.tsx'); } catch(e){}

    // 1. FIX RESTAURANT POS
    let rpos = fs.readFileSync('src/app/restaurant-pos/page.tsx', 'utf8');
    rpos = rpos.replace(/\r\n/g, '\n'); // Normalize
    rpos = rpos.replace(/className=\{\`category-btn \\?\$\{activeCategory === cat.id \? 'active' : ''\}\`\}/g, 
                        'className={`category-btn ${activeCategory === cat.id ? \'active\' : \'\'}`}');

    if (!rpos.includes('setIsMounted(true)')) {
        rpos = rpos.replace('    return (\n        <div className="restaurant-pos" dir="rtl">\n            <style jsx>{`', 
            '    const [isMounted, setIsMounted] = React.useState(false);\n    React.useEffect(() => { setIsMounted(true); }, []);\n\n    return (\n        <div className="restaurant-pos" dir="rtl">\n            <style jsx>{`');
        
        rpos = rpos.replace('            `}</style>\n\n            {/* LEFT CATEGORIES */}',
            '            `}</style>\n\n            {!isMounted ? (\n                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>{t("sys.str_168")}...</div>\n            ) : (<>\n            {/* LEFT CATEGORIES */}');
            
        // Use a generic catch for the end of the file instead of exact matching
        rpos = rpos.replace(/\s*<\/div>\n    \);\n\}/, '\n            </>\n            )}\n        </div>\n    );\n}');
    }
    fs.writeFileSync('src/app/restaurant-pos/page.tsx', rpos);


    // 2. FIX POS PAGE
    let posfile = fs.readFileSync('src/app/pos/page.tsx', 'utf8');
    posfile = posfile.replace(/\r\n/g, '\n'); // Normalize
    if (!posfile.includes('setIsMounted(true)')) {
        let isRtlCheck = posfile.match(/dir=\{isRTL \? 'rtl' : 'ltr'\}/);
        if (isRtlCheck) {
            posfile = posfile.replace('    return (\n        <div className="pos-container" dir={isRTL ? \'rtl\' : \'ltr\'}>\n            <style jsx>{`', 
                '    const [isMounted, setIsMounted] = React.useState(false);\n    React.useEffect(() => { setIsMounted(true); }, []);\n\n    return (\n        <div className="pos-container" dir={isRTL ? \'rtl\' : \'ltr\'}>\n            <style jsx>{`');
            
            posfile = posfile.replace('            `}</style>\n\n            {/* Category Sidebar Pane */}',
                '            `}</style>\n\n            {!isMounted ? (\n                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>{t("sys.str_168")}...</div>\n            ) : (<>\n            {/* Category Sidebar Pane */}');
                
            posfile = posfile.replace(/\s*<\/div>\n    \);\n\}/, '\n            </>\n            )}\n        </div>\n    );\n}');
        }
    }
    fs.writeFileSync('src/app/pos/page.tsx', posfile);

    console.log('✅ Final Style Fix applied. The missing tags were correctly added!');
} catch (e) {
    console.error('Error applying fix:', e);
}
