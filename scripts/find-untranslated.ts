// @ts-ignore
import pkg from 'glob';
const { sync: globSync } = pkg;
import { readFile } from 'fs/promises';

async function findHardcodedStrings() {
  const files = globSync('src/app/(dashboard)/**/page.tsx');
  const issues: Array<{ file: string; line: number; text: string }> = [];

  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, i) => {
      // Match >English text<
      const match = line.match(/>\s*([A-Z][a-zA-Z\s]{3,})\s*</);
      if (match && !line.includes('t(')) {
        issues.push({ file, line: i + 1, text: match[1].trim() });
      }
    });
  }

  console.log(`Found ${issues.length} hardcoded English strings.`);
  // print first 20
  issues.slice(0, 20).forEach(issue => {
      console.log(`${issue.file}:${issue.line} - "${issue.text}"`);
  });

  return issues;
}

findHardcodedStrings();
