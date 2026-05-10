/**
 * Mass-inject log.error into ALL silent catch blocks in API routes
 * Pattern: } catch (e: any) { ... return NextResponse.json({ error: e.message }, ...)
 * → Adds log.error BEFORE the return if missing
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

  // Skip files that already have log.error everywhere
  const hasSomeLogs = c.includes('log.error') || c.includes('log.warn');
  
  // Pattern 1: } catch (e: any) { \n return NextResponse → no log before return
  // Pattern 2: } catch { \n return NextResponse.json(... 
  let changed = false;

  // Replace: catch (e: any) {\n    return NextResponse.json({ error:
  //      →   catch (e: any) {\n    log.error('...', { message: e.message })\n    return NextResponse
  
  // Only inject if there's no log.error already in the catch
  const catchBlocks = c.split('} catch');
  if (catchBlocks.length <= 1) continue;

  let rebuilt = catchBlocks[0];
  for (let i = 1; i < catchBlocks.length; i++) {
    const block = catchBlocks[i];
    rebuilt += '} catch';

    // Extract the catch clause signature
    // e.g. " (e: any) {\n    return..." or " {\n    return..."
    const hasReturn = block.includes('return NextResponse.json') || block.includes('return new Response');
    const hasLog = block.includes('log.error') || block.includes('log.warn') || block.includes('log.info');

    if (hasReturn && !hasLog) {
      // Determine indentation from next line
      const firstNewline = block.indexOf('\n');
      const nextLine = block.slice(firstNewline + 1);
      const indent = nextLine.match(/^(\s+)/)?.[1] || '    ';

      // Find where the return statement starts
      const returnIdx = block.indexOf('return NextResponse');
      const returnIdx2 = block.indexOf('return new Response');
      const retIdx = Math.min(
        returnIdx  >= 0 ? returnIdx  : Infinity,
        returnIdx2 >= 0 ? returnIdx2 : Infinity,
      );

      if (retIdx < Infinity && retIdx < 300) {
        // Get relative path for log message
        const rel = f.replace(ROOT, '').replace(/\\/g, '/').replace('/src/app/api/', '').replace('/route.ts', '');
        
        // Determine error variable name
        const isTyped = block.startsWith(' (e:') || block.startsWith(' (err:') || block.startsWith(' (error:');
        const errVar = isTyped ? (block.match(/\((e|err|error)/)?.[1] || 'e') : null;
        const errMsg = errVar ? `, { message: ${errVar}?.message }` : '';

        const logLine = `${indent}log.error('[${rel}] error'${errMsg});\n`;
        const newBlock = block.slice(0, retIdx) + logLine + block.slice(retIdx);
        rebuilt += newBlock;
        fixed++;
        changed = true;
        continue;
      }
    }
    rebuilt += block;
  }

  if (changed) {
    // Make sure log is imported and instantiated
    if (!rebuilt.includes("from '@/lib/logger'")) {
      rebuilt = `import { logger } from '@/lib/logger';\n\nconst log = logger.child({ service: 'route' });\n\n` + rebuilt;
    } else if (!rebuilt.includes('const log =')) {
      // Add log child after logger import
      rebuilt = rebuilt.replace(
        "from '@/lib/logger';",
        "from '@/lib/logger';\n\nconst log = logger.child({ service: 'route' });"
      );
    }
    
    fs.writeFileSync(f, rebuilt, 'utf8');
    fixedFiles++;
  }
}

console.log(`Fixed ${fixed} silent catch blocks across ${fixedFiles} route files.`);
