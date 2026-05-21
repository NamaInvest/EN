import fs from 'fs';
import path from 'path';

const DOCS_DIR = path.join(process.cwd(), 'docs/user-manual');
const OUTPUT_FILE = path.join(process.cwd(), 'public/help-search-index.json');

function walkDir(dir: string, ext: string): string[] {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return results;
    
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(filePath, ext));
        } else if (filePath.endsWith(ext)) {
            results.push(filePath);
        }
    }
    return results;
}

function run() {
    console.log('Building Help Search Index...');
    
    const markdownFiles = walkDir(DOCS_DIR, '.md');
    const indexData: { id: string, role: string, title: string, content: string }[] = [];

    for (const file of markdownFiles) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Extract basic metadata based on path
        const relativePath = file.replace(DOCS_DIR, '');
        const parts = relativePath.split(path.sep).filter(Boolean);
        
        let role = 'general';
        if (parts.length > 1 && parts[0] !== '_tooltips') {
            role = parts[0];
        } else if (parts[0] === '_tooltips') {
            role = 'tooltip';
        }

        // Just take the first line as title or filename
        const firstLineMatch = content.match(/^#\s+(.*)/m);
        const title = firstLineMatch ? firstLineMatch[1] : path.basename(file, '.md');

        indexData.push({
            id: relativePath,
            role,
            title,
            // Clean up content slightly for search indexing
            content: content.replace(/#+/g, '').replace(/\n/g, ' ').substring(0, 1000)
        });
    }

    const publicDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(indexData, null, 2));
    console.log(`✅ Indexed ${indexData.length} manual sections to ${OUTPUT_FILE}`);
}

run();
