const fs = require('fs');

const content = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');

// extract LABELS.ar
const arLabelsMatch = content.match(/ar:\s*{([^}]+)}/);
const arLabelsText = arLabelsMatch[1];
const arKeys = [];
const keyRegex = /'([^']+)':\s*'/g;
let match;
while ((match = keyRegex.exec(arLabelsText)) !== null) {
    arKeys.push(match[1]);
}

// extract all lk values from menuItems
const lkRegex = /lk:\s*'([^']+)'/g;
const lkKeys = [];
while ((match = lkRegex.exec(content)) !== null) {
    lkKeys.push(match[1]);
}

const missing = lkKeys.filter(k => !arKeys.includes(k));
console.log('Missing lk keys in Arabic LABELS:', missing);

// extract sk values (groups)
const skRegex = /sk:\s*'([^']+)'/g;
const skKeys = [];
while ((match = skRegex.exec(content)) !== null) {
    skKeys.push(match[1]);
}

const missingSk = skKeys.filter(k => !arKeys.includes(k));
console.log('Missing sk keys in Arabic LABELS:', missingSk);
