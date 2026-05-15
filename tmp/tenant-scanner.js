const fs = require('fs');
const path = require('path');

function getFiles(dir, filesList = []) {
  if (!fs.existsSync(dir)) return filesList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, filesList);
    } else {
      if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        filesList.push(filePath);
      }
    }
  }
  return filesList;
}

const allFiles = [...getFiles('src/app/api'), ...getFiles('src/lib')];
const missing = [];

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('.findMany(') || content.includes('.updateMany(') || 
      content.includes('.deleteMany(') || content.includes('.aggregate(') || 
      content.includes('.groupBy(')) {
    
    // Simplistic check: if the file has these operations but doesn't mention tenantId
    if (!content.includes('tenantId')) {
        missing.push(file.replace(process.cwd() + '\\', '').replace(process.cwd() + '/', ''));
    }
  }
}

let report = `# Tenant Isolation Enforcement Report\n\n`;
report += `## Tenant Guard\n`;
report += `Created \`src/lib/security/tenant-guard.ts\` with strict assertion utilities.\n\n`;
report += `## Missing Tenant Boundaries\n`;
report += `Found ${missing.length} files that execute multiple-record queries without explicit \`tenantId\` references:\n`;
missing.forEach(f => report += `- ${f}\n`);

fs.writeFileSync('tmp/tenant-isolation-report.md', report, 'utf8');
console.log('Report generated.');
