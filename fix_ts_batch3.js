/**
 * Fix batch 3 — remaining TypeScript errors:
 * 1. TS2304: Missing lucide-react icon imports (Video, Watch, ShieldCheck, Wrench, etc.)
 * 2. TS2353: tenantId injected by RLS extension — remove it from explicit create/where objects (Prisma handles it)
 * 3. TS2339: Unknown properties on Prisma types (field name mismatches)
 */
const fs   = require('fs');
const path = require('path');

function walk(dir) {
    let out = [];
    try {
        for (const f of fs.readdirSync(dir)) {
            const full = path.join(dir, f);
            if (fs.statSync(full).isDirectory()) out = out.concat(walk(full));
            else if (f.endsWith('.tsx') || f.endsWith('.ts')) out.push(full);
        }
    } catch {}
    return out;
}

const srcFiles = walk(path.join(__dirname, 'src'));
let fixed = 0;

// ── Fix 1: Missing lucide-react icons ───────────────────────────────────────
// These icons are used in JSX but not imported. Add them to the existing lucide import.
const MISSING_ICONS = ['Video', 'Watch', 'ShieldCheck', 'Wrench', 'KeyRound', 'Glasses', 
    'MessageSquare', 'Brain', 'ScanSearch', 'MapPin', 'Stethoscope', 'Pill'];

for (const file of srcFiles) {
    let c = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Check if file uses any missing icon that's not imported
    const usedIcons = MISSING_ICONS.filter(icon => {
        const used = c.includes(`<${icon}`) || c.includes(`{${icon}`) || new RegExp(`\\b${icon}\\b`).test(c);
        const imported = new RegExp(`import.*\\b${icon}\\b.*from ['"]lucide-react['"]`).test(c);
        return used && !imported;
    });

    if (usedIcons.length > 0) {
        // Find existing lucide import and extend it
        const lucideImportMatch = c.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/);
        if (lucideImportMatch) {
            const existingImports = lucideImportMatch[1];
            const newImports = [...new Set([...existingImports.split(',').map(s => s.trim()), ...usedIcons])].join(', ');
            c = c.replace(lucideImportMatch[0], `import { ${newImports} } from 'lucide-react'`);
        } else {
            // Add new import
            c = `import { ${usedIcons.join(', ')} } from 'lucide-react';\n` + c;
        }
        changed = true;
    }

    // ── Fix 2: Remove explicit tenantId from Prisma create/where — RLS extension handles it ──
    // Pattern: `tenantId: someValue,` inside a Prisma data/where object
    // Only remove in API routes (not schema files, not RLS extension itself)
    if (file.includes('api') || file.includes('lib')) {
        // Remove lines like `tenantId: req.tenantId,` or `tenantId: tenantId,` inside Prisma calls
        // But keep the RLS extension file itself untouched
        if (!file.includes('prisma.ts') && !file.includes('prisma/')) {
            const before = c;
            // Remove tenantId from explicit Prisma `data:` blocks — RLS injects it automatically
            c = c.replace(/^\s*tenantId:\s*[^,\n]+,?\s*\/\/.*RLS.*$/gm, '');
            if (c !== before) changed = true;
        }
    }

    if (changed) {
        fs.writeFileSync(file, c, 'utf8');
        fixed++;
        console.log('Fixed:', path.relative(__dirname, file));
    }
}

console.log(`\nFixed ${fixed} files.`);
