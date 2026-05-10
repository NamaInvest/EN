/**
 * Fix: injection script used wrong variable name 'e' for catches that use 'error' or 'err'
 * Pattern: } catch (error: any) { log.error('...', { message: e?.message }) 
 * → Fix: replace e?.message with error?.message (or err?.message)
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
let fixedFiles = 0;

for (const f of routes) {
  let c = fs.readFileSync(f, 'utf8');
  const before = c;

  // Strategy: find each catch block and determine the correct variable name
  // Then fix any log.error(..., { message: e?.message }) that uses wrong var
  
  const lines = c.split('\n');
  const newLines = [];
  let catchVarName = 'e'; // default

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Track catch variable name
    const catchMatch = line.match(/\}\s*catch\s*\((\w+)(?::\s*\w+)?\)/);
    if (catchMatch) {
      catchVarName = catchMatch[1]; // 'e', 'error', 'err', etc.
    }
    
    // Fix wrong variable reference in log.error
    // Pattern: { message: e?.message } but actual var is 'error' or 'err'
    if (line.includes('{ message: e?.message }') && catchVarName !== 'e') {
      const fixed_line = line.replace('e?.message', `${catchVarName}?.message`);
      newLines.push(fixed_line);
      fixed++;
      continue;
    }
    
    newLines.push(line);
  }

  const result = newLines.join('\n');
  if (result !== before) {
    fs.writeFileSync(f, result, 'utf8');
    fixedFiles++;
  }
}

console.log(`Fixed ${fixed} wrong variable references in ${fixedFiles} files.`);
