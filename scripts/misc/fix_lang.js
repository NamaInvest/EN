const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'app', '(dashboard)', 'settings', 'page.tsx');
let content = fs.readFileSync(file, 'utf8');

// Find all occurrences of 'sys.str_XXXX' that are NOT preceded by t(
const regex = /(?<!t\s*\(\s*)(['"])(sys\.str_\d+)\1/g;
const matches = content.match(regex);

if (matches) {
    console.log(`Found ${matches.length} bare 'sys.str_XXXX' strings in settings/page.tsx.`);
    
    // Replace them with t('sys.str_XXXX')
    content = content.replace(regex, "t($&)");
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('✅ Successfully wrapped all bare localization keys with t() in settings/page.tsx!');
} else {
    console.log('No bare localization keys found in settings/page.tsx (maybe already fixed).');
}

// Let's also do a quick scan of the entire src directory to see if other files have bare sys.str_XXXX strings.
function scanDir(dir) {
    let bareKeysCount = 0;
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const fullPath = path.join(dir, f);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && f !== 'node_modules' && f !== '.next') {
            bareKeysCount += scanDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            if (fullPath === file) continue; // Skip settings/page.tsx as we just fixed it
            const text = fs.readFileSync(fullPath, 'utf8');
            const fileMatches = text.match(regex);
            if (fileMatches) {
                console.log(`⚠️ Warning: Found ${fileMatches.length} bare keys in ${fullPath.replace(__dirname, '')}`);
                bareKeysCount += fileMatches.length;
            }
        }
    }
    return bareKeysCount;
}

const totalOtherMatches = scanDir(path.join(__dirname, 'src'));
console.log(`\nScan complete. Found ${totalOtherMatches} bare keys in other files.`);
if (totalOtherMatches > 0) {
    console.log('Run a global replace if you are sure t() is in scope in those files.');
}
