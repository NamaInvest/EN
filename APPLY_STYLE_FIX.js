const fs = require('fs');

try {
    let rpos = fs.readFileSync('src/app/restaurant-pos/page.tsx', 'utf8');

    // Remove the early return
    rpos = rpos.replace(/if \(\!isMounted\) return <div[^>]+>\{t\('sys.str_168'\)\}\.\.\.<\/div>;\r?\n\r?\n?/, '');

    // Change the main wrapper to fragment
    rpos = rpos.replace(/return \(\s+<div className="restaurant-pos" dir="rtl">/, 'return (\n        <>\n            ');

    // Add wrapper around the style
    rpos = rpos.replace(/`\}\<\/style>\r?\n\r?\n?\s+\{\/\* LEFT CATEGORIES \*\/\}/, 
        '`}</style>\n\n            {!isMounted ? (\n                <div style={{ height: \'100vh\', display: \'flex\', alignItems: \'center\', justifyContent: \'center\', background: \'#f8f9fa\', color: \'#333\' }}>{t(\'sys.str_168\')}...</div>\n            ) : (\n            <div className="restaurant-pos" dir="rtl">\n\n            {/* LEFT CATEGORIES */}');

    // Close the fragment
    rpos = rpos.replace(/\} \/\* end return \*\//.test(rpos) ? '' : /<\/div>\r?\n\s+\);\r?\n\}/, '    </div>\n            )}\n        </>\n    );\n}');

    fs.writeFileSync('src/app/restaurant-pos/page.tsx', rpos);
    console.log('✅ Fix applied to restaurant-pos successfully!');
} catch (e) {
    console.error('Error applying to restaurant-pos:', e);
}
