const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // Run a direct Node.js test on the server reading the actual built chunk
    const testCmd = `
cd /www/wwwroot/n3.namainvist.com

# Test: Load the i18n source directly in Node and test t() function
node -e "
const fs = require('fs');
const content = fs.readFileSync('src/lib/i18n.tsx', 'utf-8');

// Extract just the translations object by finding the ar: { ... } block
// Find the ar section boundaries
const arMatch = content.indexOf(\\\"ar: {\\\");
const lines = content.split('\\n');

// Find line numbers
let arStartLine = -1;
let arEndLine = -1;
let braceCount = 0;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('ar: {')) {
        arStartLine = i;
        braceCount = 0;
    }
    if (arStartLine >= 0 && i >= arStartLine) {
        for (const ch of lines[i]) {
            if (ch === '{') braceCount++;
            if (ch === '}') braceCount--;
        }
        if (braceCount === 0 && i > arStartLine) {
            arEndLine = i;
            break;
        }
    }
}

console.log('ar section: line ' + arStartLine + ' to ' + arEndLine + ' (' + (arEndLine - arStartLine) + ' lines)');

// Extract the ar section content and count keys
const arLines = lines.slice(arStartLine, arEndLine + 1);
let keyCount = 0;
let hasDashboard = false;
let hasCommonSar = false;
let lastKey = '';

for (const line of arLines) {
    const match = line.match(/^\\s+'([^']+)':/);
    if (match) {
        keyCount++;
        lastKey = match[1];
        if (match[1] === 'dashboard.title') hasDashboard = true;
        if (match[1] === 'common.sar') hasCommonSar = true;
    }
}

console.log('Total keys in ar section: ' + keyCount);
console.log('Last key: ' + lastKey);
console.log('Has dashboard.title: ' + hasDashboard);
console.log('Has common.sar: ' + hasCommonSar);

// Now try to actually evaluate the ar object
try {
    // Build a simple object from the ar section
    const arContent = arLines.join('\\n').replace(/^\\s*ar:\\s*\\{/, '{');
    const arObj = eval('(' + arContent + ')');
    console.log('\\nSuccessfully parsed ar object with ' + Object.keys(arObj).length + ' keys');
    console.log('  dashboard.title = ' + JSON.stringify(arObj['dashboard.title']));
    console.log('  common.sar = ' + JSON.stringify(arObj['common.sar']));
    console.log('  dashboard.refresh = ' + JSON.stringify(arObj['dashboard.refresh']));
    console.log('  sys.str_549 = ' + JSON.stringify(arObj['sys.str_549']));
    console.log('  sys.str_100 = ' + JSON.stringify(arObj['sys.str_100']));
} catch(e) {
    console.log('PARSE ERROR: ' + e.message);
    console.log('Error at: ' + e.stack.split('\\n')[0]);
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
