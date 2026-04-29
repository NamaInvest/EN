const cp = require('child_process');
const fs = require('fs');

console.log('Checking out HEAD for master/page.tsx');
try {
    cp.execSync('git checkout HEAD -- src/app/master/page.tsx');
} catch (e) { console.log(e.message); }

let c = fs.readFileSync('src/app/master/page.tsx', 'utf8');
c = c.split('\\${').join('${');
c = c.split('\\`').join('`');
c = c.split('\\\'').join('\'');

fs.writeFileSync('src/app/master/page.tsx', c);

let cR = fs.readFileSync('src/app/api/master/route.ts', 'utf8');
cR = cR.split('\\${').join('${');
cR = cR.split('\\`').join('`');
fs.writeFileSync('src/app/api/master/route.ts', cR);

console.log('Fixed master files locally.');
