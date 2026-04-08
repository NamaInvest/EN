const fs = require('fs');
const c = fs.readFileSync('src/lib/translations.ts', 'utf8');
const matches = [...c.matchAll(/"sys\.str_(\d+)"/g)];
const nums = matches.map(m => parseInt(m[1]));
const max = Math.max(...nums);
const min = Math.min(...nums);
console.log('Min key:', min, 'Max key:', max, 'Total sys.str_ keys:', nums.length);

// Also check if the 4000+ range has ANY keys
const keys4000 = nums.filter(n => n >= 4000);
console.log('Keys >= 4000:', keys4000.length, keys4000.slice(0, 10));
