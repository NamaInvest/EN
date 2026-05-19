const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const dirsToScan = [
  path.join(projectRoot, 'src', 'app'),
  path.join(projectRoot, 'src', 'components'),
];

let stats = {
  totalFiles: 0,
  hugePages: [],
  legacyUI: [],
  inlineStylesCount: 0,
  useEffectAntiPatterns: [],
  hardcodedUrls: [],
  missingRTL: [],
  totalLines: 0
};

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!['api', 'node_modules', '.git'].includes(file)) {
        scanDir(fullPath);
      }
    } else if (/\.(tsx|jsx|ts)$/.test(file)) {
      scanFile(fullPath);
    }
  }
}

function scanFile(filePath) {
  stats.totalFiles++;
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const linesCount = lines.length;
  stats.totalLines += linesCount;
  
  const relPath = path.relative(projectRoot, filePath);
  
  if (linesCount > 500 && relPath.includes('page.tsx')) {
    stats.hugePages.push({ path: relPath, size: linesCount });
  }

  if (content.match(/style=\{\{.*\}\}/g)) {
    stats.inlineStylesCount++;
  }

  if (content.split('useEffect').length > 3) {
    stats.useEffectAntiPatterns.push(relPath);
  }

  if (content.match(/\b(float-left|float-right|text-left|text-right|ml-|mr-|pl-|pr-)\b/g)) {
    stats.missingRTL.push(relPath);
  }
}

dirsToScan.forEach(scanDir);
stats.hugePages.sort((a, b) => b.size - a.size);

const mdReport = `
# UI/UX Modernization Audit
**Total Scanned Files:** ${stats.totalFiles}
**Total Lines:** ${stats.totalLines}

## 1. Monolithic Pages (Needs Component Splitting & Lazy Loading)
${stats.hugePages.slice(0, 15).map(f => `- **${f.path}** (${f.size} lines)`).join('\n')}

## 2. RTL Unfriendly Components (Hardcoded LTR classes)
${stats.missingRTL.slice(0, 15).map(f => `- ${f}`).join('\n')}
*(Total files with missing RTL support: ${stats.missingRTL.length})*

## 3. Inline Styles Detected
Files using \`style={{...}}\` instead of Tailwind classes: ${stats.inlineStylesCount}

## 4. Performance: Heavy useEffect loops
${stats.useEffectAntiPatterns.slice(0, 15).map(f => `- ${f}`).join('\n')}

## Modernization Plan Recommendation
### Phase A: Core Shared Components Cleanup
### Phase B: Dashboard & Layout Modernization
### Phase C: Forms & Tables Standardization
### Phase D: Data Fetching / State Cleanup
### Phase E: Performance Optimization
### Phase F: Accessibility + RTL + Responsive Fixes
`;

const csvReport = `FilePath,IssueType,Severity,Metric
${stats.hugePages.slice(0, 50).map(f => `${f.path},HugeComponent,High,${f.size}`).join('\n')}
${stats.missingRTL.slice(0, 30).map(f => `${f},RTLBreakage,Medium,0`).join('\n')}
`;

fs.writeFileSync(path.join(projectRoot, 'tmp', 'ui-modernization-report.md'), mdReport);
fs.writeFileSync(path.join(projectRoot, 'tmp', 'ui-modernization-report.csv'), csvReport);

console.log('UI SCAN COMPLETED');
console.log('Huge Pages:', stats.hugePages.length);
console.log('Missing RTL:', stats.missingRTL.length);
