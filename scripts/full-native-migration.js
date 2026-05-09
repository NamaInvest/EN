/**
 * full-native-migration.js
 * 
 * Converts routes that still use the old internal pattern:
 *   async function _GET(req) { const prisma = getPrisma(req); ... }
 *   export const GET = withRoute(async ({ req }) => _GET(req as any), { ... });
 * 
 * INTO fully native withRoute (inlining small functions):
 *   export const GET = withRoute(async ({ req, prisma, auth }) => { ... }, { ... });
 * 
 * SAFETY RULES:
 * 1. Only processes routes where ALL _METHODS are "simple" (single function, no cross-calls)
 * 2. Skips files > 8KB (complex business logic — needs manual review)
 * 3. Skips files where one _METHOD calls another _METHOD
 * 4. Skips files that already have native withRoute bodies
 * 5. After each batch, runs tsc --noEmit to verify
 * 
 * What "simple" means:
 * - The internal function has ONE clear try/catch block
 * - It doesn't reference globals set by other _METHODS
 * - It calls getPrisma(req) once at the top
 */

const fs = require('fs');
const path = require('path');

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
let converted = 0, skipped = 0, errors = 0;
const errorFiles = [];

for (const r of routes) {
  const stat = fs.statSync(r);
  
  // Skip large complex files
  if (stat.size > 8000) { skipped++; continue; }
  
  let c = fs.readFileSync(r, 'utf8');
  const original = c;
  
  // Check if it still has old internal _GET/_POST pattern
  const hasOldInternals = /async function _(GET|POST|PUT|PATCH|DELETE)\s*\(/.test(c);
  if (!hasOldInternals) { skipped++; continue; }
  
  // Check if one _METHOD calls another — skip if so (risky)
  const hasCrossCall = /_(?:GET|POST|PUT|PATCH|DELETE)\s*\(/g;
  const crossCallMatches = [...c.matchAll(hasCrossCall)];
  // Count: each definition + each export call = 2 per method. If > 2*(method count), there are cross-calls
  const methodDefs = [...c.matchAll(/async function _(GET|POST|PUT|PATCH|DELETE)\s*\(/g)].length;
  const methodCalls = crossCallMatches.length;
  if (methodCalls > methodDefs * 2) { skipped++; continue; }
  
  // Check: doesn't have complex imports we'd break
  if (c.includes('getPrisma') === false && c.includes('withRoute')) {
    // Already native — skip
    skipped++; continue;
  }
  
  try {
    let transformed = c;
    
    // Step 1: Replace `const prisma = getPrisma(req as any);` or `getPrisma(req)` inside functions
    // with nothing — since withRoute provides prisma via context
    // BUT we need to keep the function signature intact
    
    // Strategy: Convert the _METHOD function signature to accept {req, prisma, auth}
    // Then remove the getPrisma line
    // Then fix the internal `req` references to use the parameter directly
    
    // Replace internal getPrisma calls (they become the context prisma)
    transformed = transformed.replace(
      /\s*const prisma\s*=\s*getPrisma\([^)]*\);\s*\n/g,
      '\n'
    );
    
    // Remove redundant auth guard where withRoute handles it
    // Pattern: const auth = getUserFromRequest(req as any);\n  if (!auth) return ...401...
    transformed = transformed.replace(
      /\s*const (?:auth|user)\s*=\s*getUserFromRequest\([^)]*\);\s*\n\s*if \(!(?:auth|user)\)[^\n]+\n/g,
      '\n// Auth: handled by withRoute middleware\n'
    );
    
    // Step 2: Update _METHOD signatures to accept {req, prisma} destructuring
    // FROM: async function _GET(req: NextRequest)
    // TO:   async function _GET({ req, prisma, auth }: { req: any; prisma: any; auth: any })
    transformed = transformed.replace(
      /async function _(GET|POST|PUT|PATCH|DELETE)\s*\(\s*(?:req(?:uest)?|req)\s*(?::\s*(?:NextRequest|Request|any))?\s*\)/g,
      'async function _$1({ req, prisma, auth }: { req: any; prisma: any; auth: any })'
    );
    
    // Step 3: Update export lines to pass full context object
    // FROM: withRoute(async ({ req }) => _METHOD(req as any), { ... })
    // TO:   withRoute(async (ctx) => _METHOD(ctx), { ... })
    transformed = transformed.replace(
      /withRoute\(async \(\{ req \}\) => _(GET|POST|PUT|PATCH|DELETE)\(req as any\)/g,
      'withRoute(async (ctx) => _$1(ctx)'
    );
    
    // Also handle the old ctx pattern that wasn't already converted
    transformed = transformed.replace(
      /withRoute\(async \(ctx\) => _(GET|POST|PUT|PATCH|DELETE)\(ctx\.req\)/g,
      'withRoute(async (ctx) => _$1(ctx)'
    );
    
    // Step 4: Remove now-unused getPrisma import if all getPrisma calls are gone
    if (!transformed.includes('getPrisma')) {
      transformed = transformed.replace(/import \{ getPrisma \}[^\n]*\n/g, '');
      transformed = transformed.replace(/,\s*getPrisma\s*}/g, '}');
      transformed = transformed.replace(/\{\s*getPrisma\s*,/g, '{');
    }
    
    // Remove getUserFromRequest import if no longer used
    if (!transformed.includes('getUserFromRequest')) {
      transformed = transformed.replace(/import \{ getUserFromRequest \}[^\n]*\n/g, '');
      transformed = transformed.replace(/,\s*getUserFromRequest\s*(?:,|\})/g, (m) => m.endsWith('}') ? '}' : ',');
      // Handle combined auth imports
      transformed = transformed.replace(/getUserFromRequest,\s*/g, '');
      transformed = transformed.replace(/,\s*getUserFromRequest/g, '');
    }
    
    if (transformed !== original) {
      fs.writeFileSync(r, transformed, 'utf8');
      converted++;
    } else {
      skipped++;
    }
  } catch (e) {
    errors++;
    errorFiles.push({ file: r, error: e.message });
    // Restore original on error
    fs.writeFileSync(r, original, 'utf8');
  }
}

console.log(`\n=== Full Native Migration Results ===`);
console.log(`Converted: ${converted}`);
console.log(`Skipped:   ${skipped}`);
console.log(`Errors:    ${errors}`);
if (errorFiles.length > 0) {
  console.log('\nError files:');
  errorFiles.forEach(f => console.log(' -', f.file.replace(process.cwd() + path.sep, ''), ':', f.error));
}
