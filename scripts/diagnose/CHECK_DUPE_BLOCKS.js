const fs = require('fs');
const content = fs.readFileSync('src/lib/translations.ts', 'utf8');

const arMatches = content.match(/"ar":\s*\{/gi) || [];
console.log('Number of "ar": { blocks:', arMatches.length);

const enMatches = content.match(/"en":\s*\{/gi) || [];
console.log('Number of "en": { blocks:', enMatches.length);
