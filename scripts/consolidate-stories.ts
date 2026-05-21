import fs from 'fs';
import path from 'path';

const SRC_FILE = path.join(process.cwd(), 'docs/user-stories/sample-user-stories.md');
const OUT_DIR = path.join(process.cwd(), 'docs/MASTER_PACK/12-user-stories');

if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
}

const content = fs.readFileSync(SRC_FILE, 'utf8');
const lines = content.split('\n');

let currentModule = '';
let currentContent: string[] = [];

for (const line of lines) {
    if (line.startsWith('### 2.')) {
        // Save previous module
        if (currentModule) {
            fs.writeFileSync(path.join(OUT_DIR, `${currentModule.toLowerCase()}.md`), currentContent.join('\n'));
        }
        
        // Extract new module name
        const match = line.match(/### 2\.\d+ ([a-zA-Z]+) —/);
        if (match) {
            currentModule = match[1];
            currentContent = [`# User Stories: ${currentModule}`, '', line];
        }
    } else if (line.startsWith('## 3.')) {
        if (currentModule) {
            fs.writeFileSync(path.join(OUT_DIR, `${currentModule.toLowerCase()}.md`), currentContent.join('\n'));
            currentModule = '';
        }
    } else if (currentModule) {
        currentContent.push(line);
    }
}

// Generate Index
const modules = fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.md') && f !== 'INDEX.md' && f !== 'ESTIMATION.md');
const indexContent = [
    '# User Stories Index',
    '',
    ...modules.map(m => `- [${m.replace('.md', '').toUpperCase()}](./${m})`)
].join('\n');

fs.writeFileSync(path.join(OUT_DIR, 'INDEX.md'), indexContent);

// Generate ESTIMATION.md
const estContent = `
# Story Points Estimation

We use Fibonacci sequence for story pointing: 1, 2, 3, 5, 8, 13, 21.

- **1 point**: Simple CRUD operation, no complex validation.
- **3 points**: Average story, basic validation and UI logic.
- **5 points**: Complex workflow (e.g. multi-step approval).
- **8 points**: Requires significant backend changes or new 3rd party integration.
- **13+ points**: Epic. Needs to be broken down.
`;
fs.writeFileSync(path.join(OUT_DIR, 'ESTIMATION.md'), estContent);

console.log('Stories consolidated successfully!');
