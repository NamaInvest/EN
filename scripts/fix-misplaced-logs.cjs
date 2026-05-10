/**
 * DEFINITIVE FIX: Remove misplaced log.error injections
 * 
 * Problem: inject-catch-logging.cjs injected log.error lines inside
 * `if` blocks or other non-catch contexts.
 * 
 * Strategy: Remove ANY injected log.error line that:
 * 1. Has the pattern: log.error('[path] error', { message: VAR?.message })
 * 2. Is NOT inside a catch block (look at context)
 * 
 * Simpler approach: just check if the log.error line is directly inside
 * a catch by looking at the NEXT line (which should be `return NextResponse`)
 * AND that there's a catch within 5 lines ABOVE.
 */
const fs   = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

function walk(dir, ext, results = []) {
  try {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, f.name);
      if (f.isDirectory() && !f.name.startsWith('.') && f.name !== 'node_modules') walk(full, ext, results);
      else if (f.name.endsWith(ext)) results.push(full);
    }
  } catch (_) {}
  return results;
}

function hasNearbyOpenCatch(lines, idx) {
  // Check if there's an open catch block within 8 lines above
  // without a closing } in between
  let braceDepth = 0;
  for (let j = idx - 1; j >= Math.max(0, idx - 8); j--) {
    const l = lines[j].trim();
    // Count braces (reversed)
    for (const ch of [...l].reverse()) {
      if (ch === '}') braceDepth++;
      if (ch === '{') {
        braceDepth--;
        if (braceDepth < 0) {
          // We hit an opening brace — is this line a catch?
          if (/catch\s*(\(|\{)/.test(lines[j])) return true;
        }
      }
    }
  }
  return false;
}

const routes = walk(path.join(ROOT, 'src/app/api'), 'route.ts');
let removed = 0;
let filesFixed = 0;

for (const f of routes) {
  const c = fs.readFileSync(f, 'utf8');
  const lines = c.split('\n');
  const newLines = [];
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect injected log.error pattern (our signature)
    if (/log\.error\('\[.+?\] error',/.test(line)) {
      // Check if it's properly inside a catch block
      const inCatch = hasNearbyOpenCatch(lines, i);
      
      if (!inCatch) {
        // This was misplaced — remove it
        removed++;
        changed = true;
        continue; // skip this line
      }
    }

    newLines.push(line);
  }

  if (changed) {
    fs.writeFileSync(f, newLines.join('\n'), 'utf8');
    filesFixed++;
  }
}

console.log(`Removed ${removed} misplaced log.error injections from ${filesFixed} files.`);
