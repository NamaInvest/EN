const fs = require('fs');
const path = require('path');

const d = new TextDecoder('windows-1256');
const bytes = new Uint8Array(256);
for(let i=0; i<256; i++) bytes[i] = i;
const str = d.decode(bytes);

const reverseMap = new Map();
for(let i=0; i<256; i++) {
    reverseMap.set(str[i], i);
}

const utf8Decoder = new TextDecoder('utf-8', { fatal: true });

function tryDecode(text) {
    if (!text) return text;
    const outBytes = new Uint8Array(text.length);
    for(let i=0; i<text.length; i++) {
        if(!reverseMap.has(text[i])) return text;
        outBytes[i] = reverseMap.get(text[i]);
    }
    try {
        const decoded = utf8Decoder.decode(outBytes);
        // Only return decoded if it actually contains Arabic or Emoji characters,
        // or if the text was changed (meaning it wasn't just pure ASCII).
        if (decoded !== text && (/[^\x00-\x7F]/.test(decoded))) {
            return decoded;
        }
        return text;
    } catch(e) { 
        return text; 
    }
}

function fixContent(content) {
    // Split by delimiters to isolate double-encoded words.
    // ASCII delimiters: space, punctuation, brackets, math operators, etc.
    const parts = content.split(/([\s\.,;:'"{}()<>[\]+\-*/=`~!@#$%^&|\\?]+)/);
    return parts.map(part => tryDecode(part)).join('');
}

function fixFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const fixed = fixContent(content);
    if (fixed !== content) {
        fs.writeFileSync(filePath, fixed, 'utf8');
        console.log('Fixed:', filePath);
        return true;
    }
    return false;
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    let count = 0;
    for (const file of files) {
        if(file === 'node_modules' || file === '.git' || file === '.next') continue;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            count += walkDir(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.css')) {
            if (fixFile(fullPath)) {
                count++;
            }
        }
    }
    return count;
}

const total = walkDir(path.join(__dirname, '../../src/app'));
console.log('Total files fixed:', total);
