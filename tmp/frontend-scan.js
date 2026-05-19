const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const dirsToScan = [
  path.join(projectRoot, 'src', 'app'),
  path.join(projectRoot, 'src', 'components'),
  path.join(projectRoot, 'src', 'hooks'),
  path.join(projectRoot, 'src', 'ui')
];

let stats = {
  totalFiles: 0,
  hugePages: [],
  legacyUI: [],
  inlineStylesCount: 0,
  useEffectAntiPatterns: [],
  unprotectedFetch: [],
  hardcodedUrls: [],
  missingRTL: [],
  dangerouslySetInnerHTML: [],
  duplicateComponents: [],
  totalLines: 0
};

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (file !== 'api' && file !== 'node_modules' && file !== '.git') {
        scanDir(fullPath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx') || file.endsWith('.ts')) {
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
  
  if (linesCount > 500) {
    stats.hugePages.push({ path: relPath, size: linesCount });
  }

  if (content.match(/style=\{\{.*\}\}/g)) {
    stats.inlineStylesCount++;
  }

  if (content.includes('dangerouslySetInnerHTML')) {
    stats.dangerouslySetInnerHTML.push(relPath);
  }
  
  if (content.match(/fetch\(['"`]http/)) {
    stats.hardcodedUrls.push(relPath);
  }

  // Look for fetches without auth headers or standard api util
  if (content.includes('fetch(') && !content.includes('Authorization') && !content.includes('apiClient')) {
    stats.unprotectedFetch.push(relPath);
  }
  
  // Look for inline business logic / heavy data manipulation in components
  if (content.match(/useEffect\(\s*\(\)\s*=>\s*\{[\s\S]*fetch/g) && content.split('useEffect').length > 3) {
    stats.useEffectAntiPatterns.push(relPath);
  }

  // Look for direct legacy classnames (float-left, text-left instead of ltr/rtl agnostic)
  if (content.includes('float-left') || content.includes('float-right') || content.includes('text-left') || content.includes('text-right')) {
    stats.missingRTL.push(relPath);
  }
  
  if (content.includes('class="') || (content.includes('var ') && !content.includes('export var'))) {
    stats.legacyUI.push(relPath);
  }
}

dirsToScan.forEach(scanDir);

stats.hugePages.sort((a, b) => b.size - a.size);

const mdReport = `
# Frontend Legacy & UI Modernization Audit
**Total Files Scanned:** ${stats.totalFiles}
**Total Lines of Code:** ${stats.totalLines}

## 1. UX / Architecture Problems (Huge Pages)
*Files > 500 lines. These represent monolithic components mixing UI, state, and business logic.*
${stats.hugePages.slice(0, 15).map(f => `- **${f.path}** (${f.size} lines)`).join('\n')}

## 2. Legacy UI Patterns & RTL Issues
*Files with hardcoded left/right alignments instead of start/end (Breaks RTL).*
${stats.missingRTL.slice(0, 15).map(f => `- ${f}`).join('\n')}
*Total files with inline styles: ${stats.inlineStylesCount}*

## 3. Security & Governance Issues
*DangerouslySetInnerHTML used:*
${stats.dangerouslySetInnerHTML.map(f => `- ${f}`).join('\n')}

*Hardcoded URLs / Unprotected Fetches:*
${stats.hardcodedUrls.slice(0, 10).map(f => `- ${f}`).join('\n')}
${stats.unprotectedFetch.slice(0, 10).map(f => `- ${f}`).join('\n')}

## 4. Performance & State Anti-Patterns
*Excessive or heavy useEffect loops:*
${stats.useEffectAntiPatterns.slice(0, 10).map(f => `- ${f}`).join('\n')}

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
${stats.dangerouslySetInnerHTML.map(f => `${f},SecurityDangerouslySetInnerHtml,Critical,0`).join('\n')}
${stats.unprotectedFetch.slice(0, 30).map(f => `${f},SecurityUnprotectedFetch,Medium,0`).join('\n')}
${stats.missingRTL.slice(0, 30).map(f => `${f},RTLBreakage,Low,0`).join('\n')}
`;

fs.writeFileSync(path.join(projectRoot, 'tmp', 'frontend-legacy-audit.md'), mdReport);
fs.writeFileSync(path.join(projectRoot, 'tmp', 'frontend-legacy-audit.csv'), csvReport);

console.log('SCAN COMPLETED');
console.log('Files scanned: ' + stats.totalFiles);
console.log('Issues found: ' + (stats.hugePages.length + stats.unprotectedFetch.length + stats.missingRTL.length + stats.dangerouslySetInnerHTML.length));
