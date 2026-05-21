import fs from 'fs';
import path from 'path';

function findFiles(dir: string, extension: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findFiles(filePath, extension, fileList);
    } else if (file.endsWith(extension)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function auditRoute(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').length;
  const hasPrismaDirect = content.includes('prisma.') || content.includes('prisma$') || content.includes('ctx.prisma.');
  const hasServiceCall = content.includes('.service') || content.includes('Service.');
  
  // Basic heuristic for line counts indicating thick routes
  const isFatRoute = lines > 50 && hasPrismaDirect && !hasServiceCall;

  return {
    path: filePath,
    lines,
    hasPrismaDirect,
    hasServiceCall,
    isFatRoute
  };
}

function runAudit() {
  const apiDir = path.join(process.cwd(), 'src/app/api');
  
  if (!fs.existsSync(apiDir)) {
    console.error('API directory not found.');
    return;
  }

  const routes = findFiles(apiDir, 'route.ts');
  const auditResults = routes.map(auditRoute);

  let csvContent = 'Path,Lines,HasPrismaDirect,HasServiceCall,NeedsRefactor\n';
  auditResults.forEach(res => {
    csvContent += `"${res.path}",${res.lines},${res.hasPrismaDirect},${res.hasServiceCall},${res.isFatRoute}\n`;
  });

  const tmpDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir);
  }

  const outputPath = path.join(tmpDir, 'thin-routes-audit.csv');
  fs.writeFileSync(outputPath, csvContent);

  console.log(`Audited ${routes.length} routes.`);
  console.log(`Results saved to ${outputPath}`);
  
  const fatRoutes = auditResults.filter(r => r.isFatRoute).length;
  console.log(`Identified ${fatRoutes} fat routes requiring refactoring.`);
}

runAudit();
