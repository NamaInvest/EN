const { execSync } = require('child_process');
const fs = require('fs');

try {
    // Save the current translations.ts just in case
    if (!fs.existsSync('src/lib/translations.ts.backup')) {
        fs.copyFileSync('src/lib/translations.ts', 'src/lib/translations.ts.backup');
    }

    // Get the version of translations.ts from 2 commits ago (before our cleanup script destroyed it)
    console.log("Checking git history for translations.ts...");
    let gitLog = execSync('git log -n 5 --oneline src/lib/translations.ts').toString();
    console.log("Git Log for translations.ts:\n", gitLog);

    // Let's get the original file content from HEAD
    let originalDict = '';
    try {
        originalDict = execSync('git show HEAD:src/lib/translations.ts').toString();
        fs.writeFileSync('src/lib/translations.ts.original', originalDict);
        console.log("Extracted original translations.ts from git into translations.ts.original");
    } catch(e) {
        console.log("Could not extract from Git HEAD", e.message);
    }

    // Parse the original dict to see if it has 4390
    if (originalDict.includes('sys.str_4390')) {
        console.log("✅ The original Git file has sys.str_4390!");
    } else {
        console.log("❌ The original Git file DOES NOT have sys.str_4390!");
    }

} catch(e) {
    console.error(e);
}
