const fs = require('fs');
const schema = fs.readFileSync('c:\\Users\\1\\Desktop\\alfa\\prisma\\schema.prisma', 'utf8');
const models = [...schema.matchAll(/model\s+(\w+)\s+{/g)].map(m => m[1]);

const modelsToKeep = [
    'User', 
    'Setting', 
    'Company', 
    'Branch', 
    'Subscription', 
    'Account', // We UPDATE balance to 0, not delete
    'SystemAlert' // System alerts can be wiped but maybe harmless to keep
];

const modelsToWipe = models.filter(m => !modelsToKeep.includes(m));

// Format as Prisma calls
const camelCase = (str) => str.charAt(0).toLowerCase() + str.slice(1);
const calls = modelsToWipe.map(m => `                await tx.${camelCase(m)}.deleteMany({});`).join('\n');

console.log(calls);

fs.writeFileSync('c:\\Users\\1\\Desktop\\alfa\\generated_wipe.js', calls);
