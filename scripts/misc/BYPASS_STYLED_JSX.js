const fs = require('fs');

try {
    console.log('Applying native inline styling to bypass styled-jsx App Router bugs...');

    // 1. FIX RESTAURANT POS
    let rpos = fs.readFileSync('src/app/restaurant-pos/page.tsx', 'utf8');
    rpos = rpos.replace(/<style jsx>\{`/g, '<style dangerouslySetInnerHTML={{ __html: `');
    rpos = rpos.replace(/`\}\<\/style>/g, '` }} />');
    fs.writeFileSync('src/app/restaurant-pos/page.tsx', rpos);

    // 2. FIX POS PAGE
    let posfile = fs.readFileSync('src/app/pos/page.tsx', 'utf8');
    posfile = posfile.replace(/<style jsx>\{`/g, '<style dangerouslySetInnerHTML={{ __html: `');
    posfile = posfile.replace(/`\}\<\/style>/g, '` }} />');
    fs.writeFileSync('src/app/pos/page.tsx', posfile);

    console.log('✅ Final UI Rendering Fix applied perfectly! The pages now use robust native CSS injection.');
} catch (e) {
    console.error('Error applying Native Styling fix:', e);
}
