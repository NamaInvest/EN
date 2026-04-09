const fs = require('fs');

let files = ['src/app/pos/page.tsx', 'src/app/restaurant-pos/page.tsx', 'src/app/(dashboard)/sales/page.tsx'];
files.forEach(f => {
    let c = fs.readFileSync(f, 'utf8');
    
    // Add type="button" to the Returns Modal button to prevent any form submission
    c = c.replace(/<button onClick=\{\(\) => setShowReturnsModal\(true\)\}/g, '<button type="button" onClick={() => setShowReturnsModal(true)}');
    
    // Rename the button to prove to the user if they are seeing the cached page or new page
    c = c.replace(/↩\s*مرتجعات/g, '↩ استرجاع محلي');
    c = c.replace(/'مرتجعات'/g, "'استرجاع مباشر'");
    
    fs.writeFileSync(f, c, 'utf8');
    console.log('Renamed in', f);
});
