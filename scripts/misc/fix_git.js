const { execSync } = require('child_process');
execSync('git checkout src/app/pos/page.tsx', { stdio: 'inherit' });
console.log('Restored correctly!');
