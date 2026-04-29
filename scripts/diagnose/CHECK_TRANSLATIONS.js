const fs = require('fs');

try {
    const t = fs.readFileSync('src/lib/translations.ts', 'utf8');
    const matches = [...t.matchAll(/sys\.str_(\d+)/g)].map(m => parseInt(m[1]));
    const max = Math.max(...matches);
    console.log('Max key:', max);
    
    // Let's also check missing keys between 4000 and max
    const uniqueKeys = new Set(matches);
    let missing = [];
    for(let i=4000; i<=max; i++) {
        if(!uniqueKeys.has(i)) missing.push(i);
    }
    console.log('Missing keys count:', missing.length);
    console.log('First few missing:', missing.slice(0, 20));
} catch(e) {
    console.error(e);
}
