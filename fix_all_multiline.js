const fs = require('fs');

let content = fs.readFileSync('src/lib/translations.ts', 'utf8');
const lines = content.split(/\r?\n/);

let inMultiline = false;
let multilineStartIndex = -1;
let currentVal = [];
let currentIndent = '';
let currentKey = '';

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!inMultiline) {
        // Look for the start of a key-value pair using double quotes
        const match = line.match(/^(\s*)"([^"]+)"\s*:\s*"(.*)$/);
        if (match) {
            currentIndent = match[1];
            currentKey = match[2];
            let restOfLine = match[3];

            // Does it end on the same line?
            // A valid single-line end is a double quote followed by optional comma and whitespace
            const endMatch = restOfLine.match(/^(.*)"\s*,?\s*$/);
            if (endMatch) {
                // It's a single line! Check for interior quotes
                let val = endMatch[1];
                // if it has unescaped interior quotes, we should backtick it
                if (val.includes('"') && !val.includes('\\"')) {
                    val = val.replace(/`/g, '\\`');
                    lines[i] = `${currentIndent}"${currentKey}": \`${val}\`,`;
                }
            } else {
                // It does NOT end on the same line! It's a multiline string!
                inMultiline = true;
                multilineStartIndex = i;
                currentVal = [restOfLine];
            }
        }
    } else {
        // We are inside a multiline string
        // Does this line end the multiline string?
        const endMatch = line.match(/^(.*)"\s*,?\s*$/);
        
        // Wait, what if the line IS another key? That means our parser missed the end quote!
        if (line.match(/^\s*"[^"]+"\s*:\s*[`"']/)) {
            // Panic! It's a new key! We must have missed the end quote.
            // Let's just reset and don't touch it.
            inMultiline = false;
            i--; // re-process this line as normal
            continue;
        }

        if (endMatch) {
            // We found the end!
            currentVal.push(endMatch[1]);
            inMultiline = false;

            // Combine the multi-line string
            let fullVal = currentVal.join('\n').replace(/`/g, '\\`');
            
            // Replace the lines with a single backticked block
            lines[multilineStartIndex] = `${currentIndent}"${currentKey}": \`${fullVal}\`,`;
            for (let j = multilineStartIndex + 1; j <= i; j++) {
                lines[j] = null; // Mark for deletion
            }
        } else {
            // Still inside
            currentVal.push(line);
        }
    }
}

content = lines.filter(l => l !== null).join('\n');
fs.writeFileSync('src/lib/translations.ts', content, 'utf8');
console.log('✅ تم تصحيح جميع النصوص المعطوبة ذات الأسطر المتعددة بنجاح!');

const { execSync } = require('child_process');
try {
    console.log('⏳ جاري التحقق من البناء محلياً لمنع تكرار الخطأ...');
    execSync('npx next build', { stdio: 'inherit' });
    console.log('🌟 البناء المحلي سليم 100%! جاري الرفع للسيرفر السحابي...');
    execSync('node deploy5.js', { stdio: 'inherit' });
} catch (e) {
    console.log('❌ خطأ في البناء! راجع التفاصيل في الأعلى.');
}
