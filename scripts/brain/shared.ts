import * as fs from 'fs';
import * as path from 'path';

export const AI_BRAIN_DIR = '.ai-brain';
export const REPORTS_DIR = 'docs/reports';
export const TMP_AUDIT_DIR = 'tmp/audit';

export const REQUIRED_AI_BRAIN_FILES = [
  '.ai-brain/00-index.md',
  '.ai-brain/01-current-state.md',
  '.ai-brain/02-global-readiness-roadmap.md',
  '.ai-brain/03-quality-and-testing.md',
  '.ai-brain/04-api-and-tenant-isolation.md',
  '.ai-brain/05-financial-governance.md',
  '.ai-brain/06-security-and-compliance.md',
  '.ai-brain/07-saudi-compliance.md',
  '.ai-brain/08-performance-and-scalability.md',
  '.ai-brain/09-devops-backup-rollback-dr.md',
  '.ai-brain/10-product-ux-documentation.md',
  '.ai-brain/11-global-erp-comparison.md',
  '.ai-brain/12-customer-pilot-uat.md',
  '.ai-brain/13-legal-trust-sales-readiness.md',
  '.ai-brain/14-world-class-release-gate.md',
  '.ai-brain/15-approval-gates.md',
  '.ai-brain/16-risk-register.md',
  '.ai-brain/17-gap-register.md',
  '.ai-brain/18-decision-log.md',
  '.ai-brain/19-evidence-index.md',
  '.ai-brain/20-next-actions.md'
];

export const ALLOWED_EVIDENCE_TAGS = [
  'VERIFIED_BY_CODE',
  'VERIFIED_BY_SCHEMA',
  'VERIFIED_BY_TEST',
  'VERIFIED_BY_COMMAND',
  'VERIFIED_BY_REPORT',
  'STRUCTURE_VERIFIED_ONLY',
  'PLAN_ONLY',
  'CLAIMED_ONLY',
  'PARTIAL',
  'NEEDS_EVIDENCE',
  'NOT_VERIFIED',
  'PRODUCTION_NOT_VERIFIED',
  'STOPPED_REQUIRES_EXPLICIT_APPROVAL',
  'ARCHIVE_REPORT',
  'OUTDATED_DOC',
  'SOURCE_DOC'
] as const;

export function assertSafeWritePath(filePath: string): void {
  const normalized = path.normalize(filePath).replace(/\\/g, '/');
  
  const allowedPatterns = [
    /^\.ai-brain\//,
    /^scripts\/brain\//,
    /^docs\/reports\//,
    /^tmp\/audit\//,
    /^tmp\/agent-scan-report\.md$/,
    /^CREATE_BRAIN_GOVERNANCE_SCRIPTS_REPORT\.md$/,
    /^BRAIN_CONSISTENCY_REPORT\.md$/,
    /^BRAIN_EVIDENCE_VALIDATION_REPORT\.md$/,
    /^BRAIN_UPDATE_LOG\.md$/,
    /^OLD_REPORTS_ARCHIVE_INDEX\.md$/,
    /^SECRET_SCAN_REPORT\.md$/,
    /^PRISMA_SCHEMA_AUDIT_REPORT\.md$/,
    /^CI_WORKFLOW_AUDIT_REPORT\.md$/,
    /^[A-Z_0-9]+_REPORT\.md$/,
    /^[A-Z_0-9]+\.json$/,
    /^[A-Z_0-9]+\.csv$/
  ];

  const isAllowed = allowedPatterns.some(pattern => pattern.test(normalized));
  if (!isAllowed) {
    throw new Error(`SECURITY EXCEPTION: Write permission denied for path: ${filePath}`);
  }
}

export function readTextIfExists(filePath: string): string {
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8');
  }
  return '';
}

export function writeTextFileSafe(filePath: string, content: string): void {
  assertSafeWritePath(filePath);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, 'utf-8');
}

export function appendSectionIfMissing(filePath: string, heading: string, section: string): void {
  assertSafeWritePath(filePath);
  let content = readTextIfExists(filePath);
  if (!content.includes(heading)) {
    content = content.trim() + '\n\n' + section.trim() + '\n';
    writeTextFileSafe(filePath, content);
  }
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function nowIsoDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function hasForbiddenPath(filePath: string): boolean {
  const normalized = path.normalize(filePath).replace(/\\/g, '/');
  const forbiddenPatterns = [
    /\.env/,
    /\.env\.local/,
    /\.pem$/,
    /\.key$/,
    /id_rsa/,
    /src\//,
    /prisma\//,
    /package-lock\.json/
  ];
  return forbiddenPatterns.some(pattern => pattern.test(normalized));
}

export function redactSensitiveValue(value: string): string {
  return 'SENSITIVE_VALUE_REDACTED';
}
