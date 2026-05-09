/**
 * cleanup-routes.js
 * ===========================================================
 * Cleans up API routes by:
 * 1. Removing redundant manual auth guards (replaced by withRoute)
 * 2. Converting console.log → console.error/warn where appropriate
 * 3. Removing dead _guardUser patterns
 * ===========================================================
 */

const fs   = require('fs');
const path = require('path');

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

const routes  = walk('src/app/api');
let cleaned   = 0, skipped = 0;
let removedGuards = 0, convertedLogs = 0;

for (const filePath of routes) {
  let content = fs.readFileSync(filePath, 'utf8');
  const orig  = content;
  let changed = false;

  // 1. Remove _guardUser patterns (added by old migration)
  //    Pattern: const _guardUser = getUserFromRequest(request as any);
  //             if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"})...);
  const guardPattern = /\s*const _guardUser = getUserFromRequest\([^)]+\);\s*\n\s*if \(!_guardUser\) return new Response\(JSON\.stringify\(\{error:"Unauthorized"\}\)[^;]+;\s*\n/g;
  if (guardPattern.test(content)) {
    content = content.replace(guardPattern, '\n');
    changed = true;
    removedGuards++;
  }

  // 2. Remove redundant: const { getUserFromRequest: _getAuth } = require(...)
  //    const _auth = _getAuth(request); if (!_auth) ...
  const requireAuthPattern = /\s*\/\/ Auth guard\s*\n\s*const \{ getUserFromRequest: _getAuth \} = require\('[^']+'\);\s*\n\s*const _auth = _getAuth\(request\);\s*\n\s*if \(!_auth\) return NextResponse\.json\([^;]+;\s*\n/g;
  if (requireAuthPattern.test(content)) {
    content = content.replace(requireAuthPattern, '\n');
    changed = true;
    removedGuards++;
  }

  // 3. Remove: import { getUserFromRequest } from '@/lib/auth'; 
  //    if the file no longer uses getUserFromRequest (only had it for _guardUser)
  //    But only if content doesn't use getUserFromRequest in other ways
  if (!content.includes('getUserFromRequest') && content.includes("import { getUserFromRequest }")) {
    content = content.replace(/\nimport \{ getUserFromRequest(, hasPermission)? \} from '@\/lib\/auth';\n/g, '\n');
    changed = true;
  }

  // 4. Convert console.log in catch blocks → console.error
  //    Pattern: console.log("Error..." or console.log(e) in catch blocks
  const logInCatchPattern = /(\}\s*catch\s*\([^)]+\)\s*\{[^}]*?)console\.log\(/g;
  if (logInCatchPattern.test(content)) {
    content = content.replace(logInCatchPattern, '$1console.error(');
    changed = true;
    convertedLogs++;
  }

  // 5. Clean up multiple blank lines → max 1 blank line
  content = content.replace(/\n{3,}/g, '\n\n');

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    cleaned++;
  } else {
    skipped++;
  }
}

console.log(`\n=== Route Cleanup Results ===`);
console.log(`Files cleaned:     ${cleaned}`);
console.log(`Files skipped:     ${skipped}`);
console.log(`Guards removed:    ${removedGuards}`);
console.log(`Logs converted:    ${convertedLogs}`);
