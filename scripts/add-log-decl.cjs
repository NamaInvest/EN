const fs = require('fs');
const files = ['src/lib/ab-testing.ts', 'src/lib/api-handler.ts', 'src/lib/mcp-bridge.ts'];

for (const f of files) {
  let c = fs.readFileSync(f, 'utf8');
  if (!c.includes('const log =')) {
    const svc = f.replace('src/lib/', '').replace('.ts', '');
    // Add const log after the logger import line (from './logger')
    c = c.replace(
      /import \{ logger \} from ['"]\.\.?\/.*?logger['"]/,
      m => m + ';\n\nconst log = logger.child({ service: ' + JSON.stringify(svc) + ' })'
    );
    // Remove extra semicolons if we doubled it
    c = c.replace(/logger['"];\n\nconst log/g, 'logger\';\n\nconst log');
    fs.writeFileSync(f, c, 'utf8');
    console.log('  fixed:', f);
  } else {
    console.log('  already has log:', f);
  }
}
console.log('Done!');
