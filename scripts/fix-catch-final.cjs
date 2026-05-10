/**
 * Final fix: any remaining log.error lines with wrong variable reference
 * Strategy: find ALL log.error lines injected with { message: VAR?.message }
 * where VAR doesn't exist in scope → replace with just log.error('msg') no variable
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

  const lines = c.split('\n');
  const newLines = [];
  
  // Track all variable names that are in scope at each catch
  // Simple approach: scan backwards from a log.error line to find nearest catch
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for injected log.error with { message: VAR?.message }
    const errVarMatch = line.match(/log\.error\([^,]+,\s*\{\s*message:\s*(\w+)\?\.message\s*\}\)/);
    if (errVarMatch) {
      const usedVar = errVarMatch[1]; // e.g. 'e', 'err', 'error'
      
      // Look backwards to find the enclosing catch
      let foundCatchVar = null;
      for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
        const catchMatch = lines[j].match(/\}\s*catch\s*\((\w+)(?::\s*any)?\)/);
        if (catchMatch) {
          foundCatchVar = catchMatch[1];
          break;
        }
        // typeless catch
        if (lines[j].match(/\}\s*catch\s*\{/)) {
          foundCatchVar = '__typeless__';
          break;
        }
      }
      
      if (foundCatchVar === '__typeless__') {
        // Remove the { message: VAR?.message } part — var doesn't exist
        const fixedLine = line.replace(/, \{ message: \w+\?\.message \}/, '');
        newLines.push(fixedLine);
        fixed++;
        continue;
      } else if (foundCatchVar && foundCatchVar !== usedVar) {
        // Wrong variable name — fix it
        const fixedLine = line.replace(`${usedVar}?.message`, `${foundCatchVar}?.message`);
        newLines.push(fixedLine);
        fixed++;
        continue;
      }
    }
    
    newLines.push(line);
  }
  
  const result = newLines.join('\n');
  if (result !== before) {
    fs.writeFileSync(f, result, 'utf8');
    fixedFiles++;
  }
}

console.log(`Fixed ${fixed} remaining catch variable issues in ${fixedFiles} files.`);
