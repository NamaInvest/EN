import * as fs from 'fs';
import { writeTextFileSafe } from './shared';

function runReportsArchiver() {
  console.log('Running Old Reports Archiver indexer...');

  const reports = [
    { title: 'GLOBAL_READINESS_MASTER_BASELINE', path: 'GLOBAL_READINESS_MASTER_BASELINE.md', classification: 'EVIDENCE_BASELINE' },
    { title: 'MCP_AND_SKILLS_ACCELERATION_PLAN', path: 'MCP_AND_SKILLS_ACCELERATION_PLAN.md', classification: 'SOURCE_DOC' },
    { title: 'SAFE_READ_ONLY_MCP_AND_SKILLS_BOOTSTRAP_PLAN', path: 'SAFE_READ_ONLY_MCP_AND_SKILLS_BOOTSTRAP_PLAN.md', classification: 'SOURCE_DOC' },
    { title: 'CREATE_SKILL_FILES_REPORT', path: 'CREATE_SKILL_FILES_REPORT.md', classification: 'ARCHIVE_REPORT' },
    { title: 'full_system_file_audit_report', path: 'full_system_file_audit_report.md', classification: 'OUTDATED_DOC' },
    { title: 'full_system_file_audit_report_zero_dependency', path: 'full_system_file_audit_report_zero_dependency.md', classification: 'OUTDATED_DOC' },
    { title: 'FULL_SYSTEM_FILE_AUDIT_REPORT_V3_EVIDENCE_BASED', path: 'FULL_SYSTEM_FILE_AUDIT_REPORT_V3_EVIDENCE_BASED.md', classification: 'ARCHIVE_REPORT' },
    { title: 'FULL_SYSTEM_FILE_AUDIT_REPORT_V3_1_EVIDENCE_BASED_BASELINE', path: 'FULL_SYSTEM_FILE_AUDIT_REPORT_V3_1_EVIDENCE_BASED_BASELINE.md', classification: 'ARCHIVE_REPORT' }
  ];

  const indexedReports: string[] = [];

  for (const r of reports) {
    if (fs.existsSync(r.path)) {
      indexedReports.push(`| \`${r.title}\` | \`${r.path}\` | \`${r.classification}\` | Verified present in repository. |`);
    } else {
      indexedReports.push(`| \`${r.title}\` | \`${r.path}\` | \`NOT_FOUND\` | Report file does not exist in workspace. |`);
    }
  }

  const archivePath = 'OLD_REPORTS_ARCHIVE_INDEX.md';
  const mdContent = `# OLD REPORTS ARCHIVE INDEX

## Summary
هذا المستند يمثل سجل الأرشفة والفهرسة التاريخية لكافة التقارير وخطط العمل الصادرة في جلسات التدقيق السابقة، لضمان عدم حدوث أي تضارب أو تداخل لمعطيات الذاكرة السليمة.

## Indexed Reports
| التقرير التاريخي (Report) | مسار الملف (Path) | التصنيف المعتمد للأرشفة | حالة الفحص وملاحظة الذاكرة |
| ------------------------- | ----------------- | --------------------- | -------------------------- |
${indexedReports.join('\n')}

## Result
تمت الفهرسة بنجاح صامت ودون حذف أي ملف تاريخي في المستودع.
`;

  writeTextFileSafe(archivePath, mdContent);
  console.log(`Reports archiver indexer completed. Saved to ${archivePath}`);
}

runReportsArchiver();
