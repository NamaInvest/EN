/**
 * Fix remaining params issues for dynamic segments with multiple params
 * e.g. /api/purchases/po/[id]/landed-costs/[costId]/allocate/route.ts
 * Fix: (await params).costId
 */
const fs   = require('fs');
const path = require('path');

function walk(dir) {
    let out = [];
    try {
        for (const f of fs.readdirSync(dir)) {
            const full = path.join(dir, f);
            if (fs.statSync(full).isDirectory()) out = out.concat(walk(full));
            else if (f.endsWith('.ts') || f.endsWith('.tsx')) out.push(full);
        }
    } catch {}
    return out;
}

const apiFiles = walk(path.join(__dirname, 'src', 'app', 'api'));
let fixed = 0;

const paramNames = ['id', 'costId', 'batchId', 'versionId', 'action', 'slug', 'tab'];

for (const file of apiFiles) {
    let c = fs.readFileSync(file, 'utf8');
    let changed = false;

    for (const p of paramNames) {
        // Pattern: params.paramName (not already awaited)
        const simple = new RegExp(`(?<!await )params\\.${p}\\b`, 'g');
        if (simple.test(c)) {
            c = c.replace(simple, `(await params).${p}`);
            // Make sure handler is async
            c = c.replace(/^export async function (GET|POST|PUT|PATCH|DELETE)/gm, 'export async function $1');
            c = c.replace(/^export function (GET|POST|PUT|PATCH|DELETE)/gm, 'export async function $1');
            changed = true;
        }
    }

    if (changed) {
        fs.writeFileSync(file, c, 'utf8');
        fixed++;
        console.log('Fixed:', path.relative(__dirname, file));
    }
}

console.log(`\nFixed ${fixed} API route files.`);
