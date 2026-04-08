const fs = require('fs');
const p = 'src/app/(dashboard)/settings/page.tsx';
let code = fs.readFileSync(p, 'utf8');

// Find the SETTING_GROUPS const block and replace it with a function
// Replace from `export const SETTING_GROUPS = [` to the closing `];` before `export default function SettingsPage`
const startMarker = 'export const SETTING_GROUPS = [';
const endMarker = '\nexport default function SettingsPage()';

const startIdx = code.indexOf(startMarker);
const endIdx = code.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
    console.log('Could not find markers. startIdx:', startIdx, 'endIdx:', endIdx);
    process.exit(1);
}

const oldBlock = code.substring(startIdx, endIdx);

// Replace t() calls inside this block with just the key string
const newBlock = oldBlock
    .replace(/export const SETTING_GROUPS = \[/, 'export const SETTING_GROUPS = getSettingGroups((k) => k);\n\nexport function getSettingGroups(t: (key: string) => string) {\n    return [')
    .replace(/\];\s*$/, '    ];\n}')
    .replace(/t\('sys\.str_4156'\)/g, "'🏷️ 50×30mm (مخصص)'");

code = code.substring(0, startIdx) + newBlock + endMarker + code.substring(endIdx + endMarker.length);

fs.writeFileSync(p, code);
console.log('Fixed SETTING_GROUPS to be a function. Block length:', oldBlock.length);
console.log('Done!');
