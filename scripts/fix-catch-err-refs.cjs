/**
 * fix-catch-err-refs.cjs
 * Fix TS errors introduced by fix-silent-catches-safe.cjs:
 * 1. Catch blocks using bare `catch {` but injected log references `err`
 * 2. grn route duplicate 'take' key
 */
'use strict';
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

// Get all TS error files from tsc output
const tscOut = execSync('npx tsc --noEmit 2>&1', { cwd: ROOT, encoding: 'utf8' });
const errorFiles = new Set();
const errorPattern = /^(src[/\\][^\(]+\.ts)\((\d+),\d+\): error/gm;
let m;
while ((m = errorPattern.exec(tscOut)) !== null) {
  errorFiles.add(m[1].replace(/\\/g, '/'));
}

console.log(`Found ${errorFiles.size} files with TS errors`);
let fixed = 0;

for (const rel of errorFiles) {
  const file = path.join(ROOT, rel.replace(/\//g, path.sep));
  if (!fs.existsSync(file)) continue;

  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Fix 1: `catch {` followed by log...err → change catch { to catch (err: unknown) {
  // Pattern: catch { \n   log.error(...err...)
  content = content.replace(
    /catch\s*\{\n(\s*log\.error\([^)]*\berr\b[^)]*\);)/g,
    'catch (err: unknown) {\n$1'
  );

  // Fix 2: duplicate 'take:' key in object literal (from pagination injection on already-having-take)
  // Pattern: { take: 100, take: X, → { take: X,
  content = content.replace(
    /\{\s*take:\s*100,(\s*take:\s*\d+,)/g,
    '{$1'
  );

  // Fix 3: Any remaining `log.error(...err...)` where err is not in scope
  // Change log.error('...', { error: err instanceof Error ? err.message : err })
  // to log.error('...', { error: 'Unknown error' })
  // Only for lines in bare catch blocks (heuristic: line with log.error where prev catch has no var)
  const lines = content.split('\n');
  const newLines = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Find log.error lines that reference `err` but we can check if the preceding catch has a var
    if (line.includes('log.error') && line.includes('err instanceof Error')) {
      // Look back for the catch line
      let catchLine = '';
      for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
        if (lines[j].includes('catch')) { catchLine = lines[j]; break; }
      }
      // If catch has no variable: catch { or catch() {
      if (/catch\s*\{/.test(catchLine) || /catch\s*\(\s*\)/.test(catchLine)) {
        // Replace err reference with safe alternative
        newLines.push(line
          .replace(/err instanceof Error \? err\.message : err/g, '"Unknown error"')
        );
        continue;
      }
    }
    newLines.push(line);
  }
  content = newLines.join('\n');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`  ✅ Fixed: ${rel}`);
    fixed++;
  }
}

console.log(`\n✅ Fixed ${fixed} files`);
