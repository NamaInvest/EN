const fs = require('fs');

let files = ['src/app/pos/page.tsx', 'src/app/restaurant-pos/page.tsx', 'src/app/(dashboard)/sales/page.tsx'];
files.forEach(f => {
    let c = fs.readFileSync(f, 'utf8');
    
    // First remove the bad injection
    c = c.replace(/return \(\n        <>\n            <PosReturnsModal isOpen=\{showReturnsModal\} onClose=\{[^\}]+\} \/>\n/g, 'return (\n');
    
    // Now insert it AFTER the first <> or <div inside the return statement correctly
    if (!c.includes('<PosReturnsModal')) {
        let modalHtml = "\n            <PosReturnsModal isOpen={showReturnsModal} onClose={() => setShowReturnsModal(false)} />\n";
        
        if (c.includes('return (\n        <div')) {
            c = c.replace(/return \(\n        <div/, "return (\n        <>{" + modalHtml + "}\n        <div");
            // make sure to close this new <> at the very end
            c = c.replace(/\n    \);\n\}/, "\n        </>\n    );\n}");
        } else if (c.includes('return (\n        <>')) {
            c = c.replace(/return \(\n        <>/, "return (\n        <>" + modalHtml);
        } else if (c.includes('return (\n        <main')) {
            c = c.replace(/return \(\n        <main/, "return (\n        <>" + modalHtml + "\n        <main");
            c = c.replace(/\n    \);\n\}/, "\n        </>\n    );\n}");
        } else {
             c = c.replace(/return \(/, "return (\n        <>" + modalHtml);
        }
    }
    
    fs.writeFileSync(f, c, 'utf8');
    console.log('Fixed syntax in', f);
});
