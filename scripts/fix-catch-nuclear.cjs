/**
 * Nuclear fix: find ALL log.error lines with wrong indentation + wrong variable
 * and fix them properly using AST-free line-by-line analysis
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

// Check if a variable name is declared in a sliding window of lines
function findCatchVarInWindow(lines, fromIdx) {
  for (let j = fromIdx; j >= Math.max(0, fromIdx - 15); j--) {
    const l = lines[j];
    // } catch (varName: any) {  or  } catch (varName) {
    const m = l.match(/catch\s*\(\s*(\w+)(?:\s*:\s*\w+)?\s*\)/);
    if (m) return m[1];
    // } catch {  (typeless)
    if (/catch\s*\{/.test(l) && !/catch\s*\(\s*\w/.test(l)) return null;
  }
  return null;
}

const routes = walk(path.join(ROOT, 'src/app/api'), 'route.ts');
let totalFixed = 0;
let filesFixed = 0;

for (const f of routes) {
  const c = fs.readFileSync(f, 'utf8');
  const lines = c.split('\n');
  let changed = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Match any log.error injected by our script (has { message: VAR?.message } pattern)
    const m = line.match(/^(\s*)log\.error\('([^']+)',\s*\{\s*message:\s*(\w+)\?\.message\s*\}\);?$/);
    if (!m) continue;
    
    const [, indent, msg, usedVar] = m;
    
    // Find the actual catch variable in scope
    const actualVar = findCatchVarInWindow(lines, i - 1);
    
    if (actualVar === null) {
      // Typeless catch — remove the error arg
      lines[i] = `${indent}log.error('${msg}');`;
      changed = true;
      totalFixed++;
    } else if (actualVar !== usedVar) {
      // Wrong variable name — fix it
      lines[i] = `${indent}log.error('${msg}', { message: ${actualVar}?.message });`;
      changed = true;
      totalFixed++;
    }
    // else: correct, no change needed
  }
  
  if (changed) {
    fs.writeFileSync(f, lines.join('\n'), 'utf8');
    filesFixed++;
  }
}

console.log(`Fixed ${totalFixed} wrong catch references in ${filesFixed} files.`);
