import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * List of paths where synchronous file operations are allowed/justified
 * (e.g. reading certificates, localized help docs, or backup files).
 */
const ALLOWED_SYNC_PATHS = [
  'api/admin/nodes/sync',
  'api/help',
  'api/ice/backup/download',
  'api/ice/backup/upload',
  'api/zatca/generate-request',
  'api-docs',
  'sentry-example-page'
];

/**
 * Recurse through directories looking for route.ts or page.tsx files
 * and ensure they do not invoke blocking synchronous operations.
 */
function scanForSyncBlockers(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) {
    return fileList;
  }
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.next' && file !== 'reference-repos') {
        scanForSyncBlockers(filePath, fileList);
      }
    } else if (file === 'route.ts' || file === 'page.tsx') {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Look for sync file operations (excluding comments)
      const hasSyncRead = /readFileSync\(/g.test(content) && !content.includes('* readFileSync');
      const hasSyncWrite = /writeFileSync\(/g.test(content) && !content.includes('* writeFileSync');
      
      if (hasSyncRead || hasSyncWrite) {
        // Check if path is in the allowed list
        const normalizedPath = filePath.replace(/\\/g, '/');
        const isAllowed = ALLOWED_SYNC_PATHS.some(allowedPath => normalizedPath.includes(allowedPath));
        
        if (!isAllowed) {
          fileList.push(filePath);
        }
      }
    }
  });
  return fileList;
}

describe('Event Loop Performance Governance (SCN-PERF-001)', () => {
  it('should ensure no synchronous block files exist in critical transactions routes', () => {
    // Scan critical API and dashboard paths
    const apiPath = path.resolve(__dirname, '../src/app/api');
    const blockers = scanForSyncBlockers(apiPath);
    
    // We assert that there are no synchronous blockages in transactional APIs
    // to maintain a responsive event loop.
    expect(blockers).toEqual([]);
  });
});
