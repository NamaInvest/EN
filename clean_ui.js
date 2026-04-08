const fs = require('fs');

function processFile(file) {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Remove BNPL states
    content = content.replace(/\/\/ BNPL State[\s\S]*?\}, \[showBnplModal, bnplOrderId, bnplProvider, bnplUrl\]\);/g, '');

    // 2. Remove BNPL from handleCheckout
    content = content.replace(/bnplOrderId: \(paymentMethod === 'TABBY' \|\| paymentMethod === 'TAMARA'\) \? bnplOrderId : null,/g, '');
    
    // In case it wasn't captured, clean showBnplModal(false)
    content = content.replace(/setShowBnplModal\(false\);/g, '');

    // 3. Remove BNPL handleCreateBnplSession function (if any exists in restaurant-pos)
    content = content.replace(/const handleCreateBnplSession \= async \(\) => \{[\s\S]*?setBnplLoading\(false\);\s*\};\s*};\s*/g, '');

    // 4. Remove Numpad Tabby and Tamara buttons in restaurant-pos
    content = content.replace(/<button className="pay-btn-big" disabled=\{cart\.length === 0 \|\| isProcessing\} onClick=\{[\s\S]*?Tabby.*?<\/button>/g, '');
    content = content.replace(/<button className="pay-btn-big" disabled=\{cart\.length === 0 \|\| isProcessing\} onClick=\{[\s\S]*?Tamara.*?<\/button>/g, '');

    // 5. Remove BNPL QR Scanner Modal (if any exists)
    content = content.replace(/\{\/\* BNPL QR Scanner Modal \*\/\}[\s\S]*?\{showBnplModal && \([\s\S]*?\}\)\}\s*(?=\{\/\* Held Orders Modal \*\/\}|\{\/\* Customer Selection Modal \*\/\}|{)/g, '');

    // 6. Fix "تفريغ" confirm text mapping from bad sys.str_4044 to hardcoded Arabic
    content = content.replace(/confirm\(t\('sys\.str_4044'\)\)/g, "confirm('هل أنت متأكد من مسح جميع المنتجات من السلة؟')");
    content = content.replace(/\{t\('sys\.str_4045'\)\}/g, "مسح السلة");

    // 7. Fix POS.str_13
    content = content.replace(/\{t\('pos\.str_13'\)\}/g, "مرتجعات");

    // 8. Fix Split Modal auto calculate Card value specifically for restaurant-pos
    // (pos/page.tsx was already fixed but doing it carefully for restaurant-pos)
    if (file.includes('restaurant-pos')) {
        let regexCash = /<input type="number" style=\{\{ width: '100%', padding: '0\.75rem', borderRadius: '8px', border: '1px solid #ccc' \}\} value=\{splitCash\} onChange=\{e => setSplitCash\(e.target.value\)\} \/>/;
        content = content.replace(regexCash, `<input type="number" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} value={splitCash} onChange={e => { const cashVal = Number(e.target.value); setSplitCash(e.target.value); if (cashVal < finalTotal) { setSplitCard((finalTotal - cashVal).toFixed(2)); } else { setSplitCard('0'); } }} />`);

        let regexCard = /<input type="number" style=\{\{ width: '100%', padding: '0\.75rem', borderRadius: '8px', border: '1px solid #ccc' \}\} value=\{splitCard\} onChange=\{e => setSplitCard\(e.target.value\)\} \/>/;
        content = content.replace(regexCard, `<input type="number" disabled style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', background: '#e2e8f0', color: '#64748b' }} value={splitCard} />`);

        content = content.replace(/opacity: \(\(\(Number\(splitCash\)\|\|0\) \+ \(Number\(splitCard\)\|\|0\)\) < finalTotal\) \? 0\.5 : 1/g, `opacity: (((Number(splitCash)||0) + (Number(splitCard)||0)) < (finalTotal - 0.01)) ? 0.5 : 1`);
        
        let confirmBtnCheck = /disabled=\{((Number(splitCash)\|\|0) \+ (Number(splitCard)\|\|0)) < finalTotal \|\| isProcessing\}/g;
        content = content.replace(/disabled=\{\(\(Number\(splitCash\)\|\|0\) \+ \(Number\(splitCard\)\|\|0\)\) < finalTotal \|\| isProcessing\}/g, `disabled={((Number(splitCash)||0) + (Number(splitCard)||0)) < (finalTotal - 0.01) || isProcessing}`);
    } else {
        // POS is already fixed, but we restore pos dark style to search-bars in split modal which I might have overridden in my template just to be safe
        content = content.replace(/style=\{\{ width: '100%', padding: '0\.75rem', borderRadius: '8px', border: '1px solid #ccc', background: '#fff', color: '#333' \}\}/g, `style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: 'white' }}`);
    }

    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
}

processFile('src/app/pos/page.tsx');
processFile('src/app/restaurant-pos/page.tsx');
