const fs = require('fs');

const files = [
  'src/app/design2/page.tsx',
  'src/app/design3/page.tsx',
  'src/app/design4/page.tsx',
];

for (let i = 0; i < files.length; i++) {
  const file = files[i];
  let content = fs.readFileSync(file, 'utf8');

  // Fix literal \n outside string
  content = content.replace(/\\n\s*\/\/ Inject Tailwind CDN/g, '\n    // Inject Tailwind CDN');

  fs.writeFileSync(file, content);
}

console.log('Fixed syntax error in all files.');
