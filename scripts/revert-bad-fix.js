/**
 * revert-bad-encoding-fix.js
 * 
 * The batch-fix-routes.js script caused "Unterminated string literal" errors
 * because it was doing regex replacements inside string literals that cut the strings.
 * 
 * This script fixes the damage by finding all routes with TS1002 "Unterminated string"
 * patterns and restoring the corrupted strings.
 */
const fs = require('fs');
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
  } catch (e) {}
  return r;
}

const routes = walk('src/app/api');
let fixed = 0, skipped = 0;

for (const r of routes) {
  let c = fs.readFileSync(r, 'utf8');
  const original = c;

  // Pattern 1: Half-replaced mojibake inside string literals
  // The replacer turned 'طھظ…...' into 'تمت العملية' but left the closing quote dangling
  // Detect: string that starts with Arabic replacement but has dangling Arabic on same line
  
  // Detect lines with unterminated strings (contains unmatched quotes after arabic mix)
  const lines = c.split('\n');
  let hasError = false;
  
  for (const line of lines) {
    // Check for lines with half-replaced Arabic (mixed latin + Arabic mojibake char sequences)
    // Pattern: contains our replacement text followed by remaining garbled chars
    if (line.includes('تمت العملية') && /[طظ]/.test(line)) {
      hasError = true;
      break;
    }
    if (line.includes('فشل التنفيذ') && /[طظ]/.test(line)) {
      hasError = true;
      break;
    }
    if (line.includes('تمت العملية بنجاح') && /[طظ]/.test(line)) {
      hasError = true;
      break;
    }
    if (line.includes('غير مصرح') && /[طظ]/.test(line) && line.includes("'")) {
      hasError = true;
      break;
    }
  }
  
  if (!hasError) { skipped++; continue; }
  
  // Fix: Find lines with partial replacement and fix them properly
  // Strategy: Replace the entire string literal containing the problem with a clean one
  const newLines = lines.map(line => {
    // Fix: 'تمت العملية بنجاح[garbled]' → 'تمت العملية بنجاح'  
    // Replace any string that has our replacement followed by garbled chars, up to next quote
    let fixed = line;
    
    // Pattern: '...تمت العملية...[garbled chars]...' 
    fixed = fixed.replace(/'([^']*(?:تمت العملية|فشل التنفيذ|غير مصرح)[^'طظ]*)(?:[طظ][^\n']*?)('|$)/g, (m, before, after) => {
      const clean = before.replace(/[طظء-ي]/g, '').trim();
      return `'${clean}'`;
    });
    
    // Also fix: lines where the string was cut mid-Arabic
    // 'طھظ... (remaining garbled chars creating unterminated string)
    fixed = fixed.replace(/'[طظء-ي][^'\n]*(?=$|\n)/g, "'تمت العملية'");
    
    return fixed;
  });
  
  const newContent = newLines.join('\n');
  
  if (newContent !== original) {
    fs.writeFileSync(r, newContent, 'utf8');
    fixed++;
    console.log('Fixed:', r.replace(process.cwd() + path.sep, '').replace(/\\/g, '/'));
  } else {
    skipped++;
  }
}

console.log(`\nFixed: ${fixed}, Skipped: ${skipped}`);
