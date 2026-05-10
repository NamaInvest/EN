/**
 * Fix: catch-logging script injected `e.message` into typeless catches `} catch {`
 * This causes TS2304: "Cannot find name 'e'"
 * Fix: change them to `} catch (e: any) {` OR remove the e.message reference
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

const routes = walk(path.join(ROOT, 'src/app/api'), 'route.ts');
let fixed = 0;

for (const f of routes) {
  let c = fs.readFileSync(f, 'utf8');
  const before = c;

  // Pattern 1: `} catch {` (no variable) followed by log.error with e?.message
  // → Replace with `} catch (e: any) {` to give the variable a name
  c = c.replace(/\} catch \{\n(\s+)log\.error\(([^,]+), \{ message: e\?\.message \}\);/g,
    '} catch (e: any) {\n$1log.error($2, { message: e?.message });'
  );

  // Pattern 2: Also fix anonymous `} catch {` anywhere it now has `e?.message`
  // More aggressive: any `} catch {` that's followed by code using `e`
  c = c.replace(/\} catch \{(\n[^\n]*e\??\.\w+)/g, '} catch (e: any) {$1');

  // Pattern 3: log.error injected into typeless catch with `e?.message`
  // using a simple string replace
  if (c !== before) {
    fs.writeFileSync(f, c, 'utf8');
    fixed++;
  }
}

console.log(`Fixed ${fixed} typeless catch blocks.`);
