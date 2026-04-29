const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/settings/page.tsx', 'utf8');

// 1. Remove sys.str_4434 block perfectly
const groupRegex = /\{\r?\n\s+title:\s*t\('sys\.str_4434'\)[\s\S]*?\r?\n\s+\},/;
code = code.replace(groupRegex, '');

// 2. Remove states
const statesRegex = /const \[fatooraStep, setFatooraStep\] = useState\(0\);\r?\n\s*const \[fatooraLoading, setFatooraLoading\] = useState\(false\);\r?\n\s*const \[fatooraMessage, setFatooraMessage\] = useState\(''\);/;
code = code.replace(statesRegex, '');

// 3. Remove useEffect chunk
const effectRegex = /\/\/\s*Check\s*ZATCA\s*connection\s*status[\s\S]*?catch\s*\{\s*\/\*\s*ZATCA\s*status\s*check\s*failed,\s*ignore\s*\*\/\s*\}/;
code = code.replace(effectRegex, '');

// 4. Remove handleFatooraAction
const handleRegex = /const handleFatooraAction = async \(action: string\) => \{[\s\S]*?finally \{ setFatooraLoading\(false\); \}\r?\n\s+\};/;
code = code.replace(handleRegex, '');

// 5. Remove UI wizard
const startIdx = code.indexOf("{group.title.includes(t('sys.str_4551')) && (");
if (startIdx !== -1) {
    const endStr = "                        {group.title.includes(t('sys.str_4561')) && (";
    const endIdx = code.indexOf(endStr, startIdx);
    if (endIdx !== -1) {
        code = code.substring(0, startIdx) + code.substring(endIdx);
    }
}

fs.writeFileSync('src/app/(dashboard)/settings/page.tsx', code);
console.log('Settings Cleaned');
