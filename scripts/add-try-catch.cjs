/**
 * Auto-wrap route handlers that have Prisma calls but no try/catch
 * Strategy: for each exported async function, wrap body in try/catch
 * if there's no existing try/catch
 */
const fs   = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

// Target routes
const TARGETS = [
  'src/app/api/accounting/books/route.ts',
  'src/app/api/accounting/coa/reset-to-socpa/route.ts',
  'src/app/api/accounting/open-items/route.ts',
  'src/app/api/accounting/trial-balance/route.ts',
  'src/app/api/accounting/year-end-close/route.ts',
  'src/app/api/admin/backups/route.ts',
  'src/app/api/approvals/[id]/approve/route.ts',
  'src/app/api/approvals/[id]/reject/route.ts',
  'src/app/api/ar/dunning/route.ts',
  'src/app/api/assets/leases/post-monthly/route.ts',
  'src/app/api/auth/me/route.ts',
  'src/app/api/enterprise/mrp/route.ts',
  'src/app/api/payroll/provisions/run/route.ts',
  'src/app/api/pharmacy/drug-interactions/route.ts',
  'src/app/api/pharmacy/drugs/route.ts',
  'src/app/api/pharmacy/insurance/route.ts',
  'src/app/api/pharmacy/patients/route.ts',
  'src/app/api/sales/commissions/run/route.ts',
  'src/app/api/settings/api-keys/route.ts',
  'src/app/api/settings/api-keys/[id]/route.ts',
  'src/app/api/treasury/recon-exceptions/route.ts',
  'src/app/api/webhooks/route.ts',
  'src/app/api/webhooks/[id]/rotate-secret/route.ts',
  'src/app/api/webhooks/[id]/route.ts',
];

function wrapHandlerFunctions(content, filePath) {
  const rel = filePath.replace(ROOT, '').replace(/\\/g, '/');
  
  // Skip if already has try/catch
  if (content.includes('try {') || content.includes('try{')) return null;

  // Wrap each exported async function body
  // Pattern: export async function GET/POST/PUT/PATCH/DELETE(req) { ... }
  // We add a top-level try/catch wrapping the entire body
  
  const lines = content.split('\n');
  const result = [];
  let i = 0;
  let changed = false;

  while (i < lines.length) {
    const line = lines[i];
    
    // Match: export async function GET/POST/PUT/PATCH/DELETE
    const fnMatch = line.match(/^export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(/);
    
    if (fnMatch) {
      // Find the opening brace of the function body
      let braceStart = i;
      let bracePos = -1;
      while (braceStart < lines.length && bracePos === -1) {
        const idx = lines[braceStart].indexOf('{');
        if (idx !== -1) bracePos = idx;
        else braceStart++;
      }
      
      if (bracePos !== -1) {
        // Collect function until matching closing brace
        result.push(line);
        i++;
        
        // Find opening brace line
        while (i <= braceStart) {
          result.push(lines[i]);
          i++;
        }
        
        // We're now past the opening brace of the function
        // Find matching closing brace
        let depth = 0;
        const funcBodyLines = [];
        // Count braces in lines collected so far
        for (const prev of result.slice(-(braceStart - lines.indexOf(line) + 2))) {
          for (const ch of prev) {
            if (ch === '{') depth++;
            else if (ch === '}') depth--;
          }
        }
        
        // Collect function body
        while (i < lines.length) {
          const l = lines[i];
          funcBodyLines.push(l);
          for (const ch of l) {
            if (ch === '{') depth++;
            else if (ch === '}') depth--;
          }
          i++;
          if (depth <= 0) break;
        }
        
        // The last line closes the function
        const bodyLines = funcBodyLines.slice(0, -1);
        const closingLine = funcBodyLines[funcBodyLines.length - 1];
        
        // Check if body already has try (rare case)
        const bodyStr = bodyLines.join('\n');
        if (bodyStr.includes('try {') || bodyStr.includes('try{')) {
          result.push(...funcBodyLines);
          changed = false;
          continue;
        }
        
        // Wrap body in try/catch
        const indent = '  ';
        result.push(`${indent}try {`);
        for (const bl of bodyLines) {
          result.push(`  ${bl}`);
        }
        result.push(`${indent}} catch (err: any) {`);
        result.push(`${indent}  log.error('${fnMatch[1]} error', { message: err.message, code: err.code });`);
        result.push(`${indent}  return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 });`);
        result.push(`${indent}}`);
        result.push(closingLine);
        changed = true;
        continue;
      }
    }
    
    result.push(line);
    i++;
  }
  
  return changed ? result.join('\n') : null;
}

// Also fix duplicate logger imports
function fixDuplicateLogger(content) {
  const IMPORT_LINE = `import { logger } from '@/lib/logger';`;
  const count = content.split(IMPORT_LINE).length - 1;
  if (count <= 1) return content;
  
  // Remove all but first occurrence + its const log
  let first = true;
  const lines = content.split('\n');
  const cleaned = [];
  let logDeclCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.trim() === IMPORT_LINE) {
      if (first) { cleaned.push(l); first = false; }
      // else skip duplicate
      continue;
    }
    if (l.trim().startsWith('const log = logger.child(')) {
      logDeclCount++;
      if (logDeclCount > 1) continue;
    }
    cleaned.push(l);
  }
  return cleaned.join('\n');
}

let fixed = 0;
for (const rel of TARGETS) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) {
    console.log('  SKIP (not found):', rel);
    continue;
  }
  
  let c = fs.readFileSync(full, 'utf8');
  
  // Fix duplicate logger first
  const deduped = fixDuplicateLogger(c);
  if (deduped !== c) {
    c = deduped;
    console.log('  DEDUPED:', rel);
  }
  
  // Add NextResponse import if missing  
  if (!c.includes('NextResponse') && !c.includes("from 'next/server'")) {
    c = `import { NextResponse } from 'next/server';\n` + c;
  }
  
  // Ensure log is declared if it uses try/catch injection
  if (!c.includes('const log =') && !c.includes("from './logger'")) {
    // Already has logger import but no log var — skip try/catch wrap (too risky)
    fs.writeFileSync(full, c, 'utf8');
    continue;
  }
  
  // Try to wrap
  const wrapped = wrapHandlerFunctions(c, full);
  if (wrapped) {
    fs.writeFileSync(full, wrapped, 'utf8');
    console.log('  WRAPPED:', rel);
    fixed++;
  } else {
    // Just save deduped version
    fs.writeFileSync(full, c, 'utf8');
  }
}

console.log(`\nWrapped ${fixed} routes with try/catch.`);
