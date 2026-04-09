const fs = require('fs');

try {
    console.log('Extracting CSS from POS interfaces and moving it to globals.css...');

    // Read files
    let rpos = fs.readFileSync('src/app/restaurant-pos/page.tsx', 'utf8');
    let posfile = fs.readFileSync('src/app/pos/page.tsx', 'utf8');
    let globals = fs.readFileSync('src/app/globals.css', 'utf8');

    // Regex to capture CSS content inside the dangerouslySetInnerHTML template literal
    const rposMatch = rpos.match(/<style dangerouslySetInnerHTML=\{\{ __html: `([\s\S]*?)` \}\} \/>/);
    const posMatch = posfile.match(/<style dangerouslySetInnerHTML=\{\{ __html: `([\s\S]*?)` \}\} \/>/);

    let newCss = '\n/* ================= POS & RESTAURANT POS STYLES ================= */\n';

    if (rposMatch && rposMatch[1]) {
        newCss += '\n/* Restaurant POS */\n' + rposMatch[1];
        // Remove style tag from component
        rpos = rpos.replace(/<style dangerouslySetInnerHTML=\{\{ __html: `[\s\S]*?` \}\} \/>/, '');
        fs.writeFileSync('src/app/restaurant-pos/page.tsx', rpos);
        console.log('✅ Extracted Restaurant POS styles');
    }

    if (posMatch && posMatch[1]) {
        // Ensure no naming conflicts, though they use different prefixes
        newCss += '\n/* Retail POS */\n' + posMatch[1];
        // Remove style tag from component
        posfile = posfile.replace(/<style dangerouslySetInnerHTML=\{\{ __html: `[\s\S]*?` \}\} \/>/, '');
        fs.writeFileSync('src/app/pos/page.tsx', posfile);
        console.log('✅ Extracted Retail POS styles');
    }

    // Append to globals.css
    if (!globals.includes('/* ================= POS & RESTAURANT POS STYLES ================= */')) {
        fs.writeFileSync('src/app/globals.css', globals + newCss);
        console.log('✅ Appended styles to globals.css successfully!');
    } else {
        console.log('Styles already exist in globals.css, skipping append.');
    }

} catch (e) {
    console.error('Error extracting CSS:', e);
}
