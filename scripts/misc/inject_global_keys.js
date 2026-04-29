const fs = require('fs');
const newKeys = require('./new_global_keys.json');

try {
    let source = fs.readFileSync('src/lib/translations.ts', 'utf8');
    
    // Convert newKeys object {"sys.str_X": "Arabic Text"} into string lines:
    // 'sys.str_X': 'Arabic Text',
    const newLines = [];
    for(let k in newKeys) {
        // escape single quotes in Arabic texts
        const safeVal = newKeys[k].replace(/'/g, "\\'");
        newLines.push(`    '${k}': '${safeVal}'`);
    }
    const injectedBlock = newLines.join(',\\n') + (newLines.length > 0 ? ',' : '');

    // Now insert this block into EACH language array inside translations.ts!
    // Since we don't have English translations yet, we fallback to the Arabic string.
    
    // We regex replace the closing brace of each language block
    const langs = ['ar', 'en', 'hi', 'bn', 'ur'];
    
    for(let lang of langs) {
        // find `lang: {`
        const langMarker = new RegExp(`${lang}:\\s*\\{[\\s\\S]*?\\}(?=,|\\n\\n|\\n};)`, 'g');
        const match = source.match(langMarker);
        if(match) {
            let block = match[0];
            // insert right before the closing brace of this block
            let lastBraceIdx = block.lastIndexOf('}');
            if(lastBraceIdx !== -1) {
                // Ensure the preceding line has a comma
                let beforeBrace = block.substring(0, lastBraceIdx).trimEnd();
                if(!beforeBrace.endsWith(',')) beforeBrace += ',';
                
                let newBlock = beforeBrace + '\\n' + injectedBlock + '\\n' + '  }';
                source = source.replace(block, newBlock);
            }
        }
    }
    
    fs.writeFileSync('src/lib/translations.ts', source, 'utf8');
    console.log(`Successfully injected ${Object.keys(newKeys).length} keys into translations.ts`);
} catch(e) {
    console.error(e);
}
