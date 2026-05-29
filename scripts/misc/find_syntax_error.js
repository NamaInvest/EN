const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const testCmd = `
cd /www/wwwroot/n3.namainvist.com
node -e "
const fs = require('fs');
const content = fs.readFileSync('src/lib/i18n.tsx', 'utf-8');
const lines = content.split('\\n');

// Find ar section
let arStart = -1, arEnd = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('ar: {')) arStart = i;
}
// Find end by brace counting
let bc = 0;
for (let i = arStart; i < lines.length; i++) {
    for (const ch of lines[i]) {
        if (ch === '{') bc++;
        if (ch === '}') bc--;
    }
    if (bc === 0 && i > arStart) { arEnd = i; break; }
}

// Try to find the exact line with syntax error by parsing incrementally
const arLines = lines.slice(arStart, arEnd + 1);
let arContent = arLines.join('\\n').replace(/^\\s*ar:\\s*\\{/, '{');

// Try removing last few keys and see if it parses
for (let removeCount = 0; removeCount < 50; removeCount++) {
    const testLines = arLines.slice(0, arLines.length - removeCount);
    let testContent = testLines.join('\\n').replace(/^\\s*ar:\\s*\\{/, '{');
    // Close any unclosed braces
    let openBraces = 0;
    for (const ch of testContent) {
        if (ch === '{') openBraces++;
        if (ch === '}') openBraces--;
    }
    testContent += '}'.repeat(Math.max(0, openBraces));
    
    try {
        eval('(' + testContent + ')');
        if (removeCount > 0) {
            console.log('Parses OK when removing last ' + removeCount + ' lines');
            console.log('Problem around line ' + (arStart + arLines.length - removeCount) + ':');
            for (let j = Math.max(0, arLines.length - removeCount - 3); j < Math.min(arLines.length, arLines.length - removeCount + 5); j++) {
                console.log('  L' + (arStart + j + 1) + ': ' + arLines[j]);
            }
        } else {
            console.log('Parses OK with 0 removals - no syntax issue after all');
        }
        break;
    } catch(e) {
        // keep trying
    }
}

// Also check for problematic characters
console.log('\\nChecking for unescaped quotes...');
let problemLines = [];
for (let i = 0; i < arLines.length; i++) {
    const line = arLines[i];
    // Look for lines with odd single quote count (may have unescaped quotes)
    const matches = line.match(/'/g);
    if (matches) {
        // A normal key-value line should have exactly 4 quotes: 'key': 'value'  
        // or content with apostrophes
        if (line.includes(\\\"'\\\") && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
            const quoteCount = matches.length;
            if (quoteCount % 2 !== 0) {
                problemLines.push({line: arStart + i + 1, content: line.trim(), quotes: quoteCount});
            }
        }
    }
}
if (problemLines.length > 0) {
    console.log('Lines with odd quote count:');
    problemLines.forEach(p => console.log('  L' + p.line + ' (quotes:' + p.quotes + '): ' + p.content.substring(0, 100)));
} else {
    console.log('No odd-quote lines found');
}
" 2>&1
`;
    conn.exec(testCmd, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.stderr.on('data', d => out += d.toString());
        stream.on('close', () => { console.log(out); conn.end(); });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
