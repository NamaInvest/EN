/**
 * Dead Button & Missing API Scanner (P4.3)
 * Scans .tsx files for:
 * 1. onClick handlers pointing to console.log/alert/TODO
 * 2. fetch() calls pointing to non-existent API routes
 * 3. Pages with "coming soon" placeholder content
 *
 * Usage: npx tsx scripts/scan-dead-buttons.ts
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');

// ── Get all real API routes ───────────────────────────────────────────────────
function getExistingApiRoutes(): Set<string> {
  const apiDir = path.join(SRC, 'app', 'api');
  const routeFiles = glob.sync('**/route.ts', { cwd: apiDir, absolute: false });

  const routes = new Set<string>();
  for (const f of routeFiles) {
    const route = '/api/' + f
      .replace(/\/route\.ts$/, '')
      .replace(/\[([^\]]+)\]/g, ':$1')
      .replace(/\\/g, '/');
    routes.add(route);
  }
  return routes;
}

// ── Scan TSX files ────────────────────────────────────────────────────────────
interface DeadButton {
  file:    string;
  line:    number;
  type:    'console_log' | 'alert' | 'todo' | 'missing_api' | 'coming_soon';
  content: string;
}

function scanFile(filePath: string, existingRoutes: Set<string>): DeadButton[] {
  const issues: DeadButton[] = [];
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
  const relFile = filePath.replace(ROOT + path.sep, '').replace(/\\/g, '/');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = i + 1;

    // 1. console.log in onClick
    if (/onClick=\{[^}]*console\.log/.test(line)) {
      issues.push({ file: relFile, line: lineNo, type: 'console_log', content: line.trim() });
    }

    // 2. alert() in onClick
    if (/onClick=\{[^}]*alert\(/.test(line)) {
      issues.push({ file: relFile, line: lineNo, type: 'alert', content: line.trim() });
    }

    // 3. TODO in onClick
    if (/onClick.*TODO|TODO.*onClick/.test(line)) {
      issues.push({ file: relFile, line: lineNo, type: 'todo', content: line.trim() });
    }

    // 4. "Coming soon" UI
    if (/قريباً|Coming Soon|coming-soon|under.?construct|تحت التطوير/.test(line)) {
      issues.push({ file: relFile, line: lineNo, type: 'coming_soon', content: line.trim() });
    }

    // 5. fetch() calls to non-existent routes
    const fetchMatch = line.match(/fetch\([`'"](\/api\/[^`'"]+)[`'"]/);
    if (fetchMatch) {
      const fetchedRoute = fetchMatch[1]
        .replace(/\/[0-9]+/g, '/:id')
        .replace(/\$\{[^}]+\}/g, ':id');

      // Check if route exists (exact or with dynamic segment)
      const routeExists = Array.from(existingRoutes).some((r) => {
        const pattern = r.replace(/:[\w]+/g, '[^/]+');
        return new RegExp(`^${pattern}$`).test(fetchedRoute);
      });

      if (!routeExists) {
        issues.push({ file: relFile, line: lineNo, type: 'missing_api', content: `fetch("${fetchedRoute}") — route not found` });
      }
    }
  }

  return issues;
}

// ── Main ──────────────────────────────────────────────────────────────────────
const existingRoutes = getExistingApiRoutes();
console.log(`✅ Found ${existingRoutes.size} API routes\n`);

const tsxFiles = glob.sync('**/*.tsx', { cwd: SRC, absolute: true });
const allIssues: DeadButton[] = [];

for (const f of tsxFiles) {
  const issues = scanFile(f, existingRoutes);
  allIssues.push(...issues);
}

// ── Report ────────────────────────────────────────────────────────────────────
const byType: Record<string, DeadButton[]> = {};
for (const issue of allIssues) {
  byType[issue.type] = byType[issue.type] ?? [];
  byType[issue.type].push(issue);
}

console.log(`🔴 Dead Buttons Report (Total: ${allIssues.length})\n`);
console.log('='.repeat(60));

for (const [type, issues] of Object.entries(byType)) {
  console.log(`\n[${type.toUpperCase()}] — ${issues.length} occurrences:`);
  for (const issue of issues.slice(0, 10)) {
    console.log(`  ${issue.file}:${issue.line}`);
    console.log(`    → ${issue.content.substring(0, 100)}`);
  }
  if (issues.length > 10) console.log(`  ... and ${issues.length - 10} more`);
}

// ── Save report ───────────────────────────────────────────────────────────────
const report = JSON.stringify({ generatedAt: new Date().toISOString(), total: allIssues.length, byType, issues: allIssues }, null, 2);
fs.writeFileSync(path.join(ROOT, 'IMPROVEMENT_PLAN', 'dead-buttons.json'), report);
console.log(`\n✅ Full report saved to IMPROVEMENT_PLAN/dead-buttons.json`);
