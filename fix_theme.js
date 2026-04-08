const fs = require('fs');
let code = fs.readFileSync('src/components/ThemeSwitcher.tsx', 'utf8');

code = code.replace(/name: t\('(sys\.str_\d+)'\)/g, "nameKey: '$1'");
code = code.replace(/{theme\.name}/g, "{t(theme.nameKey)}");

fs.writeFileSync('src/components/ThemeSwitcher.tsx', code);
console.log('Fixed locally.');
