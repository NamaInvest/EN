/**
 * i18n Scanner — finds hardcoded English text in page.tsx files
 * Run: npx tsx scripts/find-untranslated.ts
 *
 * Output: untranslated-strings.json + console report
 */

import { glob } from 'glob';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

interface Issue {
  file:  string;
  line:  number;
  text:  string;
  type:  'jsx-text' | 'string-prop' | 'placeholder';
}

// Patterns that indicate untranslated text
const PATTERNS = [
  // JSX text content: >English Words<
  { regex: />([A-Z][a-zA-Z\s]{3,}[a-z])</g, type: 'jsx-text' as const },
  // String props: title="English" or label="English"
  { regex: /(?:title|label|placeholder|alt|aria-label)="([A-Za-z][a-zA-Z\s]{3,})"/g, type: 'string-prop' as const },
  // Button/link text: >Submit Order< etc.
  { regex: />([A-Z][a-zA-Z\s]+(?:Button|Form|Table|Panel|Modal|Card))</g, type: 'jsx-text' as const },
];

// Allowed English that should NOT be flagged
const ALLOWED_PATTERNS = [
  /^[A-Z]+$/,                     // All caps acronyms: API, UI, ERP
  /^(true|false|null|undefined)$/i,
  /^\d/,                          // Starts with number
  /^(next|prev|id|href|src|alt)$/i,
];

function isAllowed(text: string): boolean {
  const trimmed = text.trim();
  return ALLOWED_PATTERNS.some(p => p.test(trimmed)) || trimmed.length < 4;
}

async function findHardcodedStrings(): Promise<void> {
  const srcDir = join(process.cwd(), 'src');
  const files  = await glob('src/app/**/page.tsx', { cwd: process.cwd() });

  const allIssues: Issue[] = [];

  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    const lines   = content.split('\n');

    lines.forEach((line, idx) => {
      // Skip lines with t() calls, comments, or imports
      if (line.includes('t(') || line.trimStart().startsWith('//') ||
          line.trimStart().startsWith('import') || line.trimStart().startsWith('*')) {
        return;
      }

      for (const { regex, type } of PATTERNS) {
        regex.lastIndex = 0;
        let match;
        while ((match = regex.exec(line)) !== null) {
          const text = match[1].trim();
          if (!isAllowed(text)) {
            allIssues.push({
              file:  file.replace(/\\/g, '/'),
              line:  idx + 1,
              text,
              type,
            });
          }
        }
      }
    });
  }

  // Group by file
  const byFile = allIssues.reduce((acc, issue) => {
    if (!acc[issue.file]) acc[issue.file] = [];
    acc[issue.file].push(issue);
    return acc;
  }, {} as Record<string, Issue[]>);

  // Report
  const fileCount = Object.keys(byFile).length;
  console.log(`\n🔍 i18n Scanner Results`);
  console.log(`═══════════════════════`);
  console.log(`📄 Files scanned:    ${files.length}`);
  console.log(`⚠️  Files with issues: ${fileCount}`);
  console.log(`📝 Total issues:     ${allIssues.length}\n`);

  if (fileCount > 0) {
    const topFiles = Object.entries(byFile)
      .sort(([, a], [, b]) => b.length - a.length)
      .slice(0, 10);

    console.log('🔝 Top 10 files needing translation:');
    topFiles.forEach(([file, issues]) => {
      const short = file.replace('src/app/', '');
      console.log(`  ${issues.length.toString().padStart(3)} issues → ${short}`);
    });
  }

  // Save JSON report
  const outputPath = join(process.cwd(), 'untranslated-strings.json');
  await writeFile(outputPath, JSON.stringify({ scanned: files.length, byFile }, null, 2));
  console.log(`\n✅ Report saved: untranslated-strings.json`);

  if (allIssues.length > 0) {
    process.exit(fileCount > 20 ? 1 : 0); // Fail CI only if > 20 files
  }
}

findHardcodedStrings().catch(console.error);
