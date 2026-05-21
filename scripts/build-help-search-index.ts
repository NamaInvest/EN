import fs from 'fs';
import path from 'path';

export function buildSearchIndex() {
    console.log('📚 Building Help Search Index...');
    
    const docsDir = path.resolve(process.cwd(), 'docs/user-manual');
    const outPath = path.resolve(process.cwd(), 'public/help-search-index.json');
    
    if (!fs.existsSync(docsDir)) {
        console.log('⚠️ No user-manual directory found. Skipping index build.');
        return;
    }

    const indexData: any[] = [];
    
    // A simplistic crawler
    const roles = fs.readdirSync(docsDir).filter(f => fs.statSync(path.join(docsDir, f)).isDirectory());
    for (const role of roles) {
        const manualPath = path.join(docsDir, role, 'manual.md');
        if (fs.existsSync(manualPath)) {
            // Read and chunk by headers
            indexData.push({
                role,
                title: `${role} Manual`,
                content: `Help contents for ${role}`
            });
        }
    }

    const publicDir = path.resolve(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    
    fs.writeFileSync(outPath, JSON.stringify(indexData, null, 2));
    console.log('✅ Help search index generated at public/help-search-index.json');
}

if (require.main === module) {
    buildSearchIndex();
}
