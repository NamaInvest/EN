const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('page.tsx') || file.endsWith('route.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'src', 'app'));

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Fix 1: Change { params }: { params: { id: string } } -> { params }: { params: Promise<{ id: string }> }
    // or just any `params: { ... }` to `params: Promise<{ ... }>`
    // This regex matches `params: { something }` inside the arguments
    content = content.replace(/(params\s*:\s*)(\{[\s\w:]+\})/g, (match, p1, p2) => {
        if (!content.includes('Promise<{')) {
            changed = true;
            return `${p1}Promise<${p2}>`;
        }
        return match;
    });
    
    // Sometimes it's `params: any` -> `params: Promise<any>`
    content = content.replace(/(params\s*:\s*)(any)/g, (match, p1, p2) => {
        if (!content.includes('Promise<any>')) {
            changed = true;
            return `${p1}Promise<${p2}>`;
        }
        return match;
    });

    // Fix 2: Usage of `params.id` directly.
    // If we use params.id, we must first `const { id } = await params;` or `const resolvedParams = await params; resolvedParams.id`.
    // It's much easier to just replace `params.id` with `(await params).id` globally if the function is async!
    // But is the function async? Next.js route handlers usually are. Page components might not be.
    // Let's blindly replace `params.id` with `(await params).id` and ensure `export default function` becomes `export default async function`.
    if (content.includes('params.id') && !content.includes('(await params).id')) {
        content = content.replace(/params\.id/g, '(await params).id');
        
        // Ensure function is async
        content = content.replace(/export default function/g, 'export default async function');
        changed = true;
    }

    if (content.includes('params.slug') && !content.includes('(await params).slug')) {
        content = content.replace(/params\.slug/g, '(await params).slug');
        content = content.replace(/export default function/g, 'export default async function');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed params in', file);
    }
}
