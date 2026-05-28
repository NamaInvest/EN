const fs = require('fs');
const content = fs.readFileSync('prisma/schema.prisma', 'utf8');

const matches = content.match(/model\s+(\w+)\s*\{/g);
if (matches) {
    const names = matches.map(m => m.replace(/model\s+/, '').replace(/\s*\{/, ''));
    console.log('All Models in Schema:');
    console.log(names.join(', '));
} else {
    console.log('No models found.');
}
