const fs = require('fs');

try {
    let rpos = fs.readFileSync('src/app/restaurant-pos/page.tsx', 'utf8');

    // 1. Remove the fragment we artificially added
    rpos = rpos.replace(/return \(\s+<>\s+<style jsx>\{`/g, 'return (\n        <div className="restaurant-pos" dir="rtl">\n            <style jsx>{`');

    // 2. Remove the first isMounted check we added
    rpos = rpos.replace(/`\}\<\/style>\s+\{\!isMounted \? \(\s+<div[^>]+>\{t\('sys.str_168'\)\}\.\.\.<\/div>\s+\) : \(\s+<div className="restaurant-pos" dir="rtl">/g, 
                        '`}</style>\n\n            {!isMounted ? (\n                <div style={{ flex: 1, display: \'flex\', alignItems: \'center\', justifyContent: \'center\' }}>{t(\'sys.str_168\')}...</div>\n            ) : (\n            <>\n');

    // 3. Fix the closing brackets
    rpos = rpos.replace(/<\/div>\s+\)\}\s+<\/>/g, '            </>\n            )}\n        </div>');

    fs.writeFileSync('src/app/restaurant-pos/page.tsx', rpos);
    console.log('✅ Fix applied to restaurant-pos successfully!');
} catch (e) {
    console.error('Error applying to restaurant-pos:', e);
}
