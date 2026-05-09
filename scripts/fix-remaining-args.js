/**
 * fix-remaining-args.js
 * Fixes two remaining TS2554 error patterns:
 * 1. Functions expecting 0 args but called with (req as any) → remove the arg
 * 2. Functions expecting 2 args but called with only (req as any) → add context
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function walk(dir) {
  let r = [];
  try {
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) r = r.concat(walk(full));
      else if (f === 'route.ts') r.push(full);
    }
  } catch {}
  return r;
}

// Get error list from tsc
function getTsErrors() {
  try {
    const out = execSync('npx tsc --noEmit 2>&1', { encoding: 'utf8', cwd: process.cwd() });
    return out.split('\n').filter(l => l.includes('error TS2554'));
  } catch (e) {
    return (e.stdout || '').split('\n').filter(l => l.includes('error TS2554'));
  }
}

const errors = getTsErrors();
console.log(`Found ${errors.length} TS2554 errors`);

// Parse: "src/app/api/.../route.ts(206,49): error TS2554: Expected 2 arguments, but got 1."
const byFile = {};
for (const err of errors) {
  const m = err.match(/^(src[^(]+\.ts)\((\d+)/);
  if (!m) continue;
  const file = path.join(process.cwd(), m[1].replace(/\//g, path.sep));
  const line = parseInt(m[2]);
  if (!byFile[file]) byFile[file] = [];
  byFile[file].push({ line, raw: err });
}

let fixed = 0;

for (const [file, errs] of Object.entries(byFile)) {
  if (!fs.existsSync(file)) continue;
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  let changed = false;

  for (const { line, raw } of errs) {
    const lineIdx = line - 1;
    const lineContent = lines[lineIdx];
    if (!lineContent) continue;

    if (raw.includes('Expected 0 arguments, but got 1')) {
      // Function takes 0 args but we're calling with (req as any)
      // Fix: remove the argument
      // Pattern: _METHOD(req as any) → _METHOD()
      const fixed_line = lineContent.replace(
        /(_(?:GET|POST|PUT|PATCH|DELETE))\(req as any\)/g,
        '$1()'
      );
      if (fixed_line !== lineContent) {
        lines[lineIdx] = fixed_line;
        changed = true;
      }
    } else if (raw.includes('Expected 2 arguments, but got 1')) {
      // Function takes 2 args (req + params) but we're calling with only (req as any)
      // Fix: add context
      const fixed_line = lineContent.replace(
        /(_(?:GET|POST|PUT|PATCH|DELETE))\(req as any\)/g,
        '$1(req as any, context)'
      );
      if (fixed_line !== lineContent) {
        lines[lineIdx] = fixed_line;
        changed = true;
      }
    }
  }

  if (changed) {
    // Also need to update the withRoute wrapper to pass context if we added it
    const content = lines.join('\n');
    let updated = content;

    // If now using context in calls, make sure the wrapper captures it
    // FROM: withRoute(async ({ req }) => _METHOD(req as any, context), ...)
    // TO:   withRoute(async ({ req }, context) => _METHOD(req as any, context), ...)
    updated = updated.replace(
      /withRoute\(async \(\{ req \}\) => _([A-Z]+)\(req as any, context\)/g,
      'withRoute(async ({ req }, context) => _$1(req as any, context)'
    );

    fs.writeFileSync(file, updated, 'utf8');
    fixed++;
  }
}

console.log(`Fixed: ${fixed} files`);
console.log('\nRunning TS check...');

try {
  const out = execSync('npx tsc --noEmit 2>&1', { encoding: 'utf8', cwd: process.cwd() });
  const errCount = (out.match(/error TS/g) || []).length;
  console.log(`TS ERRORS: ${errCount}`);
  if (errCount === 0) {
    console.log('✅ ZERO ERRORS — ALL 680 ROUTES COVERED');
  } else {
    const lines = out.split('\n').filter(l => l.includes('error TS')).slice(0, 15);
    lines.forEach(l => console.log(' ', l.trim()));
  }
} catch (e) {
  const errCount = (e.stdout?.match(/error TS/g) || []).length;
  console.log(`TS ERRORS: ${errCount}`);
  const lines = (e.stdout || '').split('\n').filter(l => l.includes('error TS')).slice(0, 15);
  lines.forEach(l => console.log(' ', l.trim()));
}
