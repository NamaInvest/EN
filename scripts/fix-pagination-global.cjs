/**
 * fix-pagination-global.cjs
 * Add take:100 to ALL findMany calls that have no take/limit/skip.
 * Runs on all API route files.
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
    } else if (e.isFile() && e.name === 'route.ts') {
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

  // Fix: .findMany() → .findMany({ take: 100 })
  content = content.replace(
    /\.findMany\(\)/g,
    '.findMany({ take: 100 })'
  );

  // Fix: .findMany({ without any take/limit/skip
  // Use a function to check each match
  content = content.replace(
    /\.findMany\??\.?\(\{/g,
    (match, offset) => {
      // Find the closing } of this object
      let depth = 1;
      let i = offset + match.length;
      let body = '';
      while (i < content.length && depth > 0) {
        if (content[i] === '{') depth++;
        else if (content[i] === '}') depth--;
        if (depth > 0) body += content[i];
        i++;
      }
      // Check if already has take/limit/skip
      if (/\b(take|limit|skip)\b/.test(body)) return match;
      // Add take: 100 as first property
      return match.replace('({', '({ take: 100,');
    }
  );

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    const rel = path.relative(ROOT, file);
    fixed++;
    if (fixed <= 20) console.log(`  ✅ ${rel}`);
  }
}

if (fixed > 20) console.log(`  ... and ${fixed - 20} more`);
console.log(`\n✅ Fixed pagination in ${fixed} files`);
