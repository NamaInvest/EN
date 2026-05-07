#!/usr/bin/env node
/**
 * H-01 fix: convert dead-i18n client pages to async Server Components.
 *
 * Background:
 * A bulk migration added `'use client'` + `useTranslation()` to many dashboard
 * pages whose bodies were never refactored — they still call `await prisma.X()`
 * at the top level. That combination cannot work at runtime (prisma is server-only)
 * and produces 91 TypeScript errors (TS2304 'prisma' not found, TS1308 await
 * outside async).
 *
 * In every affected file, the `_t` helper is dead code (0 callsites). The fix is:
 *   1. Drop `'use client';`
 *   2. Drop the `useTranslation` import
 *   3. Drop the dead `lang` + `_t` lines
 *   4. Add `async` to the default export function
 *   5. Add `import prisma from '@/lib/prisma';`
 *
 * Run from repo root:
 *   node scripts/fix-broken-client-pages.mjs --dry   # preview
 *   node scripts/fix-broken-client-pages.mjs         # apply
 */
import fs from 'node:fs';
import path from 'node:path';

const TARGETS = [
    'src/app/(dashboard)/accounting/customer-statements/page.tsx',
    'src/app/(dashboard)/accounting/dunning/page.tsx',
    'src/app/(dashboard)/accounting/multi-book/page.tsx',
    'src/app/(dashboard)/accounting/payment-runs/page.tsx',
    'src/app/(dashboard)/accounting/vendor-statements/page.tsx',
    'src/app/(dashboard)/accounting/year-end-close/page.tsx',
    'src/app/(dashboard)/admin/security/mfa-audit/page.tsx',
    'src/app/(dashboard)/admin/security/mfa-policy/page.tsx',
    'src/app/(dashboard)/fng/allocations/page.tsx',
    'src/app/(dashboard)/fng/budgets/page.tsx',
    'src/app/(dashboard)/gift-cards/page.tsx',
    'src/app/(dashboard)/inventory/movements/page.tsx',
    'src/app/(dashboard)/inventory/wms/page.tsx',
    'src/app/(dashboard)/inventory/zones/page.tsx',
    'src/app/(dashboard)/manufacturing/boms/page.tsx',
    'src/app/(dashboard)/manufacturing/orders/page.tsx',
    'src/app/(dashboard)/pos-dashboard/page.tsx',
    'src/app/(dashboard)/promotions/page.tsx',
    'src/app/(dashboard)/purchases/orders/page.tsx',
    'src/app/(dashboard)/purchases/requisitions/page.tsx',
    'src/app/(dashboard)/quality/inspections/page.tsx',
    'src/app/(dashboard)/quality/ncrs/page.tsx',
    'src/app/(dashboard)/restaurant-tables/page.tsx',
    'src/app/(dashboard)/settings/security/page.tsx',
    'src/app/(dashboard)/subscriptions/page.tsx',
    'src/app/(dashboard)/treasury/petty-cash/page.tsx',
    'src/app/(dashboard)/v3/manufacturing/mrp/page.tsx',
    'src/app/(dashboard)/v3/realestate/leases/page.tsx',
    'src/app/(dashboard)/v3/school/sis/page.tsx',
];

const dryRun = process.argv.includes('--dry');
const repoRoot = path.resolve(process.cwd());

// Order matters: most-specific patterns first.
const RE_USE_CLIENT = /^['"]use client['"];?\s*\r?\n/;
const RE_I18N_IMPORT = /^import\s+\{\s*useTranslation\s*\}\s+from\s+['"]@\/lib\/i18n['"];?\s*\r?\n/m;
const RE_LANG_LINE = /^\s*const\s+\{\s*lang\s*\}\s*=\s*useTranslation\(\)\s*;?\s*\r?\n/m;
const RE_T_HELPER = /^\s*const\s+_t\s*=\s*\([^)]*\)\s*=>\s*lang\s*===\s*['"]ar['"]\s*\?\s*ar\s*:\s*en\s*;?\s*\r?\n/m;
const RE_DEFAULT_EXPORT = /^(export\s+default\s+)(function\s+)([A-Za-z_]\w*)/m;
const RE_PRISMA_IMPORT = /^import\s+(\w+\s+,\s*)?\{?\s*prisma\s*\}?\s+from\s+['"]@\/lib\/prisma['"]/m;
// Matches both `await prisma.X` and `await (prisma as any).X`
const RE_HAS_AWAIT_PRISMA = /\bawait\s+\(?\s*prisma\b/;

let touched = 0;
let unchanged = 0;
let missing = 0;
const skipped = [];

for (const rel of TARGETS) {
    const abs = path.join(repoRoot, rel);
    if (!fs.existsSync(abs)) {
        missing++;
        skipped.push(`${rel} — file not found`);
        continue;
    }

    let src = fs.readFileSync(abs, 'utf8');

    if (!RE_HAS_AWAIT_PRISMA.test(src)) {
        unchanged++;
        skipped.push(`${rel} — no top-level "await prisma" (already fine)`);
        continue;
    }

    let changed = false;

    if (RE_USE_CLIENT.test(src)) {
        src = src.replace(RE_USE_CLIENT, '');
        changed = true;
    }

    if (RE_I18N_IMPORT.test(src)) {
        src = src.replace(RE_I18N_IMPORT, '');
        changed = true;
    }

    if (RE_LANG_LINE.test(src)) {
        src = src.replace(RE_LANG_LINE, '');
        changed = true;
    }

    if (RE_T_HELPER.test(src)) {
        src = src.replace(RE_T_HELPER, '');
        changed = true;
    }

    if (RE_DEFAULT_EXPORT.test(src) && !/export\s+default\s+async\s+function/.test(src)) {
        src = src.replace(RE_DEFAULT_EXPORT, '$1async $2$3');
        changed = true;
    }

    if (!RE_PRISMA_IMPORT.test(src)) {
        // Insert prisma import after the last import statement to keep ordering tidy.
        const lastImportMatch = [...src.matchAll(/^import .+;\s*\r?\n/gm)].pop();
        const insertion = `import prisma from '@/lib/prisma';\n`;
        if (lastImportMatch) {
            const idx = lastImportMatch.index + lastImportMatch[0].length;
            src = src.slice(0, idx) + insertion + src.slice(idx);
        } else {
            src = insertion + src;
        }
        changed = true;
    }

    if (!changed) {
        unchanged++;
        skipped.push(`${rel} — already converted`);
        continue;
    }

    if (!dryRun) {
        fs.writeFileSync(abs, src, 'utf8');
    }
    touched++;
    console.log(`${dryRun ? '[dry] ' : ''}fixed: ${rel}`);
}

console.log(`\n${dryRun ? '[dry-run] ' : ''}touched: ${touched}, unchanged: ${unchanged}, missing: ${missing}`);
if (skipped.length) {
    console.log('Skipped:');
    for (const line of skipped) console.log(`  - ${line}`);
}
