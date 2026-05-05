const { execSync } = require('child_process');
const fs = require('fs');

const diff = execSync('git diff HEAD~2 --name-only', { encoding: 'utf8' });
const lines = diff.split('\n').map(l => l.trim()).filter(l => l.length > 0);

fs.writeFileSync('sync_report.json', JSON.stringify(lines, null, 2), 'utf8');
console.log('Created sync_report.json with ' + lines.length + ' files.');
