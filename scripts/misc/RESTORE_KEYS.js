const { execSync } = require('child_process');
const fs = require('fs');

try {
    console.log("Extracting previous translation file from Git...");
    
    // Redirect Git output directly into a file to avoid ENOBUFS buffer overflow
    execSync('git show HEAD:src/lib/translations.ts > translations_git.ts', { stdio: 'inherit' });
    
    const oldContent = fs.readFileSync('translations_git.ts', 'utf8');
    const currentContent = fs.readFileSync('src/lib/translations.ts', 'utf8');
    
    let recoveredCount = 0;
    
    // We will extract all sys.str_XXXX definitions from the old file
    // that are MISSING in the newly deduplicated file.
    const missingLineRegex = /"sys\.str_(\d+)":\s*"([^"]+)",?/g;
    let match;
    let newPairs = [];
    
    while ((match = missingLineRegex.exec(oldContent)) !== null) {
        const key = `sys.str_${match[1]}`;
        const val = match[2];
        if (!currentContent.includes(`"${key}":`)) {
            newPairs.push(`    "${key}": "${val}",`);
            recoveredCount++;
        }
    }
    
    if (recoveredCount > 0) {
        console.log(`✅ Found ${recoveredCount} missing keys! Injecting them...`);
        // Inject right before the first key sys.str_1
        let updatedContent = currentContent.replace(
            /"sys\.str_1":/,
            newPairs.join('\n') + '\n    "sys.str_1":'
        );
        fs.writeFileSync('src/lib/translations.ts', updatedContent);
        console.log("✅ Successfully restored missing translations!");
    } else {
        console.log("❌ The old git commit doesn't have the missing keys either.");
    }

} catch(e) {
    console.error(e);
}
