/**
 * Fix two categories of TS errors in one pass:
 * 1. `await` used inside non-async functions (mostly (await params).id patterns in sync functions)
 * 2. `_t` not found — replace with the i18n helper
 */
const fs   = require('fs');
const path = require('path');

function walk(dir) {
    let out = [];
    for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) out = out.concat(walk(full));
        else if (f.endsWith('.tsx') || f.endsWith('.ts')) out.push(full);
    }
    return out;
}

const files = walk(path.join(__dirname, 'src', 'app'));
let fixed = 0;

for (const file of files) {
    let c = fs.readFileSync(file, 'utf8');
    let changed = false;

    // ── Fix 1: _t not defined → import from server-t ──
    if (c.includes('_t(')) {
        // Ensure import exists
        if (!c.includes("from '@/lib/server-t'") && !c.includes('from "@/lib/server-t"')) {
            c = `import { _t } from '@/lib/server-t';\n` + c;
        }
        changed = true;
    }

    // ── Fix 2: await in non-async function ──
    // Look for `export default function` (non-async) that has `(await params).id` inside
    // Convert it to `export default async function`
    if (c.includes('(await params)') && c.match(/export default function [A-Za-z]/)) {
        c = c.replace(/export default function ([A-Za-z])/g, 'export default async function $1');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, c, 'utf8');
        fixed++;
        console.log('Fixed:', path.relative(__dirname, file));
    }
}

console.log(`\nFixed ${fixed} files.`);
