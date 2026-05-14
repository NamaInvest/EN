const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const aiBrainDir = path.join(rootDir, 'docs', 'ai-brain');
const dotAiBrainDir = path.join(rootDir, '.ai-brain');

function copyAndRename(srcName, targetName, prefixText = '') {
    const srcPath = path.join(dotAiBrainDir, srcName);
    const targetPath = path.join(aiBrainDir, targetName);
    if (fs.existsSync(srcPath)) {
        let content = fs.readFileSync(srcPath, 'utf-8');
        fs.writeFileSync(targetPath, prefixText + '\n\n' + content);
    }
}

// Map the extracted raw data to the requested final documentation files
copyAndRename('07-all-api-endpoints.md', 'API_MAP.md', '# API Map\nThis file contains all automatically discovered API routes.');
copyAndRename('08-database-models-full.md', 'DATABASE_MAP.md', '# Database Map\nThis file contains all automatically discovered database models.');
copyAndRename('12-dependencies.md', 'ENVIRONMENT_AND_CONFIG.md', '# Environment and Config\n');

console.log('✅ Overwrote API_MAP.md, DATABASE_MAP.md, and ENVIRONMENT_AND_CONFIG.md with actual scanned codebase data.');
