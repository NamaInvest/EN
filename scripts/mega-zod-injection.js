/**
 * mega-zod-injection.js
 * ===========================================================
 * Injects inline Zod schema + safeParse validation into every
 * POST/PUT/PATCH route that:
 *   1. Has no existing .safeParse or .parse() call
 *   2. Reads req.json() / request.json()
 *   3. Has at least one body field access (body.X)
 *
 * Strategy: Detect what fields the handler reads from body,
 * build a permissive z.object() schema (all optional),
 * and add safeParse guard before the body is used.
 *
 * SAFE: Only adds validation — never removes existing logic.
 * ===========================================================
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

// Extract body fields accessed as body.X or body['X'] or { X } = body
function extractBodyFields(funcBody) {
  const fields = new Set();
  // body.fieldName
  for (const m of funcBody.matchAll(/\bbody\.([a-zA-Z_][a-zA-Z0-9_]*)/g)) {
    if (!['then', 'catch', 'finally', 'toString', 'hasOwnProperty'].includes(m[1])) {
      fields.add(m[1]);
    }
  }
  // const { field1, field2 } = body
  for (const m of funcBody.matchAll(/(?:const|let|var)\s*\{([^}]+)\}\s*=\s*(?:body|data|input|raw|payload)/g)) {
    for (const f of m[1].split(',')) {
      const name = f.trim().split(':')[0].trim().replace(/\s*=.*$/, '').trim();
      if (name && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) fields.add(name);
    }
  }
  return [...fields];
}

// Map field names to Zod types heuristically
function inferZodType(name) {
  const n = name.toLowerCase();
  if (/id$/.test(n) && n !== 'id') return 'z.union([z.string(), z.number()]).optional()';
  if (n === 'id') return 'z.union([z.string(), z.number()]).optional()';
  if (/amount|price|cost|total|subtotal|tax|discount|salary|qty|quantity|rate/.test(n)) return 'z.number().optional()';
  if (/date|time|start|end|from|to/.test(n) && /date|at$/.test(n)) return 'z.string().optional()';
  if (/is[A-Z]|has[A-Z]|active|enabled|disabled|default/.test(n)) return 'z.boolean().optional()';
  if (/items|list|details|lines|tags|ids|array/.test(n)) return 'z.array(z.any()).optional()';
  if (/month|year|day/.test(n)) return 'z.union([z.string(), z.number()]).optional()';
  if (/email/.test(n)) return 'z.string().email().optional()';
  if (/phone|mobile|tel/.test(n)) return 'z.string().optional()';
  if (/password|secret/.test(n)) return 'z.string().min(1).optional()';
  return 'z.any().optional()';
}

const routes = walk('src/app/api');
let patched = 0, skipped = 0;
const METHODS = ['POST', 'PUT', 'PATCH'];

for (const filePath of routes) {
  let content = fs.readFileSync(filePath, 'utf8');
  const orig  = content;

  // Skip if already has proper Zod validation
  if (content.includes('.safeParse(') || content.includes('Schema.parse(') || content.includes('validateRequest(')) {
    skipped++;
    continue;
  }

  // Skip if no json() body reading
  if (!content.includes('.json()')) { skipped++; continue; }

  // Must have POST/PUT/PATCH  
  const hasMethod = METHODS.some(m => 
    content.includes(`export const ${m}`) || content.includes(`async function _${m}`)
  );
  if (!hasMethod) { skipped++; continue; }

  // Find the POST/PUT handler body
  // Look for: async function _POST(...) { ... }
  // Extract body between first { after function decl and matching }
  let added = false;

  for (const method of METHODS) {
    const funcPattern = new RegExp(
      `(async function _${method}\\([^)]*\\)\\s*\\{[\\s\\S]*?)` +
      `(const (?:body|rawBody|data|input)\\s*=\\s*await (?:req|request)\\.json\\(\\)(?:\\.catch\\(\\(\\)\\s*=>\\s*\\(\\{\\}\\)\\))?;)`,
      'g'
    );

    let match;
    while ((match = funcPattern.exec(content)) !== null) {
      const beforeJson = match[1];
      const jsonLine   = match[2];
      
      // Extract what comes after the json() call (up to ~200 chars to find field accesses)
      const afterIdx  = match.index + match[0].length;
      const afterChunk = content.slice(afterIdx, afterIdx + 800);

      // Get the variable name (body/rawBody/data etc)
      const varNameM = jsonLine.match(/const\s+(\w+)\s*=/);
      const varName  = varNameM ? varNameM[1] : 'body';

      // Extract fields from the after-chunk
      const fieldAccesses = new Set();
      for (const m of afterChunk.matchAll(new RegExp(`\\b${varName}\\.([a-zA-Z_][a-zA-Z0-9_]*)`, 'g'))) {
        if (!['then', 'catch', 'finally', 'toString'].includes(m[1])) fieldAccesses.add(m[1]);
      }
      // Destructuring: const { field } = body
      for (const m of afterChunk.matchAll(new RegExp(`(?:const|let)\\s*\\{([^}]+)\\}\\s*=\\s*${varName}`, 'g'))) {
        for (const f of m[1].split(',')) {
          const name = f.trim().split(':')[0].trim().replace(/\s*=.*$/, '').trim();
          if (name && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) fieldAccesses.add(name);
        }
      }

      if (fieldAccesses.size === 0) continue;

      const schemaName = `_${method}Schema`;
      
      // Build schema
      const lines = [...fieldAccesses].map(f => `  ${f}: ${inferZodType(f)},`).join('\n');
      const schemaStr = `\nconst ${schemaName} = z.object({\n${lines}\n}).passthrough();\n`;

      // Build safeParse guard (insert after json line)
      const guardStr = `\n        const _parsed = ${schemaName}.safeParse(${varName});\n        if (!_parsed.success) {\n          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });\n        }\n`;

      // Check schema not already defined
      if (content.includes(schemaName)) continue;

      // Add z import if missing
      if (!content.includes("from 'zod'") && !content.includes('from "zod"')) {
        // Add after last import line
        const lastImportIdx = content.lastIndexOf('\nimport ');
        if (lastImportIdx !== -1) {
          const lineEnd = content.indexOf('\n', lastImportIdx + 1);
          content = content.slice(0, lineEnd + 1) + "import { z } from 'zod';\n" + content.slice(lineEnd + 1);
        }
      }

      // Add schema before the function
      const funcStart = content.indexOf(`async function _${method}`);
      if (funcStart !== -1) {
        content = content.slice(0, funcStart) + schemaStr + '\n' + content.slice(funcStart);
      }

      // Add safeParse guard after json() line
      const jsonLineIdx = content.indexOf(jsonLine);
      if (jsonLineIdx !== -1) {
        const endOfJsonLine = content.indexOf('\n', jsonLineIdx + jsonLine.length) + 1;
        content = content.slice(0, endOfJsonLine) + guardStr + content.slice(endOfJsonLine);
      }

      added = true;
      break; // one schema per method per file
    }
  }

  if (added && content !== orig) {
    fs.writeFileSync(filePath, content, 'utf8');
    patched++;
  } else {
    skipped++;
  }
}

console.log(`\n=== Mega Zod Injection Results ===`);
console.log(`Patched: ${patched}`);
console.log(`Skipped: ${skipped}`);
console.log(`\nRunning TS check...`);

try {
  const out    = execSync('npx tsc --noEmit 2>&1', { encoding: 'utf8', cwd: process.cwd() });
  const cnt    = (out.match(/error TS/g) || []).length;
  console.log(`TS ERRORS: ${cnt}`);
  if (cnt > 0) {
    out.split('\n').filter(l => l.includes('error TS')).slice(0, 15).forEach(l => console.log(' ', l.trim()));
  } else {
    console.log('✅ ZERO ERRORS — Zod injection successful');
  }
} catch (e) {
  const cnt = (e.stdout?.match(/error TS/g) || []).length;
  console.log(`TS ERRORS: ${cnt}`);
  (e.stdout || '').split('\n').filter(l => l.includes('error TS')).slice(0, 15).forEach(l => console.log(' ', l.trim()));
}
