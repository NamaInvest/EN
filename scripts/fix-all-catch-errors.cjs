/**
 * fix-all-catch-errors.cjs
 * Nuclear approach: find every log.error line that references 'err'
 * inside a bare catch { (no variable), and fix it.
 * 
 * Two fixes:
 * 1. catch { → catch (err: unknown) {  (if the catch body uses 'err')
 * 2. Duplicate take: in object literals
 */
'use strict';
const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function walk(dir, results = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && !['node_modules', '.next', '.git'].includes(e.name)) {
      walk(full, results);
    } else if (e.isFile() && full.endsWith('route.ts')) {
      results.push(full);
    }
  }
  return results;
}

const files = walk(path.join(ROOT, 'src', 'app', 'api'));
let fixed = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Fix 1: bare catch { ... } blocks where the body uses 'err'
  // Use char-by-char to find catch blocks
  let result = '';
  let i = 0;
  while (i < content.length) {
    // Look for: catch followed by optional whitespace and {
    // but NOT catch (something) {
    const rest = content.slice(i);
    const catchBareMatch = rest.match(/^(catch\s*)\{/);
    if (catchBareMatch) {
      // Found a bare catch {
      const catchKeyword = catchBareMatch[1];
      const bracePos = i + catchKeyword.length;

      // Find the end of this catch block
      let depth = 1;
      let j = bracePos + 1;
      while (j < content.length && depth > 0) {
        if (content[j] === '{') depth++;
        else if (content[j] === '}') depth--;
        j++;
      }
      const blockBody = content.slice(bracePos + 1, j - 1);

      // Check if body uses 'err' (from our injection)
      if (/\berr\b/.test(blockBody)) {
        // Add err variable to catch
        result += catchKeyword + '(err: unknown) {';
        i += catchKeyword.length + 1; // skip past {
        continue;
      }
    }
    result += content[i];
    i++;
  }
  content = result;

  // Fix 2: duplicate take: keys  { take: 100, ... take: X
  // Remove the injected take: 100, if there's already another take:
  content = content.replace(/\{\s*take:\s*100,(\s*(?:where|orderBy|select|include|take))/g, '{$1');

  // Fix 3: log lines in bare catch without var that we couldn't fix above
  // (safety net: replace `err instanceof Error ? err.message : err` with safer form)
  content = content.replace(
    /log\.error\(([^,]+),\s*\{\s*error:\s*err instanceof Error \? err\.message : err\s*\}\)/g,
    (match, label) => {
      // This is fine now since we've added (err: unknown) above
      return match;
    }
  );

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    const rel = path.relative(ROOT, file);
    console.log(`  ✅ ${rel}`);
    fixed++;
  }
}

console.log(`\n✅ Fixed ${fixed} files`);
