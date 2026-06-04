import fs from 'fs';
import path from 'path';
import { maskSecrets } from './masking';
import { denyWriteOperation } from './read-only-policy';

export async function readTmpReport(fileName: string): Promise<string> {
  // Prevent path traversal
  const cleanName = path.basename(fileName);
  if (!cleanName.startsWith('customer-onboarding-') && !cleanName.endsWith('.md')) {
    throw new Error('Access Denied: Can only read customer-onboarding-*.md reports.');
  }

  const reportPath = path.join(process.cwd(), 'tmp', cleanName);
  if (!fs.existsSync(reportPath)) {
    throw new Error(`Report not found: ${cleanName}`);
  }

  const content = fs.readFileSync(reportPath, 'utf8');
  return maskSecrets(content);
}

export async function listTmpReports(): Promise<string[]> {
  const tmpDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tmpDir)) return [];

  const files = fs.readdirSync(tmpDir);
  return files.filter(f => f.startsWith('customer-onboarding-') && f.endsWith('.md'));
}

export function writeTmpReport(): never {
  denyWriteOperation('Writing or modifying reports is strictly forbidden.');
}

export function deleteTmpReport(): never {
  denyWriteOperation('Deleting reports is strictly forbidden.');
}
