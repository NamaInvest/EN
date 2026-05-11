const { execSync } = require('child_process');
const fs = require('fs');
const out = execSync('git show --name-only --format="" f9f06fc30d58e7e1f808e70aaa811a7c55af51dc').toString('utf8');
fs.writeFileSync('changed-files-utf8.txt', out, 'utf8');
