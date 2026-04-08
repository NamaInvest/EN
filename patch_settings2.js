const fs = require('fs');
const p = 'src/app/(dashboard)/settings/page.tsx';
let code = fs.readFileSync(p, 'utf8');

// Replace SETTING_GROUPS.map with getSettingGroups(t).map inside the component
code = code.replace(/{SETTING_GROUPS\.map\(/g, '{getSettingGroups(t).map(');

fs.writeFileSync(p, code);
console.log('Replaced SETTING_GROUPS.map -> getSettingGroups(t).map');
